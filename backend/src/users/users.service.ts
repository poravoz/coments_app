import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import * as bcrypt from 'bcrypt';
import cloudinary from '../database/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { PubSub } from 'graphql-subscriptions';

@Injectable()
export class UsersService {
  private pubSub: PubSub;

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {
    this.pubSub = new PubSub();
  }

  private async uploadToCloudinary(file: Express.Multer.File, resource_type: 'image' | 'video' | 'raw'): Promise<{ secure_url: string }> {
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { 
          resource_type,
          public_id: file.originalname.replace(/\.[^/.]+$/, ""),
          use_filename: true,
          unique_filename: false,
          overwrite: true
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('Something went wrong', error);
            return (error || new Error('Upload to Cloudinary failed'));
          }
          resolve({ secure_url: result.secure_url });
        }
      );
      stream.end(file.buffer);
    });
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.usersRepository.find({ relations: ['comments'] });
  }

  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['comments'],
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async createUser(userData: CreateUserDto): Promise<UserEntity> {
    const newUser = this.usersRepository.create(userData);
    return await this.usersRepository.save(newUser);
  }

  async updateUser(id: string, updateData: Partial<UpdateUserDto>): Promise<UserEntity> {
    const user = await this.getUserById(id);
    Object.assign(user, updateData);
    const updatedUser = await this.usersRepository.save(user);
    
    // Publish real-time update
    this.pubSub.publish('userUpdated', { userUpdated: updatedUser });
    
    return updatedUser;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UserEntity> {
    if (!['image/jpeg', 'image/gif', 'image/png'].includes(file.mimetype)) {
      throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
    }
    

    const user = await this.getUserById(userId);
    const result = await this.uploadToCloudinary(file, 'image');
    
    user.avatarUrl = result.secure_url;
    const updatedUser = await this.usersRepository.save(user);
    
    
    this.pubSub.publish('avatarUpdated', { 
      avatarUpdated: {
        id: updatedUser.id,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl
      }
    });

    this.pubSub.publish('userUpdated', { 
      userUpdated: {
        id: updatedUser.id,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl
      }
    });
    
    return updatedUser;
  }
  async removeAvatar(userId: string): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    user.avatarUrl = null;
    const updatedUser = await this.usersRepository.save(user);
    
    this.pubSub.publish('avatarUpdated', { 
      avatarUpdated: {
        id: updatedUser.id,
        name: updatedUser.name,
        avatarUrl: null
      }
    });

    this.pubSub.publish('userUpdated', { 
      userUpdated: {
        id: updatedUser.id,
        name: updatedUser.name,
        avatarUrl: null
      }
    });
    
    return updatedUser;
  }

  async removeUser(id: string): Promise<UserEntity> {
    const user = await this.getUserById(id);
    return await this.usersRepository.remove(user);
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      currentHashedRefreshToken,
    });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string): Promise<UserEntity | null> {
    const user = await this.getUserById(userId);
    if (!user.currentHashedRefreshToken) {
      return null;
    }
    const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.currentHashedRefreshToken);
    if (isRefreshTokenMatching) {
      return user;
    }
    return null;
  }

  async removeRefreshToken(userId: string) {
    return this.usersRepository.update(userId, {
      currentHashedRefreshToken: null,
    });
  }

  getUserUpdatedSubscription() {
    return this.pubSub.asyncIterableIterator('userUpdated');
  }
  
  getAvatarUpdatedSubscription() {
    return this.pubSub.asyncIterableIterator('avatarUpdated');
  }
}