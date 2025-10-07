import React, { useState } from "react";
import { Image, Video, Paperclip, Send } from "lucide-react";
import "./CommentForm.css";

interface CommentsFormProps {
  handleSubmit: (text: string) => void;
  submitLabel?: string;
  hasCancelButton?: boolean;
  initialText?: string;
  handleCancel?: () => void;
}

export const CommentForm: React.FC<CommentsFormProps> = ({
  handleSubmit,
  submitLabel = "Send",
  hasCancelButton = false,
  initialText = "",
  handleCancel
}) => {
  const [text, setText] = useState(initialText);
  const isTextareaDisabled = text.trim().length === 0;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (text.trim() === "") return;
    handleSubmit(text.trim());
    setText("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isTextareaDisabled) handleSubmit(text.trim());
      setText("");
    }
  };

  return (
    <form onSubmit={onSubmit} className="comment-form">
      <div className="comment-input-wrapper">
        <textarea
          className="comment-form-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
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

      <div className="comment-form-footer">
        <div className="comment-icons">
          <button type="button" className="comment-icon-button">
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
    </form>
  );
};
