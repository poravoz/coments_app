export interface Attachment {
  type: 'image' | 'video' | 'attachment';
  url: string;
  originalName?: string;
}