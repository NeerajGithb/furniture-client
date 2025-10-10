'use client';

import { useState } from 'react';

export function Avatar({ src = '', alt = '', fallbackText = '?' }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative min-w-8 minh-h-8 h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{fallbackText}</span>
      )}
    </div>
  );
}
