import React, { useState, useRef } from "react";
import { 
  Image, 
  Video, 
  Paperclip, 
  Send, 
  X, 
  File, 
  FileText, 
  Download, 
  FileCode,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileAudio,
  FileVideo,
  FileSignature,
} from "lucide-react";
import toast from "react-hot-toast";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./CommentForm.css";
import { ImageLightbox } from "../Lightbox/ImageLightbox";
import { VideoLightbox } from "../Lightbox/VideoLightbox";

interface CommentsFormProps {
  handleSubmit: (text: string, imageFile?: File, videoFile?: File, attachmentFile?: File) => void;
  submitLabel?: string;
  hasCancelButton?: boolean;
  initialText?: string | null;
  handleCancel?: () => void;
  existingImageUrl?: string;
  existingVideoUrl?: string;
  existingAttachmentUrl?: string;
  onSuccess?: () => void;
}

const MAX_CHARACTERS = 250;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ATTACHMENT_SIZE = 100 * 1024; // 100KB
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const SUPPORTED_ATTACHMENT_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const CommentForm: React.FC<CommentsFormProps> = ({
  handleSubmit,
  hasCancelButton = false,
  initialText = "",
  handleCancel,
  existingImageUrl,
  existingVideoUrl,
  existingAttachmentUrl,
  onSuccess 
}) => {
  const [text, setText] = useState(initialText || "");
  const [charCount, setCharCount] = useState((initialText?.length || 0));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoLightboxOpen, setVideoLightboxOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  
  const isNearLimit = charCount > MAX_CHARACTERS * 0.8;
  const isOverLimit = charCount > MAX_CHARACTERS;
  const hasContent = (text?.trim().length || 0) > 0 || imageFile || videoFile || attachmentFile || existingImageUrl || existingVideoUrl || existingAttachmentUrl;
  const isSubmitDisabled = !hasContent || isOverLimit;

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

  const validateVideo = (file: File): boolean => {
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(`Video size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
      return false;
    }
    
    if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
      toast.error("Please select a supported video format (MP4, WebM, OGG)");
      return false;
    }
    
    return true;
  };

  const validateAttachment = (file: File): boolean => {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error(`File size must be less than ${MAX_ATTACHMENT_SIZE / 1024}KB`);
      return false;
    }
    
    if (!SUPPORTED_ATTACHMENT_TYPES.includes(file.type)) {
      toast.error("Please select a supported file format (TXT, PDF, DOC, DOCX, XLS, XLSX)");
      return false;
    }
    
    return true;
  };

  const openVideoLightbox = () => {
    setVideoLightboxOpen(true);
  };
  
  const closeVideoLightbox = () => {
    setVideoLightboxOpen(false);
  };

  const isSameFile = async (newFile: File, existingUrl: string): Promise<boolean> => {
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
            const newFileData = e.target?.result as string;
            
            const existingReader = new FileReader();
            existingReader.onload = (e2) => {
              const existingFileData = e2.target?.result as string;
              resolve(newFileData === existingFileData);
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
        const isDuplicate = await isSameFile(file, existingImageUrl);
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

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateVideo(file)) {
      return;
    }

    try {
      if (existingVideoUrl) {
        const isDuplicate = await isSameFile(file, existingVideoUrl);
        if (isDuplicate) {
          toast.error("This is the same video already attached to the comment");
          return;
        }
      }

      if (videoPreview) {
        const newReader = new FileReader();
        newReader.onload = (e) => {
          const newVideoData = e.target?.result as string;
          if (newVideoData === videoPreview) {
            toast.error("This is the same video already selected");
            return;
          }
          setVideoFile(file);
          setVideoPreview(newVideoData);
        };
        newReader.readAsDataURL(file);
      } else {
        setVideoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setVideoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error in handleVideoSelect:', error);
      toast.error("Error processing video");
    }
  };

  const handleAttachmentSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateAttachment(file)) {
      return;
    }

    try {
      if (existingAttachmentUrl) {
        const isDuplicate = await isSameFile(file, existingAttachmentUrl);
        if (isDuplicate) {
          toast.error("This is the same file already attached to the comment");
          return;
        }
      }

      setAttachmentFile(file);
      setAttachmentPreview(URL.createObjectURL(new Blob([`File: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)}KB`], { type: 'text/plain' })));
    } catch (error) {
      console.error('Error in handleAttachmentSelect:', error);
      toast.error("Error processing file");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const triggerImageInput = () => {
    imageInputRef.current?.click();
  };

  const triggerVideoInput = () => {
    videoInputRef.current?.click();
  };

  const triggerAttachmentInput = () => {
    attachmentInputRef.current?.click();
  };

  const openLightbox = () => {
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText size={24} color="#ff4444" />;
      case 'doc':
      case 'docx':
        return <FileCode size={24} color="#2b579a" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet size={24} color="#217346" />;
      case 'txt':
        return <FileSignature size={24} color="#666" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage size={24} color="#ff6b6b" />;
      case 'mp4':
      case 'webm':
      case 'ogg':
        return <FileVideo size={24} color="#ff9900" />;
      case 'mp3':
      case 'wav':
        return <FileAudio size={24} color="#0099ff" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileArchive size={24} color="#ffcc00" />;
      default:
        return <File size={24} color="#666" />;
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isOverLimit) {
      toast.error(`Comment cannot exceed ${MAX_CHARACTERS} characters`);
      return;
    }
    
    const hasContent = (text?.trim().length || 0) > 0 || imageFile || videoFile || attachmentFile || existingImageUrl || existingVideoUrl || existingAttachmentUrl;
    
    if (!hasContent) {
      toast.error("Comment must have either text, image, video or file");
      return;
    }
    
    try {
      await handleSubmit(text?.trim() || "", imageFile || undefined, videoFile || undefined, attachmentFile || undefined);
      
      if (onSuccess) {
        onSuccess();
      } else {
        setText("");
        setCharCount(0);
        removeImage();
        removeVideo();
        removeAttachment();
      }
    } catch (error) {
      console.error('Error in onSubmit:', error);
    }
  };
  
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitDisabled && !isOverLimit) {
        handleSubmit(text?.trim() || "", imageFile || undefined, videoFile || undefined, attachmentFile || undefined);
        
        if (onSuccess) {
          onSuccess();
        } else {
          setText("");
          setCharCount(0);
          removeImage();
          removeVideo();
          removeAttachment();
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
            disabled={isSubmitDisabled}
          >
            <Send size={20} />
          </button>
        </div>
  
        {/* Hidden file inputs */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={attachmentInputRef}
          onChange={handleAttachmentSelect}
          accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
          style={{ display: 'none' }}
        />
  
        {/* Preview container for all attachments */}
        {(imagePreview || videoPreview || attachmentPreview) && (
          <div className="attachment-preview-container">
            {/* Image Preview */}
            {imagePreview && (
              <div className="attachment-preview">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="preview-media"
                  onClick={openLightbox}
                  style={{ cursor: 'pointer' }}
                />
                <button 
                  type="button" 
                  className="remove-attachment-button"
                  onClick={removeImage}
                >
                  <X size={16} />
                </button>
              </div>
            )}
  
            {/* Video Preview */}
            {videoPreview && (
              <div className="attachment-preview">
                <div className="video-preview-wrapper">
                  <video 
                    src={videoPreview} 
                    className="preview-media video-preview"
                  />
                  <div className="video-overlay" onClick={openVideoLightbox}>
                    <div className="play-button">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-attachment-button"
                  onClick={removeVideo}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Attachment Preview */}
            {attachmentPreview && attachmentFile && (
              <div className="attachment-preview">
                <div className="file-preview-wrapper" onClick={() => {
                  const url = URL.createObjectURL(attachmentFile);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = attachmentFile.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}>
                  <div className="file-preview">
                    <div className="file-icon">
                      {getFileIcon(attachmentFile.name)}
                    </div>
                    <div className="file-info">
                      <div className="file-name">{attachmentFile.name}</div>
                      <div className="file-size">{(attachmentFile.size / 1024).toFixed(2)} KB</div>
                    </div>
                    <div className="file-download">
                      <Download size={16} />
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-attachment-button"
                  onClick={removeAttachment}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            </div>
          )}
  
        <div className="comment-form-footer">
          <div className="comment-icons">
            <button 
              type="button" 
              className="comment-icon-button"
              onClick={triggerImageInput}
            >
              <Image size={18} />
            </button>
            <button 
              type="button" 
              className="comment-icon-button"
              onClick={triggerVideoInput}
            >
              <Video size={18} />
            </button>
            <button 
              type="button" 
              className="comment-icon-button"
              onClick={triggerAttachmentInput}
            >
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
      </form>
  
      {/* Lightbox for Image */}
      {imagePreview && (
        <ImageLightbox
          open={lightboxOpen}
          onClose={closeLightbox}
          images={[imagePreview]}
        />
      )}

      {/* Lightbox for Video */}
      {videoPreview && (
      <VideoLightbox
        open={videoLightboxOpen}
        onClose={closeVideoLightbox}
        videos={[videoPreview]}
      />
    )}
    </>
  );
};