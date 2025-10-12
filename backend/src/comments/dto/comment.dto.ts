export class Comment {
    id: string;
    comment: string;
    createdAt: Date;
    parentId?: string | null;
}