import { UserEntity } from "src/users/entities/user.entity";
import {CommentEntity } from "../entities/comment.entity";
import { Attachment } from "./attachment.dto";

export interface CommentResponse {
  id?: string;
  comment?: string | null;
  user: UserEntity;
  parentId?: string | null;
  parent?: CommentEntity | undefined;
  children?: CommentEntity[] | undefined;
  attachments?: Attachment[] | null; 
  createdAt: string;
}