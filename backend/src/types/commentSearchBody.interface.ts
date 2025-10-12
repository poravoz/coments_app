export interface CommentSearchBody {
    id: string;
    comment: string;
    createdAt: Date;
    parentId?: string | null; 
  }