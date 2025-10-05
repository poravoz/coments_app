import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import CommentsService from './comments.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyCommentDto';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { TokenPayload } from '../authentication/interfaces/tokenPayload.interface';

interface AuthRequest extends Request {
  user: TokenPayload;
}

@Controller('comments')
export default class CommentsController {
    constructor(
        private readonly commentsService: CommentsService
    ) {}

    @Get()
    getAllComments() {
        return this.commentsService.getAllComments();
    }

    @Get(':id')
    getCommentById(@Param('id') id: string) {
        return this.commentsService.getCommentById(id);
    }
    
    @Post()
    @UseGuards(JwtRefreshGuard)
    async createComment(@Body() comment: CreateCommentDto, @Req() req: AuthRequest) {
        const userId = req.user.userId; 
        return this.commentsService.createComment({ ...comment, userId });
    }

    @Post(':parentId/replies')
    @UseGuards(JwtRefreshGuard)
    async createReply(
      @Param('parentId') parentId: string, 
      @Body() reply: CreateReplyDto, 
      @Req() req: AuthRequest
    ) {
        const userId = req.user.userId;
        return this.commentsService.createReply(parentId, reply, userId);
    }

    @Patch(':id')
    async replaceComment(@Param('id') id: string, @Body() comment: UpdateCommentDto) {
        return this.commentsService.updateComment(id, comment);
    }

    @Delete(':id')
    async deleteComment(@Param('id') id: string) {
      return this.commentsService.deleteComment(id);
    }
}