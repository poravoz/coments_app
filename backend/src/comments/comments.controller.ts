import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFiles, UseGuards, UseInterceptors, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import CommentsService from './comments.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyComment.dto';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CommentEntity } from './entities/comment.entity';
import { CommentResponse } from './interface/comment-response.dto';
import { UserEntity } from 'src/users/entities/user.entity';

@Controller('comments')
export default class CommentsController {
  constructor(
    private readonly commentsService: CommentsService
  ) {}

  @Get()
  getAllComments(): Promise<CommentResponse[]> {
    return this.commentsService.getAllComments();
  }

  @Get(':id')
  getCommentById(@Param('id') id: string): Promise<CommentResponse> {
    return this.commentsService.getCommentById(id);
  }
  
  @Post()
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 }, // Supports multiple images
    { name: 'video', maxCount: 1 },
    { name: 'attachment', maxCount: 1 }, // Supports .txt, .docx, etc.
  ]))
  async createComment(
    @Body(ValidationPipe) commentDto: CreateCommentDto, 
    @Req() req: Request & { user: UserEntity },
    @UploadedFiles() files?: { images?: Express.Multer.File[], video?: Express.Multer.File[], attachment?: Express.Multer.File[] },
  ): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    }

    // Allow creating a comment with text and/or files (e.g., images)
    const hasComment = commentDto.comment && commentDto.comment.trim().length > 0;
    const hasFiles = files && (
      (files.images && files.images.length > 0) ||
      (files.video && files.video.length > 0) ||
      (files.attachment && files.attachment.length > 0)
    );
    
    if (!hasComment && !hasFiles) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    
    return this.commentsService.createComment(commentDto, userId, files);
  }

  @Post(':parentId/replies')
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
    { name: 'attachment', maxCount: 1 },
  ]))
  async createReply(
    @Param('parentId') parentId: string, 
    @Body(ValidationPipe) replyDto: CreateReplyDto, 
    @Req() req: Request & { user: UserEntity },
    @UploadedFiles() files?: { images?: Express.Multer.File[], video?: Express.Multer.File[], attachment?: Express.Multer.File[] },
  ): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    }

    const hasComment = replyDto.comment && replyDto.comment.trim().length > 0;
    const hasFiles = files && (
      (files.images && files.images.length > 0) ||
      (files.video && files.video.length > 0) ||
      (files.attachment && files.attachment.length > 0)
    );
    
    if (!hasComment && !hasFiles) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    
    return this.commentsService.createReply(parentId, replyDto, userId, files);
  }

  @Patch(':id')
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
    { name: 'attachment', maxCount: 1 },
  ]))
  async updateComment(
    @Param('id') id: string, 
    @Body(ValidationPipe) updateDto: UpdateCommentDto,
    @Req() req: Request & { user: UserEntity },
    @UploadedFiles() files?: { images?: Express.Multer.File[], video?: Express.Multer.File[], attachment?: Express.Multer.File[] },
  ): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    }

    // Allow updating comment and/or attachments, or clearing attachments while keeping comment
    const hasCommentUpdate = updateDto.comment !== undefined;
    const hasFiles = files !== undefined && (
      (files.images && files.images.length > 0) ||
      (files.video && files.video.length > 0) ||
      (files.attachment && files.attachment.length > 0)
    );
    
    if (!hasCommentUpdate && !updateDto.clearAttachments && files === undefined) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
    
    return this.commentsService.updateComment(id, updateDto, userId, files);
  }

  @Delete(':id')
  @UseGuards(JwtRefreshGuard)
  async deleteComment(@Param('id') id: string, @Req() req: Request & { user: UserEntity }): Promise<CommentEntity> {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpException('Something went wrong', HttpStatus.UNAUTHORIZED);
    }
    return this.commentsService.deleteComment(id);
  }
}