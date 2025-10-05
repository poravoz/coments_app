import React, { useState } from "react"

interface CommentsFormProps {
    handleSubmit: (text: string) => void;
    submitLabel: string;
    hasCancelButton?: boolean;
    initialText?: string;
    handleCancel?: () => void;
}

export const CommentForm: React.FC<CommentsFormProps> = ({ 
    handleSubmit, 
    submitLabel, 
    hasCancelButton = false, 
    initialText = "", 
    handleCancel 
  }) => {

    const [text, setText] = useState(initialText);
    const isTextareaDisabled = text.length === 0;

    const onSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      if (text.trim() === "") return;
      handleSubmit(text.trim());
      setText("");
    };
  
    return (
      <form onSubmit={onSubmit} className="comment-form">
        <textarea 
            className="comment-form-textarea" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Write a comment..."
        />
        <div className="comment-form-actions">
          <button className="comment-form-button" disabled={isTextareaDisabled}> {submitLabel} </button>
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