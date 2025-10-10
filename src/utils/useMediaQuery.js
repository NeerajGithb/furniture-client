import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;

    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      visibility: hidden;
      width: 1px;
      height: 1px;
    `;

    const mediaQueryCSS = query
      .replace(/[()]/g, '')
      .replace('max-width:', '')
      .replace('min-width:', '')
      .trim();
    const maxWidth = mediaQueryCSS.includes('max-width')
      ? mediaQueryCSS.split('max-width:')[1].trim()
      : null;
    const minWidth = mediaQueryCSS.includes('min-width')
      ? mediaQueryCSS.split('min-width:')[1].trim()
      : null;

    if (maxWidth) {
      testElement.style.maxWidth = maxWidth;
      testElement.style.width = '100vw';
    }
    if (minWidth) {
      testElement.style.minWidth = minWidth;
      testElement.style.width = '100vw';
    }

    document.body.appendChild(testElement);
    const initialMatch = maxWidth
      ? window.innerWidth <= parseInt(maxWidth)
      : minWidth
      ? window.innerWidth >= parseInt(minWidth)
      : false;
    document.body.removeChild(testElement);

    return initialMatch;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId;
    const checkMatch = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;

        if (query.includes('max-width')) {
          const maxWidth = parseInt(query.match(/(\d+)/)[0]);
          setMatches(width <= maxWidth);
        } else if (query.includes('min-width')) {
          const minWidth = parseInt(query.match(/(\d+)/)[0]);
          setMatches(width >= minWidth);
        }
      }, 16);
    };

    checkMatch();

    window.addEventListener('resize', checkMatch, { passive: true });
    window.addEventListener('orientationchange', checkMatch, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkMatch);
      window.removeEventListener('orientationchange', checkMatch);
    };
  }, [query]);

  return matches;
}
