import { Controller, Get, Param, Post, Body, Patch, Delete, UseInterceptors, UploadedFile, UseGuards, HttpException, HttpStatus, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { Request } from 'express';
import { UserEntity } from './entities/user.entity'; 

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAll() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<UpdateUserDto>) {
    return this.usersService.updateUser(id, updateData);
  }

  @Post('avatar')
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: UserEntity } 
  ) {
    if (!req.user || !req.user.id) {
      throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    }
    if (!file) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @Delete('avatar')
  @UseGuards(JwtRefreshGuard)
  async removeAvatar(@Req() req: Request & { user: UserEntity }) { 
    if (!req.user || !req.user.id) {
      throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    }
    return this.usersService.removeAvatar(req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.removeUser(id);
  }
}