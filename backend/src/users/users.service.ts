import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async getAllUsers() {
    return await this.usersRepository.find({ relations: ['comments'] }); 
  }

  async getUserById(id: string) {
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

  async updateUser(id: string, updateData: Partial<CreateUserDto>) {
    const user = await this.getUserById(id);
    Object.assign(user, updateData);
    return await this.usersRepository.save(user);
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
    const user = await this.usersRepository.findOne({ where: {id} });
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
