import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity, Attachment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyCommentDto';
import { UsersService } from 'src/users/users.service';
import cloudinary from '../database/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CommentResponse } from './interface/comment-response.dto';

@Injectable()
export default class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private readonly usersService: UsersService
  ) {}

  private async uploadToCloudinary(file: Express.Multer.File, resource_type: 'image' | 'video' | 'raw'): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve({ secure_url: result.secure_url });
        }
      );
      stream.end(file.buffer);
    });
  }

  private async processFiles(files: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] }): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    // Process images
    if (files.images && files.images.length > 0) {
      for (const image of files.images) {
        if (!['image/jpeg', 'image/gif', 'image/png'].includes(image.mimetype)) {
          throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
        }
        const result = await this.uploadToCloudinary(image, 'image');
        attachments.push({ type: 'image', url: result.secure_url });
      }
    }

    // Process video
    if (files.video && files.video.length > 0) {
      const video = files.video[0];
      if (!video.mimetype.startsWith('video/')) {
        throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
      }
      const result = await this.uploadToCloudinary(video, 'video');
      attachments.push({ type: 'video', url: result.secure_url });
    }

    // Process text file
    if (files.textFile && files.textFile.length > 0) {
      const textFile = files.textFile[0];
      if (textFile.mimetype !== 'text/plain') {
        throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
      }
      if (textFile.size > 100 * 1024) {
        throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
      }
      const result = await this.uploadToCloudinary(textFile, 'raw');
      attachments.push({ type: 'text', url: result.secure_url });
    }

    return attachments;
  }

  async getAllComments(): Promise<CommentResponse[]> {
    const comments = await this.commentRepository.find({ 
      relations: ['user', 'children'] 
    });
    return comments.map(comment => ({
      ...comment,
      createdAt: comment.createdAt.toLocaleString('uk-UA', { hour12: false }),
    }));
  }

  async getCommentById(id: string): Promise<CommentResponse> {
    const comment = await this.commentRepository.findOne({ 
      where: { id },
      relations: ['user', 'children']
    });
    if (!comment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return {
      ...comment,
      createdAt: comment.createdAt.toLocaleString('uk-UA', { hour12: false }),
    };
  }

  async createComment(commentDto: CreateCommentDto & { userId: string }, files: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] }): Promise<CommentEntity> {
    const user = await this.usersService.getUserById(commentDto.userId);
    const attachments = await this.processFiles(files);
    const newComment = this.commentRepository.create({
      comment: commentDto.comment,
      user,
      parentId: commentDto.parentId || null,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    await this.commentRepository.save(newComment);
    return newComment; 
  }

  async createReply(parentId: string, replyDto: CreateReplyDto, userId: string, files: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] }): Promise<CommentEntity> {
    const parentComment = await this.commentRepository.findOne({ 
      where: { id: parentId },
      relations: ['children']
    });
    if (!parentComment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }

    const user = await this.usersService.getUserById(userId);
    const attachments = await this.processFiles(files);
    const newReply = this.commentRepository.create({
      comment: replyDto.comment,
      user,
      parentId: parentId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    await this.commentRepository.save(newReply);
    return newReply;
  }

  async updateComment(id: string, commentDto: UpdateCommentDto, files?: { images?: Express.Multer.File[], video?: Express.Multer.File[], textFile?: Express.Multer.File[] }): Promise<CommentEntity> {
    let attachments: Attachment[] | undefined;
    if (files) {
      attachments = await this.processFiles(files);
    }
    await this.commentRepository.update(id, { 
      comment: commentDto.comment,
      attachments: attachments && attachments.length > 0 ? attachments : undefined 
    });
    const updatedComment = await this.commentRepository.findOne({ 
      where: { id },
      relations: ['user'] 
    });
    if (!updatedComment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    return updatedComment;
  }

  async deleteComment(id: string): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({ 
      where: { id }, 
      relations: ['user', 'children'] 
    });
    if (!comment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
  
    if (comment.children && comment.children.length > 0) {
      for (const child of comment.children) {
        if (child && child.id) {
          await this.deleteComment(child.id);
        }
      }
    }
  
    return await this.commentRepository.remove(comment);
  }

  async getCommentsByUserId(userId: string): Promise<CommentEntity[]> {
    return await this.commentRepository.find({
      where: { user: { id: userId } },
      relations: ['user']
    });
  }
}