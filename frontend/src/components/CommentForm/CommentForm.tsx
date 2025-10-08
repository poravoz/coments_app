import React, { useState, useRef } from "react";
import { Image, Video, Paperclip, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./CommentForm.css";

interface CommentsFormProps {
  handleSubmit: (text: string, imageFile?: File) => void;
  submitLabel?: string;
  hasCancelButton?: boolean;
  initialText?: string | null;
  handleCancel?: () => void;
  existingImageUrl?: string;
  onSuccess?: () => void;
}

const MAX_CHARACTERS = 500;

export const CommentForm: React.FC<CommentsFormProps> = ({
  handleSubmit,
  submitLabel = "Send",
  hasCancelButton = false,
  initialText = "",
  handleCancel,
  existingImageUrl,
  onSuccess 
}) => {
  const [text, setText] = useState(initialText || "");
  const [charCount, setCharCount] = useState((initialText?.length || 0));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isNearLimit = charCount > MAX_CHARACTERS * 0.8; // 80%
  const isOverLimit = charCount > MAX_CHARACTERS;
  const isTextareaDisabled = (text?.trim().length || 0) === 0 && !imageFile && !existingImageUrl || isOverLimit;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARACTERS) {
      setText(newText);
      setCharCount(newText.length);
    } else {
      if (newText.length === MAX_CHARACTERS + 1) {
        toast.error(`Character limit reached (${MAX_CHARACTERS} characters maximum)`);
      }
    }
  };

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size > 500 * 1024) { 
        resolve(false);
        return;
      }
  
      const img: HTMLImageElement = new window.Image();
      
      const timeout = setTimeout(() => {
        console.error('Image validation timeout');
        resolve(false);
      }, 5000);
  
      img.onload = () => {
        clearTimeout(timeout);
        const isValid = img.width <= 320 && img.height <= 240;
        URL.revokeObjectURL(img.src);
        resolve(isValid);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.error('Failed to load image for validation');
        resolve(false);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const isSameImage = async (newFile: File, existingUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      fetch(existingUrl)
        .then(response => response.blob())
        .then(existingBlob => {
          if (Math.abs(newFile.size - existingBlob.size) > 1024) {
            resolve(false);
            return;
          }

          const newReader = new FileReader();
          newReader.onload = (e) => {
            const newImageData = e.target?.result as string;
            
            const existingReader = new FileReader();
            existingReader.onload = (e2) => {
              const existingImageData = e2.target?.result as string;
              resolve(newImageData === existingImageData);
            };
            existingReader.readAsDataURL(existingBlob);
          };
          newReader.readAsDataURL(newFile);
        })
        .catch(() => resolve(false));
    });
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      const isValid = await validateImage(file);
      if (!isValid) {
        toast.error("Image dimensions must be 320x240 pixels or smaller");
        return;
      }

      if (existingImageUrl) {
        const isDuplicate = await isSameImage(file, existingImageUrl);
        if (isDuplicate) {
          toast.error("This is the same image already attached to the comment");
          return;
        }
      }

      if (imagePreview) {
        const newReader = new FileReader();
        newReader.onload = (e) => {
          const newImageData = e.target?.result as string;
          if (newImageData === imagePreview) {
            toast.error("This is the same image already selected");
            return;
          }
          setImageFile(file);
          setImagePreview(newImageData);
        };
        newReader.readAsDataURL(file);
      } else {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error in handleImageSelect:', error);
      toast.error("Error validating image");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isOverLimit) {
      toast.error(`Comment cannot exceed ${MAX_CHARACTERS} characters`);
      return;
    }
    
    const hasContent = (text?.trim().length || 0) > 0 || imageFile || existingImageUrl;
    
    if (!hasContent) {
      toast.error("Comment must have either text or an image");
      return;
    }
    
    try {
      await handleSubmit(text?.trim() || "", imageFile || undefined);
      
      if (onSuccess) {
        onSuccess();
      } else {
        setText("");
        setCharCount(0);
        removeImage();
      }
    } catch (error) {
      console.error(' Error in onSubmit:', error);
    }
  };
  
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTextareaDisabled && !isOverLimit) {
        handleSubmit(text?.trim() || "", imageFile || undefined);
        
        if (onSuccess) {
          onSuccess();
        } else {
          setText("");
          setCharCount(0);
          removeImage();
        }
      }
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className="comment-form">
        <div className="comment-input-wrapper">
          <div className={`char-counter ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}>
            {charCount}/{MAX_CHARACTERS}
            {isOverLimit && <span className="error-message"> Limit exceeded!</span>}
          </div>
          
          <textarea
            className={`comment-form-textarea ${isOverLimit ? 'error' : ''}`}
            value={text}
            onChange={handleTextChange}
            onKeyDown={onKeyDown}
            placeholder="Write a comment..."
          />
          <button
            type="submit"
            className="comment-send-icon"
            disabled={isTextareaDisabled}
          >
            <Send size={20} />
          </button>
        </div>
  
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
  
        <div className="comment-form-footer">
          <div className="comment-icons">
            <button 
              type="button" 
              className="comment-icon-button"
              onClick={triggerFileInput}
            >
              <Image size={18} />
            </button>
            <button type="button" className="comment-icon-button">
              <Video size={18} />
            </button>
            <button type="button" className="comment-icon-button">
              <Paperclip size={18} />
            </button>
          </div>
  
          {hasCancelButton && (
            <button
              type="button"
              className="comment-form-button comment-form-cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
  
        {imagePreview && (
          <div className="image-preview-container">
            <div className="image-preview">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="preview-image"
                onClick={openLightbox}
                style={{ cursor: 'pointer' }}
              />
              <button 
                type="button" 
                className="remove-image-button"
                onClick={removeImage}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </form>
  
      {/* Lightbox Overlay */}
      {imagePreview && (
       <Lightbox
          open={lightboxOpen}
          close={closeLightbox}
          slides={[{ src: imagePreview }]}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          controller={{ closeOnBackdropClick: true }}
        />
      )}
    </>
  );
}