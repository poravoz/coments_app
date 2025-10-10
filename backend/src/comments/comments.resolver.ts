import { Resolver, Query, Mutation, Args, Subscription, Context } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { CommentEntity } from './entities/comment.entity';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CreateReplyDto } from './dto/createReplyComment.dto';
import { UseGuards } from '@nestjs/common';
import JwtRefreshGuard from 'src/authentication/guards/jwt-refresh-guards';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';

interface ProcessedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => [CommentEntity])
  async comments(): Promise<CommentEntity[]> {
    return this.commentsService.getAllComments();
  }

  @Query(() => CommentEntity)
  async comment(@Args('id') id: string): Promise<CommentEntity> {
    return this.commentsService.getCommentById(id);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(JwtRefreshGuard)
  async createComment(
    @Args('createCommentInput') createCommentInput: CreateCommentDto,
    @Context() context: any,
    @Args({ name: 'files', type: () => [GraphQLUpload], nullable: true }) files?: FileUpload[],
  ): Promise<CommentEntity> {
    const userId = context.req.user.id;
    
    const hasComment = createCommentInput.comment && createCommentInput.comment.trim().length > 0;
    const hasFiles = files && files.length > 0;
    
    if (!hasComment && !hasFiles) {
      throw new Error('Comment or files are required');
    }

    const processedFiles = await this.processUploadedFiles(files);
    
    return this.commentsService.createComment(createCommentInput, userId, processedFiles);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(JwtRefreshGuard)
  async createReply(
    @Args('parentId') parentId: string,
    @Args('createReplyInput') createReplyInput: CreateReplyDto,
    @Context() context: any,
    @Args({ name: 'files', type: () => [GraphQLUpload], nullable: true }) files?: FileUpload[],
  ): Promise<CommentEntity> {
    const userId = context.req.user.id;
    
    const hasComment = createReplyInput.comment && createReplyInput.comment.trim().length > 0;
    const hasFiles = files && files.length > 0;
    
    if (!hasComment && !hasFiles) {
      throw new Error('Comment or files are required');
    }

    const processedFiles = await this.processUploadedFiles(files);
    
    return this.commentsService.createReply(parentId, createReplyInput, userId, processedFiles);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(JwtRefreshGuard)
  async updateComment(
    @Args('id') id: string,
    @Args('updateCommentInput') updateCommentInput: UpdateCommentDto,
    @Context() context: any,
    @Args({ name: 'files', type: () => [GraphQLUpload], nullable: true }) files?: FileUpload[],
  ): Promise<CommentEntity> {
    const userId = context.req.user.id;

    const hasCommentUpdate = updateCommentInput.comment !== undefined;
    const hasFiles = files && files.length > 0;
    const hasRemoveAttachments = updateCommentInput.removeAttachments && updateCommentInput.removeAttachments.length > 0;
    
    if (!hasCommentUpdate && !updateCommentInput.clearAttachments && !hasFiles && !hasRemoveAttachments) {
      throw new Error('No changes provided');
    }

    const processedFiles = await this.processUploadedFiles(files);
    
    return this.commentsService.updateComment(id, updateCommentInput, userId, processedFiles);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(JwtRefreshGuard)
  async deleteComment(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<CommentEntity> {
    const userId = context.req.user.id;
    // Verify ownership before deletion
    const comment = await this.commentsService.getCommentById(id);
    if (comment.user.id !== userId) {
      throw new Error('Forbidden');
    }
    return this.commentsService.deleteComment(id);
  }

  // Real-time Subscriptions
  
  @Subscription(() => CommentEntity, {
    name: 'commentAdded',
  })
  commentAdded() {
    return this.commentsService.getCommentAddedSubscription();
  }

  @Subscription(() => CommentEntity, {
    name: 'commentUpdated',
  })
  commentUpdated() {
    return this.commentsService.getCommentUpdatedSubscription();
  }

  @Subscription(() => CommentEntity, {
    name: 'commentDeleted',
  })
  commentDeleted() {
    return this.commentsService.getCommentDeletedSubscription();
  }

  private async processUploadedFiles(files?: FileUpload[]): Promise<any> {
    if (!files || files.length === 0) return undefined;

    const processedFiles: any = {
      images: [],
      video: [],
      attachment: []
    };

    for (const file of files) {
      const { createReadStream, filename, mimetype } = await file;
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        createReadStream()
          .on('data', (chunk) => chunks.push(chunk))
          .on('error', reject)
          .on('end', () => resolve(Buffer.concat(chunks)));
      });

      const processedFile: ProcessedFile = {
        fieldname: 'file',
        originalname: filename,
        encoding: '7bit',
        mimetype,
        buffer,
        size: buffer.length,
      };

      if (mimetype.startsWith('image/')) {
        processedFiles.images.push(processedFile);
      } else if (mimetype.startsWith('video/')) {
        processedFiles.video.push(processedFile);
      } else {
        processedFiles.attachment.push(processedFile);
      }
    }

    return processedFiles;
  }
}