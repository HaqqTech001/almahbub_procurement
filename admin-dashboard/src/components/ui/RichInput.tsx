import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import EmojiPickerComponent from './EmojiPicker';
import FileUpload from './FileUpload';

interface FileAttachment {
  id: string;
  file: File;
  preview?: string;
}

interface RichInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: File[]) => void;
  onFilesSelected?: (files: File[]) => void;
  placeholder?: string;
  showAttachments?: boolean;
  isLoading?: boolean;
  maxAttachments?: number;
}

const RichInput: React.FC<RichInputProps> = ({
  value,
  onChange,
  onSubmit,
  onFilesSelected,
  placeholder = 'Type a message...',
  showAttachments = true,
  isLoading = false,
  maxAttachments = 5
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
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
    const newAttachments: FileAttachment[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setAttachments(prev => [...prev, ...newAttachments].slice(0, maxAttachments));
    setShowFileUpload(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSubmit = () => {
    if ((value.trim() || attachments.length > 0) && !isLoading) {
      // Get files to pass to submit handler
      const files = attachments.length > 0 ? attachments.map(a => a.file) : undefined;
      
      // Pass file attachments to parent if callback provided (for pre-submit processing)
      if (onFilesSelected && attachments.length > 0) {
        onFilesSelected(attachments.map(a => a.file));
      }
      
      // Pass files to submit handler
      onSubmit(files);
      
      // Reset
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
            attachments={attachments.map(a => ({
              id: a.id,
              file: a.file,
              preview: a.preview,
              uploadProgress: 0
            }))}
            onRemoveAttachment={handleRemoveAttachment}
            maxFiles={maxAttachments}
          />
        </div>
      )}

      {/* Attachments Preview - Compact horizontal scroll */}
      {attachments.length > 0 && !showFileUpload && (
        <div className="p-3 border-b bg-gray-50 shrink-0 max-h-[100px] overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative group flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border shadow-sm max-w-[180px]"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 truncate flex-1 min-w-0">
                  {attachment.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="p-0.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3 text-gray-500" />
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
                  ${showFileUpload ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100 text-gray-500'}
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
            disabled={isLoading || (!value.trim() && attachments.length === 0)}
            size="sm"
            className={`
              rounded-lg transition-colors
              ${value.trim() || attachments.length > 0
                ? 'bg-teal-600 hover:bg-teal-700 text-white'
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
