import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'full': return 'max-w-full';
      default: return 'max-w-md';
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'left': return 'left-0 top-0 bottom-0';
      case 'right': return 'right-0 top-0 bottom-0';
      case 'bottom': return 'bottom-0 left-0 right-0';
      default: return 'right-0 top-0 bottom-0';
    }
  };

  const getTransformClass = () => {
    if (!isOpen && !isAnimating) {
      switch (position) {
        case 'left': return '-translate-x-full';
        case 'right': return 'translate-x-full';
        case 'bottom': return 'translate-y-full';
        default: return 'translate-x-full';
      }
    }
    return '';
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${
        position === 'bottom' ? 'h-auto' : ''
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Drawer Content */}
      <div
        className={`absolute ${getPositionClass()} w-full ${getSizeClass()} bg-white dark:bg-slate-900 shadow-xl transition-transform duration-300 ease-in-out ${getTransformClass()} flex flex-col ${
          position === 'bottom' ? 'h-auto max-h-[80vh] rounded-t-2xl' : 'h-full'
        }`}
      >
        {/* Header */}
        {(title || position !== 'bottom') && (
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700 shrink-0">
            {title && (
              <h2 className="text-lg font-semibold">{title}</h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Hook for managing drawer state
export const useDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
};

export default Drawer;
