import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface ImageViewerProps {
  images: Array<{ url: string; originalname: string; mimetype?: string }>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(initialIndex);
      setZoom(1);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsLoading(true);
    setZoom(1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 text-white/80 hover:text-white transition-colors p-2"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 text-white/80 hover:text-white transition-colors p-2"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </>
      )}

      {/* Image counter */}
      <div className="absolute top-4 left-4 text-white/60 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/10 rounded-full px-4 py-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="text-white/80 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ZoomOut className="h-6 w-6" />
        </button>
        <span className="text-white/80 text-sm">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="text-white/80 hover:text-white disabled:opacity-30 transition-colors"
        >
          <ZoomIn className="h-6 w-6" />
        </button>
      </div>

      {/* Download button */}
      <a
        href={currentImage.url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 text-white/80 hover:text-white transition-colors p-2"
        download={currentImage.originalname}
      >
        <Download className="h-6 w-6" />
      </a>

      {/* Image container */}
      <div className="w-full h-full flex items-center justify-center p-8">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        <img
          src={currentImage.url}
          alt={currentImage.originalname}
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-out',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
          onLoad={handleImageLoad}
          className={`${isLoading ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>

      {/* Image name */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/80 text-center">
        <p className="text-lg font-medium">{currentImage.originalname}</p>
      </div>
    </div>
  );
};

export default ImageViewer;
