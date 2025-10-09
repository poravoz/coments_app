import React, { useEffect, useState } from "react";
import { CommentForm } from "../CommentForm/CommentForm";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { ActiveComment } from "../../types/types";
import { Comment } from "../Comment/Comment";
import { useCommentsStore } from "../../store/useCommentsStore";
import "./Comments.css";
import { CommentType } from "../../types/commentType";

export const Comments = () =>  {
  const [activeComment, setActiveComment] = useState<ActiveComment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 25;
  const { 
    comments: storeComments, 
    getComments, 
    createComment, 
    updateComment, 
    deleteComment, 
    removeAttachment 
  } = useCommentsStore();

  useEffect(() => {
    getComments();
  }, []);

  const addComment = (text: string, imageFile?: File, videoFile?: File, attachmentFile?: File, parentId: string | null = null, callback?: () => void) => {
    createComment(text, parentId, imageFile, videoFile, attachmentFile).then((newComment) => {
      if (callback) callback();
    }).catch((error) => {
      console.error("Add comment failed:", error);
    });
  };

  const updateCommentHandler = (text: string, commentId: string, imageFile?: File, videoFile?: File, attachmentFile?: File) => {
    updateComment(commentId, text, imageFile, videoFile, attachmentFile).then(() => {
      setActiveComment(null);
    }).catch((error) => {
      console.error("Update comment failed:", error);
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
    await deleteComment(commentToDelete);
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

  const tree = buildTree(storeComments);
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

  const renderComments = (parentId: string, depth: number) => {
    const children = (tree.get(parentId) || []).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return children.map((comment) => (
      <Comment
        key={comment.id}
        comment={comment}
        replies={renderComments(comment.id, depth + 1)}
        activeComment={activeComment}
        setActiveComment={setActiveComment}
        deleteComment={() => openDeleteDialog(comment.id)}
        addComment={addComment}
        updateComment={updateCommentHandler}
        removeAttachment={removeAttachment}
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

      {totalPages > 0 && (
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
      )}

      <div className="comments-container-wrapper">
        { currentRoots.length === 0 ? (
          <p>No comments on this page...</p>
        ) : (
          currentRoots.map((root) => (
            <Comment
              key={root.id}
              comment={root}
              replies={renderComments(root.id, 1)}
              activeComment={activeComment}
              setActiveComment={setActiveComment}
              deleteComment={() => openDeleteDialog(root.id)}
              addComment={addComment}
              updateComment={updateCommentHandler}
              removeAttachment={removeAttachment}
              depth={0}
            />
          ))
        )}
      </div>

      <ConfirmDialog open={dialogOpen} onClose={closeDeleteDialog} onConfirm={handleDelete} />
    </div>
  );
};