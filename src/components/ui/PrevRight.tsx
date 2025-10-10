import React from 'react';

interface PrevRightProps {
  isMobile?: boolean;
  onClick: () => void;
}

const PrevRight = ({ isMobile, onClick }: PrevRightProps) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-full absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10
        bg-white/90 backdrop-blur border border-gray-300 flex items-center justify-center
        hover:bg-white transition-all shadow-lg ${isMobile ? 'touch-manipulation' : ''}`}
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

export default PrevRight;
