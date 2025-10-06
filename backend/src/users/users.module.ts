import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        MulterModule.register({
            storage: memoryStorage(),
        }),
    ],
    providers: [UsersService],
    exports: [UsersService],
    controllers: [UsersController]
})
export class UsersModule {}