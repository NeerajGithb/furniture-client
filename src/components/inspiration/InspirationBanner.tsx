"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface InspirationBannerProps {
  category: Category;
}

const categoryImages: Record<string, string> = {
  "living-room": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=600&fit=crop",
  "bedroom": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=600&fit=crop",
  "dining-room": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop",
  "office": "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=1200&h=600&fit=crop",
  "kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=600&fit=crop",
  "bathroom": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=600&fit=crop",
  "outdoor": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop",
  "kids-room": "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=1200&h=600&fit=crop"
};

const categoryTaglines: Record<string, string> = {
  "living-room": "Create the perfect space for relaxation and entertainment",
  "bedroom": "Design your personal sanctuary for rest and rejuvenation",
  "dining-room": "Craft memorable dining experiences with style and elegance",
  "office": "Build a productive workspace that inspires creativity",
  "kitchen": "The heart of your home deserves thoughtful design",
  "bathroom": "Transform your daily routine into a spa-like experience",
  "outdoor": "Extend your living space to embrace nature",
  "kids-room": "Create magical spaces where imagination comes to life"
};

const InspirationBanner = ({ category }: InspirationBannerProps) => {
  const bannerImage = categoryImages[category.slug] || categoryImages["living-room"];
  const tagline = categoryTaglines[category.slug] || "Discover beautiful design inspiration";

  return (
    <motion.section 
      className="relative h-[70vh] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={bannerImage}
          alt={`${category.name} inspiration`}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-light mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {category.name} Inspiration
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl font-light opacity-90 mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {tagline}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button className="bg-white text-neutral-900 px-8 py-3 font-medium hover:bg-neutral-100 transition">
            Shop All {category.name}
          </button>
          <button className="border border-white text-white px-8 py-3 font-medium hover:bg-white hover:text-neutral-900 transition">
            View Style Guide
          </button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="w-px h-8 bg-white/60 mb-2"></div>
        <div className="text-white text-xs font-light">Scroll to explore</div>
      </motion.div>
    </motion.section>
  );
};

export default InspirationBanner;