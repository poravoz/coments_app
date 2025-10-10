import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { UsersModule } from '../users/users.module';
import CommentsController from './comments.controller';
import { PubSubModule } from 'src/pubsub/pubsub.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity]),
    UsersModule,
    PubSubModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsResolver],
  exports: [CommentsService],
})
export class CommentsModule {}