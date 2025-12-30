import React, { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmojiPicker from 'emoji-picker-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  position?: 'top' | 'bottom';
}

const EmojiPickerComponent: React.FC<EmojiPickerProps> = ({ onEmojiSelect, position = 'bottom' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emojiObject: any) => {
    onEmojiSelect(emojiObject.emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 h-auto rounded-lg transition-colors
          ${isOpen ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100 text-gray-500'}
        `}
        title="Add emoji"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          className={`
            absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          `}
          style={{ left: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <span className="text-sm font-medium text-gray-700">Emoji</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Emoji Picker Library */}
          <div className="p-2">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={300}
              height={400}
              theme="light"
              skinTonesDisabled
              searchDisabled={false}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerComponent;
