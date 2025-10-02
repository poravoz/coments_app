import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export default class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private readonly usersService: UsersService
  ) {}

  async getAllComments() {
    return await this.commentRepository.find({ relations: ['user'] });
  }

  async getCommentById(id: string) {
    const comment = await this.commentRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
    if (!comment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return comment;
  }

  async createComment(commentDto: CreateCommentDto) {
    const user = await this.usersService.getUserById(commentDto.userId);
    const newComment = this.commentRepository.create({
      comment: commentDto.comment,
      user
    });
    await this.commentRepository.save(newComment);
    return newComment;
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
    const comment = await this.getCommentById(id);
    return await this.commentRepository.remove(comment);
  }
}