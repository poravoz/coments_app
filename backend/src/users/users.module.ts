import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { PubSubModule } from 'src/pubsub/pubsub.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), PubSubModule],
  providers: [UsersService, UsersResolver],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}