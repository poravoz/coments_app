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

  async getAllUsers(): Promise<UserEntity[]> {
    return await this.usersRepository.find({ relations: ['comments'] });
  }

  async getUserById(id: string): Promise<UserEntity[]> {
    if (!id) {
      return [];
    }
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['comments'],
    });
    return user ? [user] : [];
  }

  async getUserByEmail(email: string): Promise<UserEntity[]> {
    if (!email) {
      return [];
    }
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['comments'],
    });
    return user ? [user] : [];
  }

  async createUser(userData: CreateUserDto): Promise<UserEntity> {
    const newUser = this.usersRepository.create(userData);
    return await this.usersRepository.save(newUser);
  }

  async updateUser(id: string, updateData: Partial<UpdateUserDto>): Promise<UserEntity> {
    const users = await this.getUserById(id);
    if (users.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    const user = users[0]; // Take the first user
    Object.assign(user, updateData);
    return await this.usersRepository.save(user);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UserEntity> {
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    if (!['image/jpeg', 'image/gif', 'image/png'].includes(file.mimetype)) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    const users = await this.getUserById(userId);
    if (users.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    const user = users[0];
    const result = await this.uploadToCloudinary(file);
    await this.usersRepository.update(userId, { avatarUrl: result.secure_url });
    const updatedUser = (await this.getUserById(userId))[0];
    if (!updatedUser) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return updatedUser;
  }

  async removeAvatar(userId: string): Promise<UserEntity> {
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    const users = await this.getUserById(userId);
    if (users.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    await this.usersRepository.update(userId, { avatarUrl: null });
    const updatedUser = (await this.getUserById(userId))[0];
    if (!updatedUser) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return updatedUser;
  }

  async removeUser(id: string): Promise<UserEntity> {
    const users = await this.getUserById(id);
    if (users.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    const user = users[0];
    return await this.usersRepository.remove(user);
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, {
      currentHashedRefreshToken,
    });
  }

  async getById(id: string): Promise<UserEntity[]> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user ? [user] : [];
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string): Promise<UserEntity | null> {
    const users = await this.getById(userId);
    if (users.length === 0) {
      return null;
    }
    const user = users[0];
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
}