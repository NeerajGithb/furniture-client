'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import CategoryGrid from '@/components/inspiration/CategoryGrid';
import { useHomeStore } from '@/stores/homeStore';

const InspirationPage = () => {
  const { inspirations, loading, fetchInspirations } = useHomeStore();

  useEffect(() => {
    fetchInspirations();
  }, [fetchInspirations]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.section
        className="relative h-[50vh] sm:h-[60vh] lg:h-[65vh] flex items-center justify-center bg-gradient-to-r from-neutral-50 to-neutral-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center px-4 sm:px-6 lg:px-8">
          <motion.h1
            className="text-2xl sm:text-4xl lg:text-6xl font-light text-neutral-900 mb-3 sm:mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Room Inspiration
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base lg:text-lg text-neutral-600 max-w-sm sm:max-w-xl lg:max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover carefully curated room designs and shop the complete looks that inspire your
            perfect space
          </motion.p>
        </div>
      </motion.section>

      {/* Inspiration Categories Grid */}
      <div className="px-4 sm:px-6 lg:px-8">
        <CategoryGrid inspiration={{ categories: inspirations as any }} loading={loading} />
      </div>

      {/* Featured Room Styles */}
      <section className="bg-neutral-50 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-neutral-900 mb-3 sm:mb-4">
              Featured Styles
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
              Popular design aesthetics to inspire your next project
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                style: 'Scandinavian',
                image:
                  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
                description: 'Clean lines, natural materials, and minimalist beauty',
              },
              {
                style: 'Industrial',
                image:
                  'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop',
                description: 'Raw materials and urban-inspired design elements',
              },
              {
                style: 'Bohemian',
                image:
                  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop',
                description: 'Eclectic patterns and globally-inspired textures',
              },
            ].map((style, idx) => (
              <Link key={style.style} href={`/products?style=${style.style.toLowerCase()}`}>
                <motion.div
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.2 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <Image
                      src={style.image}
                      alt={`${style.style} design inspiration`}
                      fill
                      className="object-cover transition duration-500 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={idx === 0}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
                      <h3 className="text-lg sm:text-xl font-medium mb-1 sm:mb-2">{style.style}</h3>
                      <p className="text-xs sm:text-sm opacity-90 leading-snug">
                        {style.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="text-lg sm:text-xl font-medium text-neutral-900 mb-3 sm:mb-4">
              Ready to Transform Your Space?
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8 leading-relaxed">
              Browse our complete collection of furniture and decor to bring these inspiring looks
              to life in your own home.
            </p>

            {/* 🔗 Fixed: Shop button links to /products */}
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-neutral-900 text-white text-sm sm:text-base font-medium hover:bg-neutral-800 transition-colors duration-200 rounded-sm shadow-sm hover:shadow-md"
              >
                Shop All Products
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default InspirationPage;
