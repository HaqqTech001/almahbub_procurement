import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

interface FileAttachment {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  uploadedUrl?: string;
  error?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (id: string) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  attachments,
  onRemoveAttachment,
  maxFiles = 5,
  maxSize = 10, // 10MB
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (file: File) => file.type.startsWith('image/');
  const isPdf = (file: File) => file.type === 'application/pdf';
  const isDocument = (file: File) =>
    file.type.includes('word') || file.type.includes('excel') || file.type.includes('spreadsheet');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxSizeBytes = maxSize * 1024 * 1024;

    Array.from(files).forEach(file => {
      if (validFiles.length >= maxFiles) {
        return;
      }

      if (file.size > maxSizeBytes) {
        alert(`${file.name} is too large. Maximum size is ${maxSize}MB`);
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const validFiles = validateFiles(files);
      onFilesSelected(validFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files) {
      const validFiles = validateFiles(files);
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const getFileIcon = (file: File) => {
    if (isImage(file)) return <ImageIcon className="h-8 w-8 text-blue-500" />;
    if (isPdf(file)) return <FileText className="h-8 w-8 text-red-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${isDragging
            ? 'border-teal-500 bg-teal-50'
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-teal-600' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600">
            <span className="font-medium text-teal-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Images, PDF, or documents up to {maxSize}MB (max {maxFiles} files)
          </p>
        </label>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Preview or Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(attachment.file)
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.file.size)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onRemoveAttachment(attachment.id)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
