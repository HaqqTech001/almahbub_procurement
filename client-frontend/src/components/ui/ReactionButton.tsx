import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReactionButtonProps {
  count: number;
  isActive: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  count,
  isActive,
  onToggle,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <button
      onClick={onToggle}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full transition-all
        ${isActive
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      <Heart
        className={`
          ${iconSizes[size]}
          ${isActive ? 'fill-current' : ''}
        `}
      />
      {count > 0 && (
        <span className={`font-medium ${sizeClasses[size]}`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default ReactionButton;
