import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFiles, UseGuards, UseInterceptors, ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import CommentsService from './comments.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyCommentDto';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { TokenPayload } from '../authentication/interfaces/tokenPayload.interface';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CommentEntity } from './entities/comment.entity';
import { CommentResponse } from './interface/comment-response.dto';

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
      { name: 'images', maxCount: 5 },
      { name: 'video', maxCount: 1 },
      { name: 'textFile', maxCount: 1 },
    ]))
    async createComment(
      @Body(ValidationPipe) comment: CreateCommentDto, 
      @Req() req: Request & { user: TokenPayload },
      @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] },
    ): Promise<CommentEntity> {
        const hasComment = comment.comment && comment.comment.trim().length > 0;
        const hasFiles = files && (files.images?.length || files.video?.length || files.textFile?.length);
        if (!hasComment && !hasFiles) {
            throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
        }
        const userId = req.user.userId; 
        return this.commentsService.createComment({ ...comment, userId }, files);
    }

    @Post(':parentId/replies')
    @UseGuards(JwtRefreshGuard)
    @UseInterceptors(FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'video', maxCount: 1 },
      { name: 'textFile', maxCount: 1 },
    ]))
    async createReply(
      @Param('parentId') parentId: string, 
      @Body(ValidationPipe) reply: CreateReplyDto, 
      @Req() req: Request & { user: TokenPayload },
      @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] },
    ): Promise<CommentEntity> {
        const hasComment = reply.comment && reply.comment.trim().length > 0;
        const hasFiles = files && (files.images?.length || files.video?.length || files.textFile?.length);
        if (!hasComment && !hasFiles) {
            throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
        }
        const userId = req.user.userId;
        return this.commentsService.createReply(parentId, reply, userId, files);
    }

    @Patch(':id')
    @UseInterceptors(FileFieldsInterceptor([
      { name: 'images', maxCount: 5 },
      { name: 'video', maxCount: 1 },
      { name: 'textFile', maxCount: 1 },
    ]))
    async replaceComment(
      @Param('id') id: string, 
      @Body(ValidationPipe) comment: UpdateCommentDto,
      @UploadedFiles() files: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] },
    ): Promise<CommentEntity> {
        const hasComment = comment.comment && comment.comment.trim().length > 0;
        const hasFiles = files && (files.images?.length || files.video?.length || files.textFile?.length);
        if (!hasComment && !hasFiles) {
            throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
        }
        return this.commentsService.updateComment(id, comment, files);
    }

    @Delete(':id')
    async deleteComment(@Param('id') id: string): Promise<CommentEntity> {
      return this.commentsService.deleteComment(id);
    }
}