import React, { useCallback, useState } from 'react';
import { Upload, X, Image, File, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaUploadProps {
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  files: UploadedFile[];
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesSelected,
  onRemoveFile,
  files,
  maxFiles = 5,
  maxSizeMB = 5,
  accept = 'image/*,.pdf,.doc,.docx',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
      return false;
    }
    
    return true;
  };

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    setError(null);
    const newFiles: File[] = [];
    
    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }
      
      if (validateFile(file)) {
        newFiles.push(file);
      }
    });
    
    if (newFiles.length > 0) {
      onFilesSelected(newFiles);
    }
  }, [files.length, maxFiles, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input to allow selecting same file again
    e.target.value = '';
  }, [handleFiles]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-[#0F4C5C] bg-[#0F4C5C]/5' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          className="hidden"
          id="media-upload"
          disabled={files.length >= maxFiles}
        />
        
        <label htmlFor="media-upload" className="cursor-pointer">
          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Click or drag files to upload
          </p>
          <p className="text-sm text-gray-500">
            Up to {maxFiles} files, max {maxSizeMB}MB each
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supports images, PDFs, and documents
          </p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((uploadedFile, index) => (
            <div 
              key={uploadedFile.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white"
            >
              {/* Preview or Icon */}
              <div className="aspect-square flex items-center justify-center bg-gray-50">
                {uploadedFile.preview ? (
                  <img 
                    src={uploadedFile.preview} 
                    alt={uploadedFile.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-4">
                    {getFileIcon(uploadedFile.file)}
                  </div>
                )}
              </div>
              
              {/* File Info */}
              <div className="p-2">
                <p className="text-sm font-medium text-gray-700 truncate" title={uploadedFile.file.name}>
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => onRemoveFile(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
