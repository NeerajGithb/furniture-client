'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const isSwipingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const router = useRouter();
  const slides = [
    {
      id: 1,
      image: '/homepage/baner/living.png',
      category: 'living-room',
    },
    {
      id: 2,
      image: '/homepage/baner/bedroom.png',
      category: 'bedroom-inspiration',
    },
    {
      id: 3,
      image: '/homepage/baner/dining.png',
      category: 'dining-inspiration',
    },
    {
      id: 4,
      image: '/homepage/baner/sofa.png',
      category: 'office-inspiration',
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      nextSlide();
    }, 4000);
  }, [nextSlide]);

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoSlide();
    return stopAutoSlide;
  }, [startAutoSlide, stopAutoSlide]);

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      stopAutoSlide();
      isSwipingRef.current = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startPosRef.current = { x: clientX, y: clientY };
    },
    [stopAutoSlide],
  );

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!startPosRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = Math.abs(clientX - startPosRef.current.x);
    const deltaY = Math.abs(clientY - startPosRef.current.y);

    if (deltaX > 10 && deltaY < 50) {
      isSwipingRef.current = true;
      e.preventDefault();
    }
  }, []);

  const handleEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isSwipingRef.current) {
        const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const distance = startPosRef.current!.x - clientX;
        if (distance > 50) {
          nextSlide();
        } else if (distance < -50) {
          prevSlide();
        }
      }
      startAutoSlide();
      startPosRef.current = null;
    },
    [nextSlide, prevSlide, startAutoSlide],
  );

  const handleImageClick = useCallback(
    (category: string) => {
      if (!isSwipingRef.current) {
        const friendlyCategory = category.replace('-inspiration', '-collection');

        router.push(`/collections/${friendlyCategory}`);
      }

      isSwipingRef.current = false;
    },
    [router],
  );

  return (
    <section className="relative h-[30vh] sm:h-[45vh] min-h-[300px] overflow-hidden shadow-bottom">
      <div
        className="relative h-full w-full"
        onMouseEnter={stopAutoSlide}
        onMouseLeave={startAutoSlide}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out cursor-pointer ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            onClick={() => handleImageClick(slide.category)}
          >
            <div className="w-full h-full block">
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={stopAutoSlide}
        onMouseLeave={startAutoSlide}
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-2.5 hover:bg-white/30 focus:outline-none transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
      </button>

      <button
        onClick={nextSlide}
        onMouseEnter={stopAutoSlide}
        onMouseLeave={startAutoSlide}
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-2.5 hover:bg-white/30 focus:outline-none transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 sm:space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            onMouseEnter={stopAutoSlide}
            onMouseLeave={startAutoSlide}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full focus:outline-none transition-colors ${
              index === currentSlide ? 'bg-white shadow-sm' : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
