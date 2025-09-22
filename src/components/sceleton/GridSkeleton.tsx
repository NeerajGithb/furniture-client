import React, { memo } from 'react';

const SkeletonCard = memo(() => (
  <div
    className="bg-white border border-gray-200 overflow-hidden shadow-sm w-full mx-auto p-[6px]"
    style={{
      aspectRatio: '3/4',
      minWidth: '200px',
      maxWidth: '370px',
      width: '100%',
      height: 'auto',
    }}
  >
    {/* Image shimmer */}
    <div
      className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden"
      style={{ height: '65%' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer transform -skew-x-12"></div>
    </div>

    {/* Content shimmer */}
    <div className="p-2 sm:p-3 lg:p-4 h-[35%] flex flex-col justify-between">
      <div className="space-y-1 sm:space-y-2">
        <div className="h-3 sm:h-3.5 bg-gray-300 w-full animate-pulse rounded"></div>
        <div className="h-3 sm:h-3.5 bg-gray-300 w-3/4 animate-pulse rounded"></div>
        <div className="h-2.5 sm:h-3 bg-gray-200 w-1/2 animate-pulse rounded"></div>
      </div>
      <div className="h-4 sm:h-5 bg-gray-300 w-2/3 animate-pulse rounded"></div>
    </div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

const GridSkeleton = () => (
  <div className="px-1 sm:px-2 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-1 sm:gap-4 lg:gap-5">
    {Array.from({ length: 12 }).map((_, i) => (
      <SkeletonCard key={`skeleton-${i}`} />
    ))}
  </div>
);

export default GridSkeleton;
