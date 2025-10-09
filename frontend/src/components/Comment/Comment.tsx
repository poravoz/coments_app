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
  addComment: (text: string, imageFile?: File, videoFile?: File, parentId?: string | null, callback?: () => void) => void;
  updateComment: (text: string, commentId: string, imageFile?: File, videoFile?: File) => void;
  removeAttachment: (commentId: string, attachmentIndex: number) => void;
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
  removeAttachment,
  depth,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoLightboxOpen, setIsVideoLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isAvatarLightboxOpen, setIsAvatarLightboxOpen] = useState(false);
  const [attachmentDeleteDialogOpen, setAttachmentDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<{index: number} | null>(null);
  
  const { authUser } = useAuthStore(); 
  
  const isCommentAuthor = authUser?.id === comment.userId || 
                          authUser?.name === comment.name;

  const createdDate = parseDate(comment.createdAt);
  const effectiveDepth = Math.min(depth, MAX_INDENT_LEVEL);
  const marginLeft = `${effectiveDepth * LEFT_SHIFT}px`;

  const isReplying = activeComment?.type === "replying" && activeComment.id === comment.id;
  const isEditing = activeComment?.type === "editing" && activeComment.id === comment.id;
  const hasActiveForm = isReplying || isEditing;

  const handleSubmitReply = (text: string, imageFile?: File, videoFile?: File) => {
    addComment(text, imageFile, videoFile, comment.id, () => {
      setActiveComment(null);
    });
  };

  const handleSubmitUpdate = (text: string, imageFile?: File, videoFile?: File) => {
    const willBeEmpty = !text?.trim() && !imageFile && !videoFile && attachments.length === 0;
    
    if (willBeEmpty) {
      toast.error("Comment must have either text, image or video");
      return;
    }
    
    updateComment(text, comment.id, imageFile, videoFile);
  };

  const handleRemoveAttachment = (index: number) => {
    if (!isCommentAuthor) {
      toast.error("You can only remove attachments from your own comments");
      return;
    }
    setAttachmentToDelete({ index });
    setAttachmentDeleteDialogOpen(true);
  };

  const confirmRemoveAttachment = () => {
    if (!attachmentToDelete) return;
    
    removeAttachment(comment.id, attachmentToDelete.index);
    setAttachmentDeleteDialogOpen(false);
    setAttachmentToDelete(null);
  };

  const openImageLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const openVideoLightbox = (index: number) => {
    setCurrentVideoIndex(index);
    setIsVideoLightboxOpen(true);
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

  const attachments = comment.attachments || [];
  const imageAttachments = attachments.filter(att => att.type === 'image');
  const videoAttachments = attachments.filter(att => att.type === 'video');
  const existingImageUrl = imageAttachments[0]?.url;
  const existingVideoUrl = videoAttachments[0]?.url;

  const getDeleteMessage = () => {
    if (!attachmentToDelete) return "";
    
    const hasText = comment.comment && comment.comment.trim().length > 0;
    const hasOtherAttachments = attachments.length > 1;
    const attachmentToRemove = attachments[attachmentToDelete.index];
    
    if (hasText || hasOtherAttachments) {
      return `Are you sure you want to remove this ${attachmentToRemove?.type}?`;
    } else {
      return `Are you sure you want to remove this ${attachmentToRemove?.type}? The comment will be deleted since there is no text or other attachments.`;
    }
  };

  const getAttachmentTitle = () => {
    if (!attachmentToDelete) return "Attachment";
    const attachment = attachments[attachmentToDelete.index];
    return attachment?.type === 'image' ? 'Image' : 'Video';
  };

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
              /* Normal view - show text and attachments */
              <div className="comment-content">
                {comment.comment && comment.comment.trim().length > 0 && (
                  <div className="comment-text">{comment.comment}</div>
                )}
                
                {/* Display attachments container */}
                {(imageAttachments.length > 0 || videoAttachments.length > 0) && (
                  <div className="comment-attachments-container">
                    {/* Image attachments */}
                    {imageAttachments.map((attachment, index) => (
                      <div key={`image-${index}`} className="comment-attachment">
                        <img 
                          src={attachment.url} 
                          alt={`Attachment ${index + 1}`}
                          className="preview-media"
                          onClick={() => openImageLightbox(index)}
                        />
                        {/* Remove attachment button - только для автора */}
                        {isCommentAuthor && (
                          <button 
                            className="remove-attachment-button"
                            onClick={() => handleRemoveAttachment(attachments.indexOf(attachment))}
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Video attachments */}
                    {videoAttachments.map((attachment, index) => (
                      <div key={`video-${index}`} className="comment-attachment">
                        <div className="video-preview-wrapper">
                          <video 
                            src={attachment.url} 
                            className="preview-media video-preview"
                          />
                          <div className="video-overlay" onClick={() => openVideoLightbox(index)}>
                            <div className="play-button">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        {/* Remove attachment button - только для автора */}
                        {isCommentAuthor && (
                          <button 
                            className="remove-attachment-button"
                            onClick={() => handleRemoveAttachment(attachments.indexOf(attachment))}
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
              /* Editing view - show text, then attachments, then form */
              <div className="editing-view">
                {/* Show current text as preview */}
                {comment.comment && comment.comment.trim().length > 0 && (
                  <div className="comment-text-preview">{comment.comment}</div>
                )}
                
                {/* Show current attachments above the form */}
                {(imageAttachments.length > 0 || videoAttachments.length > 0) && (
                  <div className="comment-attachments-container">
                    {imageAttachments.map((attachment, index) => (
                      <div key={`image-edit-${index}`} className="comment-attachment">
                        <img 
                          src={attachment.url} 
                          alt={`Current ${index + 1}`}
                          className="preview-media"
                          onClick={() => openImageLightbox(index)}
                        />
                        {isCommentAuthor && (
                          <button 
                            className="remove-attachment-button"
                            onClick={() => handleRemoveAttachment(attachments.indexOf(attachment))}
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {videoAttachments.map((attachment, index) => (
                      <div key={`video-edit-${index}`} className="comment-attachment">
                        <div className="video-preview-wrapper">
                          <video 
                            src={attachment.url} 
                            className="preview-media video-preview"
                          />
                          <div className="video-overlay" onClick={() => openVideoLightbox(index)}>
                            <div className="play-button">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        {isCommentAuthor && (
                          <button 
                            className="remove-attachment-button"
                            onClick={() => handleRemoveAttachment(attachments.indexOf(attachment))}
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
                    existingImageUrl={existingImageUrl}
                    existingVideoUrl={existingVideoUrl}
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
                  existingImageUrl={existingImageUrl}
                  existingVideoUrl={existingVideoUrl}
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

      {/* Lightbox for video attachments */}
      {videoAttachments.length > 0 && (
        <Lightbox
          open={isVideoLightboxOpen}
          close={() => setIsVideoLightboxOpen(false)}
          slides={videoAttachments.map(att => ({ src: att.url }))}
          index={currentVideoIndex}
          render={{
            slide: ({ slide }) => (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '20px'
              }}>
                <video
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '10px',
                    outline: 'none'
                  }}
                >
                  <source src={slide.src} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ),
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

      {/* Confirm Dialog for attachment deletion - только для автора */}
      {isCommentAuthor && (
        <ConfirmDialog 
          open={attachmentDeleteDialogOpen}
          onClose={() => {
            setAttachmentDeleteDialogOpen(false);
            setAttachmentToDelete(null);
          }}
          onConfirm={confirmRemoveAttachment}
          title={`Remove ${getAttachmentTitle()}`}
          message={getDeleteMessage()}
        />
      )}
    </>
  );
};