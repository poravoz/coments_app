import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Res, UseGuards } from '@nestjs/common';
import CommentsService from './comments.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import JwtAuthenticationGuard from '../authentication/jwt-strategy/jwt-authentication.guard';

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
    @UseGuards(JwtAuthenticationGuard)
    async createComment(@Body() comment: CreateCommentDto) {
        return this.commentsService.createComment(comment);
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