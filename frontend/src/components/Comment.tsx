import React from "react";
import { CommentForm } from "./CommentForm";
import { ActiveComment } from "../types/types";
import { CommentType } from "./Comments";

interface CommentProps {
  comment: CommentType;
  replies: React.ReactNode[];
  currentUserId: string;
  activeComment: ActiveComment | null;
  setActiveComment: React.Dispatch<React.SetStateAction<ActiveComment | null>>;
  deleteComment: () => void;
  addComment: (text: string, parentId?: string | null, callback?: () => void) => void;
  updateComment: (text: string, commentId: string) => void;
  depth: number;
}

const LEFT_SHIFT = 32; // 2rem = 32px
const MAX_INDENT_LEVEL = 2; // Limit to 3 levels, 4+ reverts to level 1

export const Comment: React.FC<CommentProps> = ({
  comment,
  replies,
  currentUserId,
  activeComment,
  setActiveComment,
  deleteComment,
  addComment,
  updateComment,
  depth,
}) => {
  const fiveMinutes = 300000;
  const timePassed = new Date().getTime() - new Date(comment.createdAt).getTime() > fiveMinutes;
  const canReply = Boolean(currentUserId);
  const canEdit = currentUserId === comment.userId && !timePassed;
  const canDelete = currentUserId === comment.userId && !timePassed;
  const isReplying = activeComment?.type === "replying" && activeComment.id === comment.id;
  const isEditing = activeComment?.type === "editing" && activeComment.id === comment.id;

  const effectiveDepth = Math.min(depth, MAX_INDENT_LEVEL); // Cap depth at 3
  const marginLeft = `${effectiveDepth * LEFT_SHIFT}px`;

  return (
    <>
      <div className="comment-wrapper" style={{ marginLeft }}>
        <div className={`comment depth-${effectiveDepth}`}>
          <div className="comment-image-container">
            <img src="./user-icon.png" alt="User" />
          </div>
          <div className="comment-right-part">
            <div className="comment-author">{comment.username}</div>
            <div className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</div>

            {!isEditing && <div className="comment-text">{comment.body}</div>}

            {isEditing && (
              <CommentForm
                submitLabel="Update"
                hasCancelButton
                initialText={comment.body}
                handleSubmit={(text) => updateComment(text, comment.id)}
                handleCancel={() => setActiveComment(null)}
              />
            )}

            <div className="comment-actions">
              {canReply && (
                <span
                  className="comment-action"
                  onClick={() => setActiveComment({ id: comment.id, type: "replying" })}
                >
                  Reply
                </span>
              )}
              {canEdit && (
                <span
                  className="comment-action"
                  onClick={() => setActiveComment({ id: comment.id, type: "editing" })}
                >
                  Edit
                </span>
              )}
              {canDelete && <span className="comment-action" onClick={deleteComment}>Delete</span>}
            </div>

            {isReplying && (
              <div className="reply-form-wrapper">
                <CommentForm
                  submitLabel="Reply"
                  handleSubmit={(text) => addComment(text, comment.id, () => setActiveComment(null))}
                  hasCancelButton
                  handleCancel={() => setActiveComment(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {replies}
    </>
  );
};