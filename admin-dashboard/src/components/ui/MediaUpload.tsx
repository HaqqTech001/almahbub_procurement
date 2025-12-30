import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image, FileText, Video, Music, File } from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  preview: string | null;
  type: 'image' | 'video' | 'audio' | 'document' | 'unknown';
}

interface MediaUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
}

const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' | 'unknown' => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (
    file.type.includes('pdf') ||
    file.type.includes('document') ||
    file.type.includes('text/') ||
    file.type.includes('spreadsheet') ||
    file.type.includes('presentation')
  ) {
    return 'document';
  }
  return 'unknown';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  disabled = false,
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const createPreview = async (file: File): Promise<string | null> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Check file count
      if (fileArray.length + mediaFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file sizes and create previews
      const validFiles: File[] = [];
      const newMediaFiles: MediaFile[] = [];

      for (const file of fileArray) {
        if (file.size > maxSizeBytes) {
          setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
          continue;
        }

        validFiles.push(file);
        const preview = await createPreview(file);
        newMediaFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          type: getFileType(file),
        });
      }

      if (validFiles.length > 0) {
        const updatedFiles = [...mediaFiles, ...newMediaFiles];
        setMediaFiles(updatedFiles);
        onFilesSelected(updatedFiles.map((mf) => mf.file));
      }
    },
    [mediaFiles, maxFiles, maxSizeBytes, maxSizeMB, onFilesSelected]
  );

  const removeFile = (id: string) => {
    const updatedFiles = mediaFiles.filter((mf) => mf.id !== id);
    setMediaFiles(updatedFiles);
    onFilesSelected(updatedFiles.map((mf) => mf.file));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image':
        return <Image className="h-8 w-8 text-green-500" />;
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'audio':
        return <Music className="h-8 w-8 text-orange-500" />;
      case 'document':
        return <FileText className="h-8 w-8 text-blue-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
        onDragOver={!disabled ? handleDragOver : undefined}
        onDragLeave={!disabled ? handleDragLeave : undefined}
        onDrop={!disabled ? handleDrop : undefined}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium text-foreground">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          {accept.replace(/\*/g, '').replace(/,/g, ', ')} up to {maxSizeMB}MB each (max {maxFiles} files)
        </p>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Preview grid */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaFiles.map((media) => (
            <div
              key={media.id}
              className="relative group rounded-lg border border-border overflow-hidden"
            >
              {/* Preview or icon */}
              <div className="aspect-square flex items-center justify-center bg-muted">
                {media.preview ? (
                  <img
                    src={media.preview}
                    alt={media.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(media.type)
                )}
              </div>

              {/* File info */}
              <div className="p-2">
                <p className="text-xs font-medium truncate" title={media.file.name}>
                  {media.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(media.file.size)}
                </p>
              </div>

              {/* Remove button */}
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(media.id);
                  }}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
