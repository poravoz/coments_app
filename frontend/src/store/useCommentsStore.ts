import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';
import { CommentType } from '../types/commentType';
import { apolloClient } from '../lib/apolloClient';
import {
  COMMENT_ADDED_SUBSCRIPTION,
  COMMENT_UPDATED_SUBSCRIPTION,
  COMMENT_DELETED_SUBSCRIPTION,
  USER_UPDATED_SUBSCRIPTION,
} from '../graphql/operations';
import { CommentAddedData, CommentUpdatedData, CommentDeletedData, UserUpdatedData } from '../types/graphql';
import { useAuthStore } from './useAuthStore';
import type { Subscription } from 'zen-observable-ts';

interface RawComment {
  id: string;
  comment: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  parentId: string | null;
  createdAt: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'attachment';
    url: string;
    originalName?: string;
  }>;
}

interface UserType {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface CommentsStore {
  isCommentsLoading: boolean;
  comments: CommentType[];
  users: UserType[];
  getComments: (sort?: 'asc' | 'desc') => Promise<void>;
  createComment: (text: string, parentId?: string | null, imageFile?: File, videoFile?: File, attachmentFile?: File) => Promise<CommentType>;
  updateComment: (id: string, text: string, imageFile?: File, videoFile?: File, attachmentFile?: File) => Promise<CommentType>;
  removeAttachment: (commentId: string, attachmentIndex: number) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  getUsers: () => Promise<void>;
  subscribeToComments: () => () => void;
  subscribeToUserUpdates: () => () => void;
  searchComments: (text: string, sort?: 'asc' | 'desc') => Promise<void>;
}

const transformComment = (rawComment: RawComment): CommentType => {
  return {
    id: rawComment.id,
    comment: rawComment.comment,
    name: rawComment.user.name,
    userId: rawComment.user.id,
    parentId: rawComment.parentId,
    createdAt: rawComment.createdAt,
    avatarUrl: rawComment.user.avatarUrl || './user-icon.png',
    attachments: rawComment.attachments?.map((att) => ({
      type: att.type,
      url: att.url,
      originalName: att.originalName,
    })) || [],
  };
};

const transformUser = (apiUser: UserType): UserType => {
  return apiUser;
};

export const useCommentsStore = create<CommentsStore>((set, get) => ({
  isCommentsLoading: false,
  comments: [],
  users: [],

  getComments: async (sort: 'asc' | 'desc' = 'desc') => {
    set({ isCommentsLoading: true });
    try {
      const res = await axiosInstance.get(`/comments?sort=${sort}`);

      const transformed = res.data.map((raw: RawComment) => transformComment(raw));
      const sortedComments = transformed.sort((a: CommentType, b: CommentType) =>
        sort === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      set({ comments: sortedComments });
    } catch (error) {
      console.error('[useCommentsStore] Error fetching comments:', error);
      toast.error((error as Error)?.message || 'Error fetching comments');
    } finally {
      set({ isCommentsLoading: false });
    }
  },

  createComment: async (
    text: string,
    parentId?: string | null,
    imageFile?: File,
    videoFile?: File,
    attachmentFile?: File,
  ) => {
    try {
      const formData = new FormData();

      if (text.trim().length > 0) {
        formData.append('comment', text);
      }

      if (imageFile) {
        formData.append('images', imageFile);
      }

      if (videoFile) {
        formData.append('video', videoFile);
      }

      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      let res;
      if (parentId) {
        res = await axiosInstance.post(`/comments/${parentId}/replies`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await axiosInstance.post('/comments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const newComment = transformComment(res.data as RawComment);
      return newComment;
    } catch (error) {
      console.error('[useCommentsStore] Error creating comment:', error);
      toast.error((error as Error)?.message || 'Error creating comment');
      throw error;
    }
  },

  updateComment: async (
    id: string,
    text: string,
    imageFile?: File,
    videoFile?: File,
    attachmentFile?: File,
  ) => {
    try {
      const formData = new FormData();
      formData.append('comment', text || '');

      if (imageFile) {
        formData.append('images', imageFile);
      }

      if (videoFile) {
        formData.append('video', videoFile);
      }

      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      const res = await axiosInstance.patch(`/comments/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        });

      const updatedComment = transformComment(res.data as RawComment);
      toast.success('Comment updated');
      return updatedComment;
    } catch (error) {
      console.error('[useCommentsStore] Error updating comment:', error);
      toast.error((error as Error)?.message || 'Error updating comment');
      throw error;
    }
  },

  removeAttachment: async (commentId: string, attachmentIndex: number) => {
    try {
      const comment = get().comments.find((c) => c.id === commentId);
      if (!comment || !comment.attachments) {
        console.error('[useCommentsStore] Comment or attachments not found, id:', commentId);
        return;
      }

      const attachmentToRemove = comment.attachments[attachmentIndex];
      if (!attachmentToRemove) {
        console.error('[useCommentsStore] Attachment not found at index:', attachmentIndex);
        return;
      }

      const hasText = comment.comment && comment.comment.trim().length > 0;
      const remainingAttachments = comment.attachments.filter((_, index) => index !== attachmentIndex);

      if (!hasText && remainingAttachments.length === 0) {
        await axiosInstance.delete(`/comments/${commentId}`);
        toast.success('Comment deleted');
      } else {
        const res = await axiosInstance.patch(`/comments/${commentId}`, {
          comment: comment.comment,
          removeAttachments: [{
            url: attachmentToRemove.url,
            type: attachmentToRemove.type,
          }],
        });
        toast.success('Attachment removed');
      }
    } catch (error) {
      console.error('[useCommentsStore] Error removing attachment:', error);
      toast.error((error as Error)?.message || 'Error removing attachment');
      throw error;
    }
  },

  deleteComment: async (id: string) => {
    try {
      await axiosInstance.delete(`/comments/${id}`);
      toast.success('Comment deleted');
    } catch (error) {
      console.error('[useCommentsStore] Error deleting comment:', error);
      toast.error((error as Error)?.message || 'Error deleting comment');
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const res = await axiosInstance.get('/users');
      const transformed = res.data.map(transformUser);
      set({ users: transformed });
    } catch (error) {
      console.error('[useCommentsStore] Error fetching users:', error);
      toast.error((error as Error)?.message || 'Error loading users');
    }
  },

  subscribeToComments: () => {
    const subscriptions: Subscription[] = [];
    const { authUser } = useAuthStore.getState();

    const addedSub = apolloClient.subscribe<CommentAddedData>({
      query: COMMENT_ADDED_SUBSCRIPTION,
    }).subscribe({
      next: ({ data }) => {
        if (data?.commentAdded) {
          if (authUser && data.commentAdded.user.id === authUser.id) {
            return;
          }

          const newComment = transformComment({
            ...data.commentAdded,
            parentId: data.commentAdded.parentId || null,
          });

          set((state) => {
            // Check if comment already exists to prevent duplicates
            if (state.comments.some((c) => c.id === newComment.id)) {
              return state; // No changes to state
            }

            const updatedComments = [newComment, ...state.comments];
            const sortedComments = updatedComments.sort(
              (a: CommentType, b: CommentType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            return { comments: sortedComments };
          });
        }
      },
      error: (error) => {
        console.error('[useCommentsStore] Subscription error (commentAdded):', error);
      },
    });
    subscriptions.push(addedSub);

    const updatedSub = apolloClient.subscribe<CommentUpdatedData>({
      query: COMMENT_UPDATED_SUBSCRIPTION,
    }).subscribe({
      next: ({ data }) => {
        if (data?.commentUpdated) {
          const updatedComment = transformComment({
            ...data.commentUpdated,
            parentId: data.commentUpdated.parentId || null,
          });

          set((state) => {
            const updatedComments = state.comments.map((c) => (c.id === updatedComment.id ? updatedComment : c));
            const sortedComments = updatedComments.sort(
              (a: CommentType, b: CommentType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
            return { comments: sortedComments };
          });
        }
      },
      error: (error) => {
        console.error('[useCommentsStore] Subscription error (commentUpdated):', error);
      },
    });
    subscriptions.push(updatedSub);

    const deletedSub = apolloClient.subscribe<CommentDeletedData>({
      query: COMMENT_DELETED_SUBSCRIPTION,
    }).subscribe({
      next: ({ data }) => {
        if (data?.commentDeleted) {
          const deletedId = data.commentDeleted.id;
          set((state) => {
            return { comments: state.comments.filter((c) => c.id !== deletedId) };
          });
        }
      },
      error: (error) => {
        console.error('[useCommentsStore] Subscription error (commentDeleted):', error);
      },
    });
    subscriptions.push(deletedSub);

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  },

  subscribeToUserUpdates: () => {
    const subscription = apolloClient.subscribe<UserUpdatedData>({
      query: USER_UPDATED_SUBSCRIPTION,
    }).subscribe({
      next: ({ data }) => {
        if (data?.userUpdated) {
          const updatedUser = data.userUpdated;

          set((state) => {
            return {
              comments: state.comments.map((comment) =>
                comment.userId === updatedUser.id
                  ? { ...comment, avatarUrl: updatedUser.avatarUrl || './user-icon.png', name: updatedUser.name }
                  : comment,
              ),
              users: state.users.map((user) =>
                user.id === updatedUser.id
                  ? { ...user, avatarUrl: updatedUser.avatarUrl, name: updatedUser.name }
                  : user,
              ),
            };
          });
        }
      },
      error: (error) => {
        console.error('[useCommentsStore] User updates subscription error:', error);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  searchComments: async (query: string, sort: 'asc' | 'desc' = 'desc') => {
    set({ isCommentsLoading: true });
    try {
      const res = await axiosInstance.get(`/comments?search=${encodeURIComponent(query)}&sort=${sort}`);

      const transformed = res.data.map((raw: RawComment) => transformComment(raw));
      const sortedComments = transformed.sort((a: CommentType, b: CommentType) =>
        sort === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      set({ comments: sortedComments });
    } catch (error) {
      console.error('[useCommentsStore] Error searching comments:', error);
      toast.error((error as Error)?.message || 'Search failed');
    } finally {
      set({ isCommentsLoading: false });
    }
  },
}));