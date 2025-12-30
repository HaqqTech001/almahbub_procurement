import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmojiPickerComponent from './EmojiPicker';
import FileUpload from './FileUpload';

interface RichInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFilesSelected?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  placeholder?: string;
  showAttachments?: boolean;
  isLoading?: boolean;
  maxAttachments?: number;
  attachedFiles?: { file: File; type: 'image' | 'file'; preview?: string }[];
}

const RichInput: React.FC<RichInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFilesSelected,
  onRemoveFile,
  placeholder = 'Type a message...',
  showAttachments = true,
  isLoading = false,
  maxAttachments = 5,
  attachedFiles = []
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + emoji + value.substring(end);
      onChange(newValue);
      // Focus back and set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (onFilesSelected) {
      onFilesSelected(files);
    }
    setShowFileUpload(false);
  };

  const handleRemoveFile = (index: number) => {
    if (onRemoveFile) {
      onRemoveFile(index);
    }
  };

  const handleSubmit = () => {
    if ((value.trim() || attachedFiles.length > 0) && !isLoading) {
      // Just call submit - parent handles getting files from its state
      onSubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border rounded-lg bg-white">
      {/* File Upload Area - Collapsible overlay */}
      {showFileUpload && (
        <div className="p-3 border-b bg-gray-50 shrink-0">
          <FileUpload
            onFilesSelected={handleFilesSelected}
            attachments={attachedFiles.map((f, i) => ({
              id: i.toString(),
              file: f.file,
              preview: f.preview,
              uploadProgress: 0
            }))}
            onRemoveAttachment={(id) => handleRemoveFile(parseInt(id))}
            maxFiles={maxAttachments}
          />
        </div>
      )}

      {/* Attachments Preview - Compact horizontal scroll */}
      {attachedFiles.length > 0 && !showFileUpload && (
        <div className="p-3 border-b bg-gray-50 shrink-0 max-h-[100px] overflow-x-auto overflow-y-hidden">
          <div className="flex items-center gap-2 min-w-min">
            {attachedFiles.map((attachment, index) => (
              <div
                key={index}
                className="relative group flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border shadow-sm flex-shrink-0"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 truncate max-w-[120px]">
                  {attachment.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3">
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            {showAttachments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`
                  p-2 h-auto rounded-lg transition-colors
                  ${showFileUpload ? 'bg-cyan-100 text-cyan-700' : 'hover:bg-gray-100 text-gray-500'}
                `}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            )}
            <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none p-0 text-sm"
            rows={1}
            disabled={isLoading}
          />

          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!value.trim() && attachedFiles.length === 0)}
            size="sm"
            className={`
              rounded-lg transition-colors
              ${value.trim() || attachedFiles.length > 0
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-gray-100 text-gray-400'
              }
            `}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RichInput;
