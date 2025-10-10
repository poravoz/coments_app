export interface AvatarUpdatedData {
    avatarUpdated: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }
  
  export interface UserUpdatedData {
    userUpdated: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }

  export interface CommentAddedData {
    commentAdded: {
      id: string;
      comment: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
        avatarUrl?: string;
      };
      parentId?: string | null;
      attachments: Array<{
        type: 'image' | 'video' | 'attachment';
        url: string;
        originalName?: string;
      }>;
    };
  }
  
  export interface CommentUpdatedData {
    commentUpdated: {
      id: string;
      comment: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
        avatarUrl?: string;
      };
      parentId?: string | null;
      attachments: Array<{
        type: 'image' | 'video' | 'attachment';
        url: string;
        originalName?: string;
      }>;
    };
  }
  
  export interface CommentDeletedData {
    commentDeleted: {
      id: string;
    };
  }