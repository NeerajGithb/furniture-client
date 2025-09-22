'use client';

import { Category } from '@/types/Product';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import PrevLeft from '../ui/PrevLeft';
import PrevRight from '../ui/PrevRight';

interface CategoryGridProps {
  inspiration: any;
  loading: boolean;
}

const categoryImages: Record<string, string> = {
  'living-room':
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
  bedroom: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
  'dining-room':
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
  office: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop',
  kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop',
  outdoor: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
  'kids-room': 'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
};

const CARD_WIDTH = 'w-[220px] md:w-[220px]';
const CARD_HEIGHT = 'h-[260px] md:h-[260px]';

const CategoryGrid = ({ inspiration, loading }: CategoryGridProps) => {
  const categories: Category[] = (inspiration.categories || []).map((c: any) =>
    typeof c === 'string'
      ? {
          _id: c,
          name: 'Unknown',
          slug: c,
          description: '',
          mainImage: { url: categoryImages['default'], alt: 'Category' },
        }
      : {
          _id: c._id,
          name: c.name,
          slug: c.slug,
          description: '',
          mainImage: {
            url: c.mainImage?.url || categoryImages['default'],
            alt: c.mainImage?.alt || c.name,
          },
        },
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  useEffect(() => {
    updateScrollButtons();
    if (!scrollRef.current) return;
    scrollRef.current.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      if (scrollRef.current) scrollRef.current.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [categories]);

  if (loading) {
    return (
      <section className="px-4 py-8 max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-light text-black tracking-wide">
            Shop by Category
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className={`animate-pulse ${CARD_WIDTH} ${CARD_HEIGHT} bg-gray-100 rounded-sm`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="px-4 py-12 max-w-6xl mx-auto">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-light text-black mb-2 tracking-wide">
          Shop by Category
        </h2>
        <p className="text-gray-500 text-xs tracking-wider uppercase">Find what suits your space</p>
      </motion.div>

      {/* Mobile horizontal scroll with two rows */}
      <div className="block md:hidden relative">
        {canScrollLeft && <PrevLeft onClick={handleScrollLeft} isMobile={true} />}

        {canScrollRight && <PrevRight onClick={handleScrollRight} isMobile={true} />}

        <div className="overflow-x-auto scrollbar-hide" ref={scrollRef}>
          <div
            className="grid grid-rows-2 grid-flow-col gap-3 pb-2"
            style={{ width: 'max-content' }}
          >
            {categories.map((category, idx) => {
              const imageUrl =
                category.mainImage?.url ||
                categoryImages[category.slug] ||
                categoryImages['default'];
              return (
                <motion.div
                  key={category._id}
                  className="w-[160px] h-[200px] flex-shrink-0 sm:w-[180px] sm:h-[230px]"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                >
                  <Link href={`/${category.slug}`}>
                    <div className="group cursor-pointer w-full h-full flex flex-col">
                      <div className="relative w-full h-[140px] sm:h-[170px] overflow-hidden bg-gray-50 rounded-sm">
                        <Image
                          src={imageUrl}
                          alt={category.mainImage?.alt || `${category.name} category`}
                          fill
                          className="object-cover grayscale-[1%] contrast-110 transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, 200px"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 flex items-center justify-center mt-2">
                        <h3 className="text-xs sm:text-sm font-light text-black tracking-wide uppercase group-hover:text-gray-600 transition-colors duration-500 text-center">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center mt-6">
        {categories.map((category, idx) => {
          const imageUrl =
            category.mainImage?.url || categoryImages[category.slug] || categoryImages['default'];
          return (
            <motion.div
              key={category._id}
              className={`${CARD_WIDTH} ${CARD_HEIGHT}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
            >
              <Link href={`/${category.slug}`}>
                <div className="group cursor-pointer w-full h-full flex flex-col">
                  <div className="relative w-full h-[210px] overflow-hidden bg-gray-50 rounded-sm">
                    <Image
                      src={imageUrl}
                      alt={category.mainImage?.alt || `${category.name} category`}
                      fill
                      className="object-cover grayscale-[1%] contrast-110 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 flex items-center justify-center mt-2">
                    <h3 className="text-sm font-light text-black tracking-wide uppercase group-hover:text-gray-600 transition-colors duration-500 text-center">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryGrid;
