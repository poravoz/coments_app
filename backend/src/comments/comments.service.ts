import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyCommentDto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export default class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private readonly usersService: UsersService
  ) {}

  async getAllComments() {
    const comments = await this.commentRepository.find({ relations: ['user'] });
    return comments.map(comment => ({
      ...comment,
      createdAt: comment.createdAt.toLocaleString('uk-UA', { hour12: false }),
    }));
  }

  async getCommentById(id: string) {
    const comment = await this.commentRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
    if (!comment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return {
      ...comment,
      createdAt: comment.createdAt.toLocaleString('uk-UA', { hour12: false }),
    };
  }

  async createComment(commentDto: CreateCommentDto) {
    const user = await this.usersService.getUserById(commentDto.userId);
    const newComment = this.commentRepository.create({
      comment: commentDto.comment,
      user,
      parentId: commentDto.parentId || null,
    });
    await this.commentRepository.save(newComment);
    return newComment; 
  }

  async createReply(parentId: string, replyDto: CreateReplyDto, userId: string) {
    const parentComment = await this.commentRepository.findOne({ where: { id: parentId } });
    if (!parentComment) {
      throw new HttpException('Parent comment not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.usersService.getUserById(userId);
    const newReply = this.commentRepository.create({
      comment: replyDto.comment,
      user,
      parentId: parentId,
    });
    await this.commentRepository.save(newReply);
    return newReply;
  }

  async updateComment(id: string, commentDto: UpdateCommentDto) {
    await this.commentRepository.update(id, { ...commentDto });
    const updatedComment = await this.commentRepository.findOne({ 
      where: { id },
      relations: ['user'] 
    });
    if (!updatedComment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return updatedComment;
  }

  async deleteComment(id: string) {
    const comment = await this.commentRepository.findOne({ where: { id }, relations: ['user'] });
    if (!comment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return await this.commentRepository.remove(comment);
  }
}