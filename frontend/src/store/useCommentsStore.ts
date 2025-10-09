import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { CommentType } from "../types/commentType";

interface RawComment {
  id: string;
  comment: string;
  user: {
    id: string;
    name: string;
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
  getComments: () => Promise<void>;
  createComment: (text: string, parentId?: string | null, imageFile?: File, videoFile?: File, attachmentFile?: File) => Promise<CommentType>;
  updateComment: (id: string, text: string, imageFile?: File, videoFile?: File, attachmentFile?: File) => Promise<CommentType>;
  removeAttachment: (commentId: string, attachmentIndex: number) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  getUsers: () => Promise<void>;
}

const transformComment = (rawComment: RawComment): CommentType => ({
  id: rawComment.id,
  comment: rawComment.comment,
  name: rawComment.user.name,
  userId: rawComment.user.id,
  parentId: rawComment.parentId,
  createdAt: rawComment.createdAt,
  avatarUrl: (rawComment.user as any).avatarUrl || "./user-icon.png",
  attachments: rawComment.attachments?.map(att => ({
    type: att.type,
    url: att.url,
    originalName: att.originalName
  })) || [],
});

const transformUser = (apiUser: UserType): UserType => apiUser;

export const useCommentsStore = create<CommentsStore>((set, get) => ({
  isCommentsLoading: false,
  comments: [],
  users: [],
  getComments: async () => {
    set({ isCommentsLoading: true });
    try {
      const res = await axiosInstance.get("/comments");
      const transformed = res.data.map((raw: RawComment) => transformComment(raw));
      set({ comments: transformed });
    } catch (error) {
      toast.error((error as Error)?.message);
    } finally {
      set({ isCommentsLoading: false });
    }
  },
  createComment: async (text: string, 
                        parentId?: string | null, 
                        imageFile?: File, 
                        videoFile?: File, 
                        attachmentFile?: File) => {
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
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        res = await axiosInstance.post("/comments", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      const newComment = transformComment(res.data as RawComment);
      set((state) => ({ comments: [newComment, ...state.comments] }));
      return newComment;
    } catch (error) {
      toast.error((error as Error)?.message || "Error creating comment");
      throw error;
    }
  },

  updateComment: async (id: string, 
                        text: string, 
                        imageFile?: File, 
                        videoFile?: File, 
                        attachmentFile?: File) => {
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const updatedComment = transformComment(res.data as RawComment);
      
      set((state) => ({
        comments: state.comments.map((c) => (c.id === id ? updatedComment : c)),
      }));
      toast.success("Comment updated");
      return updatedComment;
    } catch (error) {
      console.error('Error in updateComment:', error);
      console.error('Error response:', (error as any)?.response?.data);
      toast.error((error as Error)?.message || "Error updating comment");
      throw error;
    }
  },

  removeAttachment: async (commentId: string, attachmentIndex: number) => {
    try {
      const comment = get().comments.find(c => c.id === commentId);
      if (!comment || !comment.attachments) return;
  
      const attachmentToRemove = comment.attachments[attachmentIndex];
      if (!attachmentToRemove) return;
  
      const hasText = comment.comment && comment.comment.trim().length > 0;
      const remainingAttachments = comment.attachments.filter((_, index) => index !== attachmentIndex);
      
      if (!hasText && remainingAttachments.length === 0) {
        await axiosInstance.delete(`/comments/${commentId}`);
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
        }));
        toast.success("Comment deleted");
      } else {
        const res = await axiosInstance.patch(`/comments/${commentId}`, {
          comment: comment.comment,
          removeAttachments: [{
            url: attachmentToRemove.url,
            type: attachmentToRemove.type
          }]
        });
        
        const updatedComment = transformComment(res.data as RawComment);
        set((state) => ({
          comments: state.comments.map((c) => (c.id === commentId ? updatedComment : c)),
        }));
        toast.success("Attachment removed");
      }
    } catch (error) {
      toast.error((error as Error)?.message || "Error removing attachment");
      throw error;
    }
  },

  deleteComment: async (id: string) => {
    try {
      await axiosInstance.delete(`/comments/${id}`);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== id),
      }));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error((error as Error)?.message || "Error deleting comment");
      throw error;
    }
  },
  getUsers: async () => {
    try {
      const res = await axiosInstance.get("/users");
      const transformed = res.data.map(transformUser);
      set({ users: transformed });
    } catch (error) {
      toast.error((error as Error)?.message || "Error loading users");
    }
  },
}));