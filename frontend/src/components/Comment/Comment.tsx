import React, { useState } from "react";
import { CommentForm } from "../CommentForm/CommentForm";
import { ActiveComment } from "../../types/types";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./Comment.css";
import { CommentType } from "../../types/commentType";

interface CommentProps {
  comment: CommentType;
  replies: React.ReactNode[];
  activeComment: ActiveComment | null;
  setActiveComment: React.Dispatch<React.SetStateAction<ActiveComment | null>>;
  deleteComment: () => void;
  addComment: (text: string, parentId?: string | null, callback?: () => void) => void;
  updateComment: (text: string, commentId: string) => void;
  depth: number;
}

const LEFT_SHIFT = 32; // 32px
const MAX_INDENT_LEVEL = 2; // Limit to 3 levels, 4+ reverts to level 3

const parseDate = (dateStr: string): Date => {
  const trimmed = dateStr.trim();
  if (trimmed.includes(',')) {
    const [datePart, timePart] = trimmed.split(',');
    const [day, month, year] = datePart.trim().split('.');
    const [hour, minute, second] = timePart.trim().split(':');
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }
  return new Date(trimmed);
};

export const Comment: React.FC<CommentProps> = ({
  comment,
  replies,
  activeComment,
  setActiveComment,
  deleteComment,
  addComment,
  updateComment,
  depth,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const createdDate = parseDate(comment.createdAt);
  const effectiveDepth = Math.min(depth, MAX_INDENT_LEVEL);
  const marginLeft = `${effectiveDepth * LEFT_SHIFT}px`;

  const isReplying = activeComment?.type === "replying" && activeComment.id === comment.id;
  const isEditing = activeComment?.type === "editing" && activeComment.id === comment.id;

  return (
    <>
      <div className="comment-wrapper" style={{ marginLeft }}>
        <div className={`comment depth-${effectiveDepth}`}>
          <div className="comment-image-container">
            <img
              src={comment.avatarUrl || "./user-icon.png"}
              alt={comment.name}
              className="comment-avatar"
              onClick={() => comment.avatarUrl && setIsLightboxOpen(true)}
            />
          </div>
          <div className="comment-right-part">
            <div className="comment-author">{comment.name}</div>
            <div className="comment-date">{createdDate.toLocaleDateString()}</div>

            {!isEditing && <div className="comment-text">{comment.comment}</div>}

            {isEditing && (
              <CommentForm
                submitLabel="Update"
                hasCancelButton
                initialText={comment.comment}
                handleSubmit={(text) => updateComment(text, comment.id)}
                handleCancel={() => setActiveComment(null)}
              />
            )}

            <div className="comment-actions">
              <span
                className="comment-action"
                onClick={() => setActiveComment({ id: comment.id, type: "replying" })}
              >
                Reply
              </span>
              <span
                className="comment-action"
                onClick={() => setActiveComment({ id: comment.id, type: "editing" })}
              >
                Edit
              </span>
              <span
                className="comment-action"
                onClick={deleteComment}
                style={{ color: "red" }}
              >
                Delete
              </span>
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

      {isLightboxOpen && comment.avatarUrl && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={[{ src: comment.avatarUrl }]}
          render={{
            buttonPrev: () => null,  
            buttonNext: () => null,  
            buttonClose: undefined, 
          }}
        />
      )}
    </>
  );
};
