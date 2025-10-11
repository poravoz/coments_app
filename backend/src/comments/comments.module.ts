import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { UsersModule } from '../users/users.module';
import CommentsController from './comments.controller';
import { PubSubModule } from 'src/pubsub/pubsub.module';
import { SearchModule } from 'src/search/search.module';
import CommentSearchService from './commentSearch.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity]),
    UsersModule,
    PubSubModule,
    SearchModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsResolver, CommentSearchService],
  exports: [CommentsService],
})
export class CommentsModule {}