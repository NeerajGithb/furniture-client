'use client';

import { useEffect, useState } from 'react';

export default function ConfettiEffect({ duration = 3000 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const pieces = Array.from({ length: 25 });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((_, i) => {
        const left = `${Math.random() * 100}vw`;
        const delay = `${Math.random() * 2}s`;
        const size = `${Math.random() * 8 + 6}px`;
        const color = ['#22c55e', '#3b82f6', '#f43f5e', '#f59e0b', '#9333ea'][
          Math.floor(Math.random() * 5)
        ];

        return (
          <span
            key={i}
            className="absolute top-0 animate-fall"
            style={{
              left,
              width: size,
              height: size,
              backgroundColor: color,
              animationDelay: delay,
              borderRadius: '2px',
              opacity: 0.9,
            }}
          />
        );
      })}
    </div>
  );
}
