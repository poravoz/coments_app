import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyComment.dto';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CommentEntity } from './entities/comment.entity';
import { CommentResponse } from './interface/comment-response.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import CommentSearchService from './commentSearch.service';

@Controller('comments')
export default class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly commentSearchService: CommentSearchService,
  ) {}

  @Get()
  async getComments(
    @Query('search') search?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ): Promise<CommentResponse[] | CommentEntity[]> {
    if (search) {
      const comments = await this.commentsService.searchForComments(search, sort);
      return comments;
    }

    const comments = await this.commentsService.getAllComments();

    return comments
      .sort((a, b) =>
        sort === 'asc'
          ? a.createdAt.getTime() - b.createdAt.getTime()
          : b.createdAt.getTime() - a.createdAt.getTime(),
      )
      .map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toLocaleString('uk-UA', { hour12: false }),
      }));
  }

  @Get(':id')
  async getCommentById(@Param('id') id: string): Promise<CommentResponse> {
    const comment = await this.commentsService.getCommentById(id);
    return {
      ...comment,
      createdAt: comment.createdAt.toLocaleString('uk-UA', { hour12: false }),
    };
  }

  @Post()
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'attachment', maxCount: 1 },
    ]),
  )
  async createComment(
    @Body(ValidationPipe) commentDto: CreateCommentDto,
    @Req() req: Request & { user: UserEntity },
    @UploadedFiles()
    files?: { images?: Express.Multer.File[]; video?: Express.Multer.File[]; attachment?: Express.Multer.File[] },
  ): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      console.error('[CommentsController] Unauthorized: No userId in request');
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const hasComment = commentDto.comment && commentDto.comment.trim().length > 0;
    const hasFiles =
      files &&
      ((files.images && files.images.length > 0) ||
        (files.video && files.video.length > 0) ||
        (files.attachment && files.attachment.length > 0));

    if (!hasComment && !hasFiles) {
      console.error('[CommentsController] Invalid input: Comment or files required');
      throw new HttpException('Comment or files required', HttpStatus.BAD_REQUEST);
    }

    const comment = await this.commentsService.createComment(commentDto, userId, files);
    return comment;
  }

  @Post(':parentId/replies')
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'attachment', maxCount: 1 },
    ]),
  )
  async createReply(
    @Param('parentId') parentId: string,
    @Body(ValidationPipe) replyDto: CreateReplyDto,
    @Req() req: Request & { user: UserEntity },
    @UploadedFiles()
    files?: { images?: Express.Multer.File[]; video?: Express.Multer.File[]; attachment?: Express.Multer.File[] },
  ): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      console.error('[CommentsController] Unauthorized: No userId in request');
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const hasComment = replyDto.comment && replyDto.comment.trim().length > 0;
    const hasFiles =
      files &&
      ((files.images && files.images.length > 0) ||
        (files.video && files.video.length > 0) ||
        (files.attachment && files.attachment.length > 0));

    if (!hasComment && !hasFiles) {
      console.error('[CommentsController] Invalid input: Comment or files required');
      throw new HttpException('Comment or files required', HttpStatus.BAD_REQUEST);
    }

    const reply = await this.commentsService.createReply(parentId, replyDto, userId, files);
    return reply;
  }

  @Patch(':id')
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'attachment', maxCount: 1 },
    ]),
  )
  async updateComment(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateCommentDto,
    @Req() req: Request & { user: UserEntity },
    @UploadedFiles()
    files?: { images?: Express.Multer.File[]; video?: Express.Multer.File[]; attachment?: Express.Multer.File[] },
  ): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      console.error('[CommentsController] Unauthorized: No userId in request');
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const hasCommentUpdate = updateDto.comment !== undefined;
    const hasFiles =
      files &&
      ((files.images && files.images.length > 0) ||
        (files.video && files.video.length > 0) ||
        (files.attachment && files.attachment.length > 0));

    if (!hasCommentUpdate && !updateDto.clearAttachments && !hasFiles) {
      console.error('[CommentsController] Nothing to update for comment id:', id);
      throw new HttpException('Nothing to update', HttpStatus.BAD_REQUEST);
    }

    const updatedComment = await this.commentsService.updateComment(id, updateDto, userId, files);

    if (!updatedComment.user || !updatedComment.user.id) {
      console.error('[CommentsController] User not found for updated comment id:', id);
      throw new HttpException('User not found for the comment', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await this.commentSearchService.update({
      id: updatedComment.id!,
      comment: updatedComment.comment!,
      createdAt: updatedComment.createdAt,
      userId: updatedComment.user.id,
    });

    return updatedComment;
  }

  @Delete(':id')
  @UseGuards(JwtRefreshGuard)
  async deleteComment(@Param('id') id: string): Promise<CommentEntity> {
    const deletedComment = await this.commentsService.deleteComment(id);
    if (!deletedComment) {
      console.error('[CommentsController] Comment not found for deletion, id:', id);
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    await this.commentSearchService.remove(id);
    return deletedComment;
  }
}