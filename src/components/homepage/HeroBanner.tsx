"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useProductStore } from "@/stores/productStore";

const selectResetProductState = (state: any) => state.resetProductState;

const HeroBanner = () => {
  const resetProductState = useProductStore(selectResetProductState);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop",
      title: "Minimal. Modern. Timeless.",
      subtitle: "Discover furniture that speaks to your refined taste",
      cta: "Explore Living Room",
      category: "living-room",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop",
      title: "Luxury Redefined.",
      subtitle: "Premium sofas crafted for ultimate comfort",
      cta: "Shop Dining Room",
      category: "dining-room",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200&h=800&fit=crop",
      title: "Elegant Dining.",
      subtitle: "Transform your dining experience with our curated collection",
      cta: "View Office",
      category: "office",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=1200&h=800&fit=crop",
      title: "Workspace Excellence.",
      subtitle: "Premium office furniture for the modern professional",
      cta: "Bedroom Collection",
      category: "bedroom",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&h=800&fit=crop",
      title: "Bedroom Sanctuary.",
      subtitle: "Create your perfect retreat with our luxury bedroom furniture",
      cta: "Outdoor Furniture",
      category: "outdoor",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&h=800&fit=crop",
      title: "Fresh Arrivals.",
      subtitle: "Explore the latest trends in modern furniture",
      cta: "Shop New",
      category: "new",
    },
  ];

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (!isHovered && !isTransitioning) {
      autoSlideRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 4000);
    }
  }, [isHovered, isTransitioning, slides.length]);

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  }, []);

  const handleTransition = useCallback(() => {
    setIsTransitioning(true);
    stopAutoSlide();
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 700);
  }, [stopAutoSlide]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      stopAutoSlide();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [startAutoSlide, stopAutoSlide]);

  useEffect(() => {
    if (!isHovered && !isTransitioning) {
      const timer = setTimeout(startAutoSlide, 100);
      return () => clearTimeout(timer);
    } else {
      stopAutoSlide();
    }
  }, [isHovered, isTransitioning, startAutoSlide, stopAutoSlide]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    handleTransition();
  }, [slides.length, handleTransition]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    handleTransition();
  }, [slides.length, handleTransition]);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    handleTransition();
  }, [handleTransition]);

  // Touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minSwipeDistance = 50;
  const maxVerticalDistance = 100;

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setIsDragging(false);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    
    const deltaX = Math.abs(currentTouch.x - touchStart.x);
    const deltaY = Math.abs(currentTouch.y - touchStart.y);
    
    if (deltaX > 10 && deltaY < maxVerticalDistance) {
      setIsDragging(true);
      e.preventDefault();
    }
    
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !isDragging) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);
    
    if (distanceY < maxVerticalDistance) {
      if (distanceX > minSwipeDistance) nextSlide();
      if (distanceX < -minSwipeDistance) prevSlide();
    }
    
    setIsDragging(false);
  };

  // Mouse/Pointer handling for better desktop experience
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [pointerStart, setPointerStart] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    
    setIsPointerDown(true);
    setPointerStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown || !pointerStart || e.pointerType === 'touch') return;
    
    const deltaX = Math.abs(e.clientX - pointerStart.x);
    const deltaY = Math.abs(e.clientY - pointerStart.y);
    
    if (deltaX > 10 && deltaY < maxVerticalDistance) {
      e.preventDefault();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown || !pointerStart || e.pointerType === 'touch') return;
    
    const distanceX = pointerStart.x - e.clientX;
    const distanceY = Math.abs(pointerStart.y - e.clientY);
    
    if (distanceY < maxVerticalDistance && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) nextSlide();
      if (distanceX < 0) prevSlide();
    }
    
    setIsPointerDown(false);
    setPointerStart(null);
  };

  const handleCTAClick = () => {
    stopAutoSlide();
    setIsTransitioning(true);
    resetProductState();
  };

  return (
    <section className="relative h-[50vh] sm:h-[55vh] min-h-[350px] sm:min-h-[400px] overflow-hidden select-none">
      <div
        className="relative h-full cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}

      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full p-2 transition-all hover:bg-white/30 active:scale-95 touch-manipulation"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
      </button>
      
      <button
        onClick={nextSlide}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full p-2 transition-all hover:bg-white/30 active:scale-95 touch-manipulation"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
      </button>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex items-center pointer-events-none">
        <div className="w-full max-w-xl px-4 sm:px-8 pointer-events-auto">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-6 text-white leading-tight">
            {slides[currentSlide].title}
          </h1>
          <p className="text-gray-200 mb-4 sm:mb-8 text-sm sm:text-lg leading-relaxed">
            {slides[currentSlide].subtitle}
          </p>
          <Link
            href={`/collections/${slides[currentSlide].category}?c=${slides[currentSlide].category}`}
            onClick={handleCTAClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="inline-block bg-white text-black px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-all active:scale-95 touch-manipulation"
          >
            {slides[currentSlide].cta}
          </Link>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 sm:space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all touch-manipulation ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;