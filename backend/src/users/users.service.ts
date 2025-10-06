import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import * as bcrypt from 'bcrypt';
import cloudinary from '../database/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  private async uploadToCloudinary(file: Express.Multer.File): Promise<{ secure_url: string }> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR));
          }
          resolve({ secure_url: result.secure_url });
        }
      );
      stream.end(file.buffer);
    });
  }

  async getAllUsers() {
    return await this.usersRepository.find({ relations: ['comments'] }); 
  }

  async getUserById(id: string) {
    if (!id) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    const user = await this.usersRepository.findOne({ 
      where: { id },
      relations: ['comments']
    });
    if (!user) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findOne({ 
      where: { email },
      relations: ['comments'] 
    });
    if (user) return user;
    throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
  }

  async createUser(userData: CreateUserDto) {
    const newUser = this.usersRepository.create(userData);
    return await this.usersRepository.save(newUser);
  }

  async updateUser(id: string, updateData: Partial<UpdateUserDto>) {
    const user = await this.getUserById(id);
    Object.assign(user, updateData);
    return await this.usersRepository.save(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    if (!['image/jpeg', 'image/gif', 'image/png'].includes(file.mimetype)) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    const result = await this.uploadToCloudinary(file);
    await this.usersRepository.update(userId, { avatarUrl: result.secure_url });
    const updatedUser = await this.getUserById(userId);
    return updatedUser;
  }

  async removeAvatar(userId: string) {
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    await this.usersRepository.update(userId, { avatarUrl: null });
    const updatedUser = await this.getUserById(userId);
    return updatedUser;
  }

  async removeUser(id: string) {
    const user = await this.getUserById(id);
    return await this.usersRepository.remove(user); 
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      currentHashedRefreshToken
    });
  }

  async getById(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (user) {
      return user;
    }
    throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
  }
 
  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.getById(userId);
    if (!user.currentHashedRefreshToken) return null;
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken
    );
    if (isRefreshTokenMatching) {
      return user;
    }
    return null;
  }

  async removeRefreshToken(userId: string) {
    return this.usersRepository.update(userId, {
      currentHashedRefreshToken: null
    });
  }
}