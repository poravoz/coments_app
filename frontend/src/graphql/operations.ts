import { gql } from '@apollo/client';

export const AVATAR_UPDATED_SUBSCRIPTION = gql`
  subscription AvatarUpdated($userId: String!) {
    avatarUpdated(userId: $userId) {
      id
      name
      avatarUrl
    }
  }
`;

export const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription CommentAdded {
    commentAdded {
      id
      comment
      createdAt
      parentId
      user {
        id
        name
        avatarUrl
      }
      attachments {
        type
        url
        originalName
      }
    }
  }
`;

export const COMMENT_UPDATED_SUBSCRIPTION = gql`
  subscription CommentUpdated {
    commentUpdated {
      id
      comment
      createdAt
      user {
        id
        name
        avatarUrl
      }
      attachments {
        type
        url
        originalName
      }
    }
  }
`;

export const COMMENT_DELETED_SUBSCRIPTION = gql`
  subscription CommentDeleted {
    commentDeleted {
      id
    }
  }
`;

export const USER_UPDATED_SUBSCRIPTION = gql`
  subscription UserUpdated {
    userUpdated {
      id
      name
      avatarUrl
    }
  }
`;