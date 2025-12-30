import React, { useState, useRef, useEffect } from 'react';
import { Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Common emojis for quick access
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
  '👍', '👎', '👌', '✌️', '🤝', '👏', '🙌', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔',
  '💯', '🎉', '🎊', '✨', '⭐', '🌟', '💫', '🔥',
  '👀', '🙌', '🙏', '💼', '📢', '📣', '🔔', '⚠️'
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  position?: 'top' | 'bottom';
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, position = 'bottom' }) => {
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

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 h-auto hover:bg-gray-100 rounded-lg"
        title="Add emoji"
      >
        <Smile className="h-5 w-5 text-gray-500" />
      </Button>

      {isOpen && (
        <div
          className={`
            absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            w-72 h-64 overflow-hidden
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Emoji</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Emoji Grid */}
          <div className="p-2 overflow-y-auto h-[calc(100%-40px)]">
            <div className="grid grid-cols-8 gap-0.5">
              {commonEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="flex items-center justify-center w-8 h-8 text-xl hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
