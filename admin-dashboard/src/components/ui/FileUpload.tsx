import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileAttachment {
  id: string;
  file: File;
  preview?: string;
  uploadProgress?: number;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (id: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  attachments,
  onRemoveAttachment,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  maxSizeMB = 10
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    // Check file type
    const isAcceptedType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('/*')) {
        return file.type.startsWith(type.replace('/*', ''));
      }
      return file.type === type;
    });

    if (!isAcceptedType) {
      return 'File type not supported';
    }

    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    setError(null);
    const newFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        invalidFiles.push(`${file.name}: ${validationError}`);
      } else {
        newFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setError(invalidFiles.join('; '));
    }

    if (newFiles.length > 0) {
      // Check max files limit
      const totalFiles = attachments.length + newFiles.length;
      if (totalFiles > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed. You have ${attachments.length} already selected.`);
        onFilesSelected(newFiles.slice(0, maxFiles - attachments.length));
      } else {
        onFilesSelected(newFiles);
      }
    }
  }, [attachments.length, maxFiles, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-green-500" />;
    }
    if (file.type.startsWith('video/')) {
      return <div className="h-8 w-8 text-purple-500 flex items-center justify-center text-xs font-bold">VID</div>;
    }
    if (file.type.startsWith('audio/')) {
      return <div className="h-8 w-8 text-orange-500 flex items-center justify-center text-xs font-bold">AUD</div>;
    }
    if (file.type.includes('pdf')) {
      return <div className="h-8 w-8 text-red-500 flex items-center justify-center text-xs font-bold">PDF</div>;
    }
    if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      return <div className="h-8 w-8 text-blue-500 flex items-center justify-center text-xs font-bold">DOC</div>;
    }
    if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      return <div className="h-8 w-8 text-green-600 flex items-center justify-center text-xs font-bold">XLS</div>;
    }
    return <FileIcon className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFilePicker}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
        
        <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          Images, videos, audio, PDF, DOC, XLS, PPT (max {maxSizeMB}MB each)
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Selected files ({attachments.length}/{maxFiles})</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-2 bg-white rounded-lg border"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex-shrink-0">
                    {getFileIcon(attachment.file)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {attachment.uploadProgress !== undefined && attachment.uploadProgress < 100 && (
                    <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${attachment.uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAttachment(attachment.id);
                  }}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
