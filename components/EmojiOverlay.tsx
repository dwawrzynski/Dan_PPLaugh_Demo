
import React from 'react';

export const EmojiOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <span className="text-8xl emoji-pop">😂</span>
    </div>
  );
};
