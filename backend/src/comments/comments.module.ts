import { Module } from '@nestjs/common';
import CommentsController from './comments.controller';
import CommentsService from './comments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [TypeOrmModule.forFeature([CommentEntity]), UsersModule],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}