import React, { useEffect, useState } from "react";
import { CommentForm } from "./CommentForm";
import { ConfirmDialog } from "./ConfirmDialog/ConfirmDialog";
import toast from "react-hot-toast";
import { ActiveComment } from "../types/types";
import {
  getComments as getCommentsApi,
  createComment as createCommentApi,
  updateComment as updateCommentApi,
  deleteComment as DeleteCommentApi,
} from "../api";
import { Comment } from "./Comment";

export interface CommentType {
  id: string;
  body: string;
  username: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
}

interface CommentsProps {
  currentUserId: string;
}

export const Comments: React.FC<CommentsProps> = ({ currentUserId }) => {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [activeComment, setActiveComment] = useState<ActiveComment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 25;

  useEffect(() => {
    getCommentsApi().then((data) => setComments(data));
  }, []);

  const addComment = (text: string, parentId: string | null = null, callback?: () => void) => {
    createCommentApi(text, parentId).then((comment) => {
      setComments([comment, ...comments]);
      if (callback) callback();
    });
  };

  const updateComment = (text: string, commentId: string) => {
    updateCommentApi(text, commentId).then(() => {
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, body: text } : c)));
      setActiveComment(null);
    });
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCommentToDelete(null);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;
    await DeleteCommentApi(commentToDelete);
    setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
    toast.success("Comment deleted");
    closeDeleteDialog();
  };

  const buildTree = (comments: CommentType[]): Map<string, CommentType[]> => {
    const tree = new Map<string, CommentType[]>();
    comments.forEach((comment) => {
      const parentId = comment.parentId || "root";
      if (!tree.has(parentId)) {
        tree.set(parentId, []);
      }
      tree.get(parentId)!.push(comment);
    });
    return tree;
  };

  const getSubtreeSize = (commentId: string, tree: Map<string, CommentType[]>): number => {
    let size = 1;
    const children = tree.get(commentId) || [];
    children.forEach((child) => {
      size += getSubtreeSize(child.id, tree);
    });
    return size;
  };

  const tree = buildTree(comments);
  const rootComments = (tree.get("root") || []).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const pages: CommentType[][] = [];
  let currentPageComments: CommentType[] = [];
  let currentCount = 0;

  rootComments.forEach((root) => {
    const subtreeSize = getSubtreeSize(root.id, tree);
    if (currentCount + subtreeSize > commentsPerPage && currentPageComments.length > 0) {
      pages.push(currentPageComments);
      currentPageComments = [];
      currentCount = 0;
    }
    currentPageComments.push(root);
    currentCount += subtreeSize;
  });

  if (currentPageComments.length > 0) {
    pages.push(currentPageComments);
  }

  const totalPages = pages.length;
  const currentRoots = pages[currentPage - 1] || [];

  const renderComments = (parentId: string, depth: number): React.ReactNode[] => {
    const children = (tree.get(parentId) || []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return children.map((comment) => (
      <Comment
        key={comment.id}
        comment={comment}
        replies={renderComments(comment.id, depth + 1)}
        currentUserId={currentUserId}
        activeComment={activeComment}
        setActiveComment={setActiveComment}
        deleteComment={() => openDeleteDialog(comment.id)}
        addComment={addComment}
        updateComment={updateComment}
        depth={depth}
      />
    ));
  };

  return (
    <div className="comments-page">
      <div className="comment-form-wrapper">
        <p className="comments-title">Enter the Comment</p>
        <CommentForm submitLabel="Write" handleSubmit={addComment} />
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          Next
        </button>
      </div>

      <div className="comments-container-wrapper">
        {currentRoots.map((root) => (
          <Comment
            key={root.id}
            comment={root}
            replies={renderComments(root.id, 1)}
            currentUserId={currentUserId}
            activeComment={activeComment}
            setActiveComment={setActiveComment}
            deleteComment={() => openDeleteDialog(root.id)}
            addComment={addComment}
            updateComment={updateComment}
            depth={0}
          />
        ))}
      </div>

      <ConfirmDialog open={dialogOpen} onClose={closeDeleteDialog} onConfirm={handleDelete} />
    </div>
  );
};