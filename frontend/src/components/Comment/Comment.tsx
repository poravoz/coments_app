import React, { useState } from "react";
import { CommentForm } from "../CommentForm/CommentForm";
import { ActiveComment } from "../../types/types";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./Comment.css";
import { CommentType } from "../../types/commentType";
import { X } from "lucide-react";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";

interface CommentProps {
  comment: CommentType;
  replies: React.ReactNode[];
  activeComment: ActiveComment | null;
  setActiveComment: React.Dispatch<React.SetStateAction<ActiveComment | null>>;
  deleteComment: () => void;
  addComment: (text: string, imageFile?: File, parentId?: string | null, callback?: () => void) => void;
  updateComment: (text: string, commentId: string, imageFile?: File) => void;
  removeImage: (commentId: string) => void;
  depth: number;
}

const LEFT_SHIFT = 32;
const MAX_INDENT_LEVEL = 2;

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
  removeImage,
  depth,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [imageDeleteDialogOpen, setImageDeleteDialogOpen] = useState(false);
  
  const { authUser } = useAuthStore(); 
  
  const isCommentAuthor = authUser?.id === comment.userId || 
                          authUser?.name === comment.name;

  const createdDate = parseDate(comment.createdAt);
  const effectiveDepth = Math.min(depth, MAX_INDENT_LEVEL);
  const marginLeft = `${effectiveDepth * LEFT_SHIFT}px`;

  const isReplying = activeComment?.type === "replying" && activeComment.id === comment.id;
  const isEditing = activeComment?.type === "editing" && activeComment.id === comment.id;
  const hasActiveForm = isReplying || isEditing;

  const handleSubmitReply = (text: string, imageFile?: File) => {
    addComment(text, imageFile, comment.id, () => {
      setActiveComment(null);
    });
  };

  const handleSubmitUpdate = (text: string, imageFile?: File) => {
    const willBeEmpty = !text?.trim() && !imageFile && imageAttachments.length === 0;
    
    if (willBeEmpty) {
      toast.error("Comment must have either text or an image");
      return;
    }
    
    updateComment(text, comment.id, imageFile);
  };

  const handleRemoveImage = () => {
    if (!isCommentAuthor) {
      toast.error("You can only remove images from your own comments");
      return;
    }
    setImageDeleteDialogOpen(true);
  };

  const confirmRemoveImage = () => {
    removeImage(comment.id);
    setImageDeleteDialogOpen(false);
  };

  const openImageLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const openAvatarLightbox = () => {
    if (comment.avatarUrl && comment.avatarUrl !== "./user-icon.png") {
      setIsAvatarLightboxOpen(true);
    }
  };

  const handleEditClick = () => {
    if (!isCommentAuthor) {
      toast.error("You can only edit your own comments");
      return;
    }
    setActiveComment({ id: comment.id, type: "editing" });
  };

  const handleDeleteClick = () => {
    if (!isCommentAuthor) {
      toast.error("You can only delete your own comments");
      return;
    }
    deleteComment();
  };

  const imageAttachments = comment.attachments?.filter(att => att.type === 'image') || [];

  return (
    <>
      <div className="comment-wrapper" style={{ marginLeft }}>
        <div className={`comment depth-${effectiveDepth}`}>
          <div className="comment-image-container">
            <img
              src={comment.avatarUrl || "./user-icon.png"}
              alt={comment.name}
              className={`comment-avatar ${comment.avatarUrl && comment.avatarUrl !== "./user-icon.png" ? 'clickable' : ''}`}
              onClick={openAvatarLightbox}
            />
          </div>
          <div className="comment-right-part">
            <div className="comment-author">{comment.name}</div>
            <div className="comment-date">{createdDate.toLocaleDateString()}</div>

            {/* Show content differently when editing vs normal view */}
            {!isEditing ? (
              /* Normal view - show text and images */
              <div className="comment-content">
                {comment.comment && comment.comment.trim().length > 0 && (
                  <div className="comment-text">{comment.comment}</div>
                )}
                
                {/* Display image attachments */}
                {imageAttachments.length > 0 && (
                  <div className="comment-images">
                    {imageAttachments.map((attachment, index) => (
                      <div key={index} className="comment-image-attachment">
                        <img 
                          src={attachment.url} 
                          alt={`Attachment ${index + 1}`}
                          className="preview-image"
                          onClick={() => openImageLightbox(index)}
                        />
                        {/* Remove image button - только для автора */}
                        {isCommentAuthor && (
                          <button 
                            className="remove-image-button"
                            onClick={handleRemoveImage}
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Editing view - show text, then images, then form */
              <div className="editing-view">
                {/* Show current text as preview */}
                {comment.comment && comment.comment.trim().length > 0 && (
                  <div className="comment-text-preview">{comment.comment}</div>
                )}
                
                {/* Show current images above the form */}
                {imageAttachments.length > 0 && (
                  <div className="comment-images">
                    {imageAttachments.map((attachment, index) => (
                      <div key={index} className="comment-image-attachment">
                        <img 
                          src={attachment.url} 
                          alt={`Current ${index + 1}`}
                          className="preview-image"
                          onClick={() => openImageLightbox(index)}
                        />
                        {/* Remove image button - только для автора */}
                        {isCommentAuthor && (
                          <button 
                            className="remove-image-button"
                            onClick={handleRemoveImage}
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Editing form below the content */}
                <div className="editing-form">
                  <CommentForm
                    submitLabel="Update"
                    hasCancelButton
                    initialText={comment.comment || ""}
                    handleSubmit={handleSubmitUpdate}
                    handleCancel={() => setActiveComment(null)}
                    existingImageUrl={imageAttachments[0]?.url}
                    onSuccess={() => setActiveComment(null)}
                  />
                </div>
              </div>
            )}

            {isReplying && (
              <div className="reply-form-wrapper">
                <CommentForm
                  submitLabel="Reply"
                  handleSubmit={handleSubmitReply}
                  hasCancelButton
                  handleCancel={() => setActiveComment(null)}
                  existingImageUrl={imageAttachments[0]?.url}
                  onSuccess={() => setActiveComment(null)}
                />
              </div>
            )}

            {/* Actions always at the bottom - кнопки Edit/Delete только для автора */}
            <div className="comment-actions">
              {/* Reply доступен всем */}
              <span
                className={`comment-action ${isReplying ? 'active' : ''}`}
                onClick={() => setActiveComment({ id: comment.id, type: "replying" })}
              >
                Reply
              </span>
              
              {/* Edit только для автора */}
              {isCommentAuthor && (
                <span
                  className={`comment-action ${isEditing ? 'active' : ''}`}
                  onClick={handleEditClick}
                >
                  Edit
                </span>
              )}
              
              {/* Delete только для автора */}
              {isCommentAuthor && (
                <span
                  className="comment-action comment-delete"
                  onClick={handleDeleteClick}
                >
                  Delete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {replies}

      {/* Lightbox for image attachments */}
      {imageAttachments.length > 0 && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          slides={imageAttachments.map(att => ({ src: att.url }))}
          index={currentImageIndex}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}

      {/* Lightbox for avatar */}
      {comment.avatarUrl && comment.avatarUrl !== "./user-icon.png" && (
        <Lightbox
          open={isAvatarLightboxOpen}
          close={() => setIsAvatarLightboxOpen(false)}
          slides={[{ src: comment.avatarUrl }]}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}

      {/* Confirm Dialog for image deletion - только для автора */}
      {isCommentAuthor && (
        <ConfirmDialog 
          open={imageDeleteDialogOpen}
          onClose={() => setImageDeleteDialogOpen(false)}
          onConfirm={confirmRemoveImage}
          title="Remove Image"
          message={comment.comment && comment.comment.trim().length > 0 
            ? "Are you sure you want to remove this image? The text will remain."
            : "Are you sure you want to remove this image? The comment will be deleted since there is no text."
          }
        />
      )}
    </>
  );
};