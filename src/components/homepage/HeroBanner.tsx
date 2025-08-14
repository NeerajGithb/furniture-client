'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroBanner = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

    const slides = [
        {
            id: 1,
            image:
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop',
            title: 'Minimal. Modern. Timeless.',
            subtitle: 'Discover furniture that speaks to your refined taste',
            cta: 'Explore Living Room',
        },
        {
            id: 2,
            image:
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=800&fit=crop',
            title: 'Luxury Redefined.',
            subtitle: 'Premium sofas crafted for ultimate comfort',
            cta: 'Shop Sofas',
        },
        {
            id: 3,
            image:
                'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200&h=800&fit=crop',
            title: 'Elegant Dining.',
            subtitle: 'Transform your dining experience with our curated collection',
            cta: 'View Dining Sets',
        },
        {
            id: 4,
            image:
                'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=1200&h=800&fit=crop',
            title: 'Workspace Excellence.',
            subtitle: 'Premium office furniture for the modern professional',
            cta: 'Office Collection',
        },
        {
            id: 5,
            image:
                'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&h=800&fit=crop',
            title: 'Bedroom Sanctuary.',
            subtitle: 'Create your perfect retreat with our luxury bedroom furniture',
            cta: 'Bedroom Sets',
        },
    ];

    const startAutoSlide = () => {
        if (autoSlideRef.current) {
            clearInterval(autoSlideRef.current);
        }
        autoSlideRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 4000);
    };

    const stopAutoSlide = () => {
        if (autoSlideRef.current) {
            clearInterval(autoSlideRef.current);
            autoSlideRef.current = null;
        }
    };

    useEffect(() => {
        startAutoSlide();
        return () => stopAutoSlide();
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        stopAutoSlide();
        setTimeout(startAutoSlide, 5000);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        stopAutoSlide();
        setTimeout(startAutoSlide, 5000);
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        stopAutoSlide();
        setTimeout(startAutoSlide, 5000);
    };

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) nextSlide();
        if (isRightSwipe) prevSlide();
    };

    return (
        <section className="relative h-[50vh] sm:h-[55vh] min-h-[350px] sm:min-h-[400px] overflow-hidden">
            <div
                className="relative h-full"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-all duration-700 ease-out ${index === currentSlide
                            ? 'opacity-100 translate-x-0'
                            : 'opacity-0 translate-x-full'
                            }`}
                    >
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover select-none"
                            draggable={false}
                        />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>
                ))}
            </div>

            <button
                onClick={prevSlide}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full  p-2 transition-all hover:bg-white/30 active:scale-95"
            >
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
            </button>

            <button
                onClick={nextSlide}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm rounded-full  p-2 transition-all hover:bg-white/30 active:scale-95"
            >
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
            </button>

            <div className="absolute inset-0 z-10 flex items-center">
                <div className="w-full max-w-xl px-4 sm:px-8">
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light mb-3 sm:mb-6 text-white leading-tight">
                        {slides[currentSlide].title}
                    </h1>
                    <p className="text-gray-200 mb-4 sm:mb-8 text-sm sm:text-lg leading-relaxed">
                        {slides[currentSlide].subtitle}
                    </p>
                    <button className="bg-white text-black px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors active:scale-95">
                        {slides[currentSlide].cta}
                    </button>
                </div>
            </div>

            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5 sm:space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white' : 'bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroBanner;
