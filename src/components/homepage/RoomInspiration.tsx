'use client';

import { useHomeStore } from '@/stores/homeStore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const RoomInspiration = () => {
  const { inspirations, loading, fetchInspirations } = useHomeStore();

  useEffect(() => {
    fetchInspirations();
  }, [fetchInspirations]);

  if (loading) {
    return (
      <section className="min-h-screen bg-white">
        <div className="px-6 py-12">
          <div className="text-center mb-16">
            <div className="h-8 bg-neutral-100 rounded w-48 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-neutral-100 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 gap-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-neutral-100 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-neutral-100 rounded w-3/4"></div>
                  <div className="h-4 bg-neutral-100 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (inspirations.length === 0) {
    return (
      <section className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <h2 className="text-4xl font-light text-black mb-4 tracking-tight">Room Inspiration</h2>
          <p className="text-neutral-500 text-lg">No inspirations available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-white">
      {/* Header */}
      <motion.div
        className="text-center px-6 pb-3 md:pb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-xl md:text-2xl font-light text-black mb-6 tracking-tight leading-none">
          SHOP BY ROOM
        </h1>
        <div className="w-16 h-px bg-black mx-auto mb-6"></div>
        <p className="text-neutral-600 text-xs md:text-sm font-light max-w-md mx-auto leading-relaxed">
          Discover curated room inspirations to transform your space with style and functionality.
        </p>
      </motion.div>

      {/* Inspiration Grid */}
      <div className="md:px-4">
        <div className="max-w-[450px] mx-auto md:max-w-7xl md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
          {inspirations.slice(0, 8).map((inspiration, idx) => (
            <motion.div
              key={inspiration._id}
              className="group  mb-8 last:mb-8"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
                ease: 'easeOut',
              }}
            >
              <Link href={`/inspiration/${inspiration.slug}`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-50 group cursor-pointer">
                  <Image
                    src={inspiration.heroImage.url}
                    alt={inspiration.heroImage.alt}
                    fill
                    className="object-cover transition-all duration-700 ease-out group-hover:scale-102 grayscale-0 group-hover:grayscale"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    priority={idx < 4}
                  />

                  {/* Overlay */}
                  <div className="absolute md:hidden inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-all duration-500"></div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    {/* Title */}
                    <motion.h3
                      className="text-white md:hidden text-2xl md:text-xl font-light mb-4 tracking-wide leading-tight drop-shadow-lg"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                    >
                      {inspiration.title.replace(/inspiration/i, '').trim()}
                    </motion.h3>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                      <motion.button
                        className="bg-white text-black px-4 py-2 text-sm font-medium tracking-wide uppercase hover:bg-black hover:text-white transition-all duration-300 border border-white"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Shop Now
                      </motion.button>
                    </div>
                  </div>

                  {/* Corner Detail */}
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/60 group-hover:border-white transition-colors duration-300"></div>
                </div>
                <div className="mt-4 text-center hidden md:block">
                  <h3 className="text-lg font-medium text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors">
                    {inspiration.title.replace(/inspiration/i, '').trim()}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {inspiration.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        className="text-center py-5 md:py-10 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <Link href="/inspiration">
          <motion.button
            className="bg-black text-white px-8 py-2 text-sm font-medium tracking-widest uppercase hover:bg-white hover:text-black border-2 border-black transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Browse All Rooms
          </motion.button>
        </Link>
      </motion.div>
    </section>
  );
};

export default RoomInspiration;
