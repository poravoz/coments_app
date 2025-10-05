export class CreateCommentDto {
    comment: string;
    userId: string;
    createdAt: Date;
    parentId?: string | null;
}