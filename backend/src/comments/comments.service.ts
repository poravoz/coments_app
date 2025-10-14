import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyComment.dto';
import { UsersService } from 'src/users/users.service';
import cloudinary from '../database/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Attachment } from './interface/attachment.dto';
import { PubSub } from 'graphql-subscriptions';
import CommentSearchService from './commentSearch.service';
import { Comment as IComment } from './dto/comment.dto';

export type ProcessedFiles = {
  images?: Express.Multer.File[];
  video?: Express.Multer.File[];
  attachment?: Express.Multer.File[];
};

@Injectable()
export class CommentsService {
  private pubSub: PubSub;

  constructor(
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private readonly usersService: UsersService,
    private readonly commentSearchService: CommentSearchService,
  ) {
    this.pubSub = new PubSub();
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    resource_type: 'image' | 'video' | 'raw',
  ): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error('[CommentsService] Cloudinary upload failed:', error);
            return reject(error || new Error('Upload to Cloudinary failed'));
          }
          resolve({ secure_url: result.secure_url });
        },
      );
      stream.end(file.buffer);
    });
  }

  private async processFiles(
    files?: ProcessedFiles,
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];

    if (files?.images && files.images.length > 0) {
      for (const image of files.images) {
        if (!['image/jpeg', 'image/gif', 'image/png'].includes(image.mimetype)) {
          console.error('[CommentsService] Invalid image type:', image.mimetype);
          throw new HttpException(`Invalid image type: ${image.mimetype}`, HttpStatus.BAD_REQUEST);
        }
        const result = await this.uploadToCloudinary(image, 'image');
        attachments.push({
          type: 'image',
          url: result.secure_url,
          originalName: image.originalname,
        });
      }
    }

    if (files?.video && files.video.length > 0) {
      const video = files.video[0];
      if (!video.mimetype.startsWith('video/')) {
        console.error('[CommentsService] Invalid video type:', video.mimetype);
        throw new HttpException(`Invalid video type: ${video.mimetype}`, HttpStatus.BAD_REQUEST);
      }
      const result = await this.uploadToCloudinary(video, 'video');
      attachments.push({
        type: 'video',
        url: result.secure_url,
        originalName: video.originalname,
      });
    }

    if (files?.attachment && files.attachment.length > 0) {
      const attachmentFile = files.attachment[0];
      const allowedMimetypes = [
        'text/plain',
        'application/octet-stream',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/pdf',
        'application/vnd.ms-excel',
      ];

      if (!allowedMimetypes.includes(attachmentFile.mimetype)) {
        console.error('[CommentsService] Invalid attachment type:', attachmentFile.mimetype);
        throw new HttpException(`Invalid attachment type: ${attachmentFile.mimetype}`, HttpStatus.BAD_REQUEST);
      }

      if (attachmentFile.size > 100 * 1024) {
        console.error('[CommentsService] File size too large:', attachmentFile.size);
        throw new HttpException('File size too large', HttpStatus.BAD_REQUEST);
      }

      try {
        const result = await this.uploadToCloudinary(attachmentFile, 'raw');
        attachments.push({
          type: 'attachment',
          url: result.secure_url,
          originalName: attachmentFile.originalname,
        });
      } catch (error) {
        console.error('[CommentsService] Upload failed:', error);
        throw new HttpException(`Upload failed: ${(error as Error).message}`, HttpStatus.BAD_REQUEST);
      }
    }

    return attachments;
  }

  async getAllComments(): Promise<CommentEntity[]> {
    const comments = await this.commentRepository.find({
      relations: ['user', 'children'],
    });
    return comments;
  }

  async getCommentById(id: string): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'children'],
    });
    if (!comment) {
      console.error('[CommentsService] Comment not found, id:', id);
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    return comment;
  }

  async createComment(
    commentDto: CreateCommentDto,
    userId: string,
    files?: ProcessedFiles,
  ): Promise<CommentEntity> {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      console.error('[CommentsService] User not found, userId:', userId);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const attachments = files ? await this.processFiles(files) : [];
    const newComment = this.commentRepository.create({
      comment: commentDto.comment,
      user,
      parentId: commentDto.parentId || null,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    const savedComment = await this.commentRepository.save(newComment);

    const commentForIndex: IComment = {
      id: savedComment.id!,
      comment: savedComment.comment || '',
      createdAt: savedComment.createdAt,
      parentId: savedComment.parentId,
      userId: userId,
    };

    await this.commentSearchService.indexComment(commentForIndex);

    this.pubSub.publish('commentAdded', {
      commentAdded: {
        ...savedComment,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        parentId: savedComment.parentId,
      },
    });

    return savedComment;
  }

  async searchForComments(text: string, sort?: 'asc' | 'desc'): Promise<CommentEntity[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const results = await this.commentSearchService.search(text, sort);
    if (!results || !results.length) return [];

    const ids = results
      .map((result) => result?.id)
      .filter((id): id is string => !!id && typeof id === 'string');

    if (!ids.length) {
      return [];
    }

    const foundComments = await this.commentRepository.find({
      where: { id: In(ids) },
      relations: ['user', 'children'],
    });

    const sortOrderValue = sort || 'desc';
    const sortedComments = foundComments.sort((a, b) =>
      sortOrderValue === 'asc'
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return sortedComments;
  }

  async createReply(
    parentId: string,
    replyDto: CreateReplyDto,
    userId: string,
    files?: ProcessedFiles,
  ): Promise<CommentEntity> {
    const parentComment = await this.commentRepository.findOne({
      where: { id: parentId },
      relations: ['children'],
    });
    if (!parentComment) {
      console.error('[CommentsService] Parent comment not found, id:', parentId);
      throw new HttpException('Parent comment not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.usersService.getUserById(userId);
    if (!user) {
      console.error('[CommentsService] User not found, userId:', userId);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const attachments = files ? await this.processFiles(files) : [];
    const newReply = this.commentRepository.create({
      comment: replyDto.comment,
      user,
      parentId,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    const savedReply = await this.commentRepository.save(newReply);

    this.pubSub.publish('commentAdded', {
      commentAdded: {
        ...savedReply,
        user: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        parentId: savedReply.parentId,
      },
    });

    return savedReply;
  }

  async updateComment(
    id: string,
    updateDto: UpdateCommentDto,
    userId: string,
    files?: ProcessedFiles,
  ): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!comment) {
      console.error('[CommentsService] Comment not found, id:', id);
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }
    if (comment.user.id !== userId) {
      console.error('[CommentsService] Forbidden: userId does not match comment owner', {
        commentUserId: comment.user.id,
        userId,
      });
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const updateData: Partial<CommentEntity> = {};

    if (updateDto.comment !== undefined) {
      updateData.comment = updateDto.comment;
    }

    let updatedAttachments = comment.attachments || [];

    if (updateDto.removeAttachments && updateDto.removeAttachments.length > 0) {
      updatedAttachments = updatedAttachments.filter(
        (att) => !updateDto.removeAttachments!.some((removeAtt) => removeAtt.url === att.url && removeAtt.type === att.type),
      );
    }

    if (updateDto.clearAttachments) {
      updatedAttachments = [];
    }

    const hasFiles =
      files &&
      ((files.images && files.images.length > 0) ||
        (files.video && files.video.length > 0) ||
        (files.attachment && files.attachment.length > 0));

    if (hasFiles) {
      const newAttachments = await this.processFiles(files);
      newAttachments.forEach((newAtt) => {
        updatedAttachments = updatedAttachments.filter((existingAtt) => existingAtt.type !== newAtt.type);
      });
      updatedAttachments = [...updatedAttachments, ...newAttachments];
   }

    updateData.attachments = updatedAttachments.length > 0 ? updatedAttachments : null;

    if (Object.keys(updateData).length > 0) {
      await this.commentRepository.update(id, updateData);
    }

    const updatedComment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!updatedComment) {
      console.error('[CommentsService] Updated comment not found, id:', id);
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    this.pubSub.publish('commentUpdated', { commentUpdated: updatedComment });

    return updatedComment;
  }

  async deleteComment(id: string): Promise<CommentEntity> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['user', 'children'],
    });
    if (!comment) {
      console.error('[CommentsService] Comment not found for deletion, id:', id);
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    if (comment.children && comment.children.length > 0) {
      for (const child of comment.children) {
        if (child && child.id) {
          await this.deleteComment(child.id);
        }
      }
    }

    const deletedComment = await this.commentRepository.remove(comment);

    this.pubSub.publish('commentDeleted', { commentDeleted: { id } });

    return deletedComment;
  }

  async getCommentsByUserId(userId: string): Promise<CommentEntity[]> {
    const comments = await this.commentRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    return comments;
  }

  getCommentAddedSubscription() {
    return this.pubSub.asyncIterableIterator('commentAdded');
  }

  getCommentUpdatedSubscription() {
    return this.pubSub.asyncIterableIterator('commentUpdated');
  }

  getCommentDeletedSubscription() {
    return this.pubSub.asyncIterableIterator('commentDeleted');
  }
}