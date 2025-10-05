import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { CommentType } from "../components/Comments";

interface RawComment {
  id: string;
  comment: string;
  user: {
    id: string;
    name: string;
  };
  parentId: string | null;
  createdAt: string;
}

interface UserType {
  id: string;
  name: string;
  email: string;
}

interface CommentsStore {
  isCommentsLoading: boolean;
  comments: CommentType[];
  users: UserType[];
  getComments: () => Promise<void>;
  createComment: (text: string, parentId?: string | null) => Promise<CommentType>;
  updateComment: (id: string, text: string) => Promise<CommentType>;
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
  createComment: async (text: string, parentId?: string | null) => {
    try {
      const payload = { comment: text };
      let res;
      if (parentId) {
        // Reply: POST /comments/{parentId}/replies
        res = await axiosInstance.post(`/comments/${parentId}/replies`, payload);
      } else {
        // Root: POST /comments
        res = await axiosInstance.post("/comments", payload);
      }
      const newComment = transformComment(res.data as RawComment);
      set((state) => ({ comments: [newComment, ...state.comments] }));
      return newComment;
    } catch (error) {
      toast.error((error as Error)?.message || "Error creating comment");
      throw error;
    }
  },
  updateComment: async (id: string, text: string) => {
    try {
      const res = await axiosInstance.patch(`/comments/${id}`, { comment: text });
      const updatedComment = transformComment(res.data as RawComment);
      set((state) => ({
        comments: state.comments.map((c) => (c.id === id ? updatedComment : c)),
      }));
      toast.success("Comment updated");
      return updatedComment;
    } catch (error) {
      toast.error((error as Error)?.message || "Error updating comment");
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