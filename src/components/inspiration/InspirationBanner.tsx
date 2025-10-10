'use client';

import { IInspiration } from '@/types/Product';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface InspirationBannerProps {
  inspiration: IInspiration;
}

const fallbackImages: Record<string, string> = {
  'living-room':
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=900&fit=crop&auto=format&sharp=80',
  bedroom:
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&h=900&fit=crop&auto=format&sharp=80',
  'dining-room':
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&auto=format&sharp=80',
  office:
    'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=1600&h=900&fit=crop&auto=format&sharp=80',
  kitchen:
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&h=900&fit=crop&auto=format&sharp=80',
  bathroom:
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&h=900&fit=crop&auto=format&sharp=80',
  outdoor:
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=900&fit=crop&auto=format&sharp=80',
  'kids-room':
    'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=1600&h=900&fit=crop&auto=format&sharp=80',
  default:
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&h=900&fit=crop&auto=format&sharp=80',
};

const InspirationBanner = ({ inspiration }: InspirationBannerProps) => {
  const getBannerImage = () => {
    if (inspiration.heroImage?.url) return inspiration.heroImage.url;
    const categorySlug = inspiration.slug.toLowerCase();
    return fallbackImages[categorySlug] || fallbackImages.default;
  };

  const bannerImage = getBannerImage();
  const imageAlt = inspiration.heroImage?.alt || `${inspiration.title} inspiration`;

  return (
    <motion.section
      className="relative max-h-[40vh] h-[40vh] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={bannerImage}
          alt={imageAlt}
          fill
          className="object-cover object-center contrast-110 brightness-95"
          priority
          sizes="100vw"
        />
        {/* Softer overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 max-w-3xl mx-auto drop-shadow-md">
        <motion.h1
          className="text-xl md:text-3xl font-light mb-2 tracking-[0.15em] uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {inspiration.title}
        </motion.h1>

        {inspiration.description && (
          <motion.p
            className="text-sm md:text-base font-light opacity-90 mb-6 leading-relaxed max-w-2xl mx-auto line-clamp-2 tracking-wide"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {inspiration.description}
          </motion.p>
        )}

        <motion.div
          className="flex gap-3 justify-center items-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button className="bg-white text-black px-5 py-2 text-xs font-medium tracking-wider uppercase hover:bg-gray-100 transition-all duration-500 border border-white rounded-sm">
            Shop Now
          </button>
          <button className="border border-white text-white px-5 py-2 text-xs font-medium tracking-wider uppercase hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-sm rounded-sm">
            Explore
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default InspirationBanner;
