export interface CommentType {
  id: string;
  comment: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  avatarUrl: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'attachment';
    url: string;
    originalName?: string; 
  }>;
}