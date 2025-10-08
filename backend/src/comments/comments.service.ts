import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { UsersService } from 'src/users/users.service';
import cloudinary from '../database/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CommentResponse } from './interface/comment-response.dto';
import { CreateReplyDto } from './dto/createReplyCommentDto';
import { Attachment } from './interface/attachment.dto';


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
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            return reject(error || new Error('Upload to Cloudinary failed'));
          }
          resolve({ secure_url: result.secure_url });
        }
      );
      stream.end(file.buffer);
    });
  }

  private async processFiles(files?: 
                              { images?: Express.Multer.File[], 
                                video?: Express.Multer.File[], 
                                attachment?: Express.Multer.File[] }): 
                              Promise<Attachment[]> {

    const attachments: Attachment[] = [];

    if (files?.images && files.images.length > 0) {
      for (const image of files.images) {
        if (!['image/jpeg', 'image/gif', 'image/png'].includes(image.mimetype)) {
          throw new HttpException(`Something went wrong: ${image.mimetype}`, HttpStatus.BAD_REQUEST);
        }

        const result = await this.uploadToCloudinary(image, 'image');
        attachments.push({ type: 'image', url: result.secure_url });
      }
    }

    if (files?.video && files.video.length > 0) {
      const video = files.video[0];
      if (!video.mimetype.startsWith('video/')) {
        throw new HttpException(`Something went wrong: ${video.mimetype}`, HttpStatus.BAD_REQUEST);
      }
      const result = await this.uploadToCloudinary(video, 'video');
      attachments.push({ type: 'video', url: result.secure_url });
    }

    if (files?.attachment && files.attachment.length > 0) {
      const attachmentFile = files.attachment[0];
      const allowedMimetypes = [
        'text/plain',
        'application/octet-stream',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/pdf',
        'application/vnd.ms-excel'
      ];
      if (!allowedMimetypes.includes(attachmentFile.mimetype)) {
        throw new HttpException(`Something went wrong: ${attachmentFile.mimetype}`, HttpStatus.BAD_REQUEST);
      }
      if (attachmentFile.size > 100 * 1024) {
        throw new HttpException('The file size is 100 KB', HttpStatus.BAD_REQUEST);
      }
      try {
        const result = await this.uploadToCloudinary(attachmentFile, 'raw');
        attachments.push({ type: 'attachment', url: result.secure_url });
      } catch (error) {
        console.error('Error uploading attachment to Cloudinary:', error);
        throw new HttpException(`Something went wrong: ${error.message}`, HttpStatus.BAD_REQUEST);
      }
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

  async createComment(commentDto: CreateCommentDto, 
                      userId: string, 
                      files?: { 
                        images?: Express.Multer.File[], 
                        video?: Express.Multer.File[], 
                        attachment?: Express.Multer.File[] }): 
                      Promise<CommentEntity> {

    const users = await this.usersService.getUserById(userId);
    if (users.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    const user = users[0];
    const attachments = files ? await this.processFiles(files) : [];
    const newComment = this.commentRepository.create({
      comment: commentDto.comment,
      user,
      parentId: commentDto.parentId || null,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    await this.commentRepository.save(newComment);
    return newComment; 
  }

  async createReply(parentId: string, 
                    replyDto: CreateReplyDto, 
                    userId: string, files?: { 
                      images?: Express.Multer.File[], 
                      video?: Express.Multer.File[], 
                      attachment?: Express.Multer.File[] }): 
                    Promise<CommentEntity> {

    const parentComment = await this.commentRepository.findOne({ 
      where: { id: parentId },
      relations: ['children']
    });
    if (!parentComment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }

    const users = await this.usersService.getUserById(userId);
    if (users.length === 0) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    const user = users[0];
    const attachments = files ? await this.processFiles(files) : [];
    const newReply = this.commentRepository.create({
      comment: replyDto.comment,
      user,
      parentId: parentId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });
    await this.commentRepository.save(newReply);
    return newReply;
  }

  async updateComment(id: string, 
                      updateDto: UpdateCommentDto, 
                      userId: string, files?: 
                                              { 
                                                images?: Express.Multer.File[], 
                                                video?: Express.Multer.File[], 
                                                attachment?: Express.Multer.File[] }): 
                                              Promise<CommentEntity> {

    const comment = await this.commentRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
    if (!comment) {
      throw new HttpException('Something went wrong', HttpStatus.NOT_FOUND);
    }
    if (comment.user.id !== userId) {
      throw new HttpException('Something went wrong', HttpStatus.FORBIDDEN);
    }
  
    const updateData: Partial<CommentEntity> = {};
  
    if (updateDto.comment !== undefined) {
      updateData.comment = updateDto.comment;
    }
  
    const hasFiles = files && (
      (files.images && files.images.length > 0) ||
      (files.video && files.video.length > 0) ||
      (files.attachment && files.attachment.length > 0)
    );
  
    if (hasFiles) {
      const newAttachments = await this.processFiles(files);
      updateData.attachments = newAttachments.length > 0 ? newAttachments : null;
    } else if (updateDto.clearAttachments) {
      updateData.attachments = null;
    }
  
    if (Object.keys(updateData).length > 0) {
      await this.commentRepository.update(id, updateData);
    }
  
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