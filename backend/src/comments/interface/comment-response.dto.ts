import { Attachment, CommentEntity } from "../entities/comment.entity";

export interface CommentResponse {
  id?: string;
  comment?: string;
  user: any;
  parentId?: string | null;
  parent?: CommentEntity | undefined;
  children?: CommentEntity[] | undefined;
  attachments?: Attachment[] | undefined;
  createdAt: string;
}