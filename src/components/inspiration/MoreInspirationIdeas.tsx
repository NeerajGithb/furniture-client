'use client';

import { useHomeStore } from '@/stores/homeStore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

const MoreInspirationIdeas = ({ currentInspirationId }: { currentInspirationId: string }) => {
  const { inspirations, loading, fetchInspirations } = useHomeStore();

  useEffect(() => {
    fetchInspirations();
  }, [fetchInspirations]);

  const filteredInspirations = inspirations.filter((insp) => insp._id !== currentInspirationId);

  if (loading) {
    return (
      <section className="px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-2">
            More Inspiration Ideas
          </h2>
          <p className="text-neutral-600 text-sm">Discover other styles you might like</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-neutral-200 rounded"></div>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mx-auto"></div>
                <div className="h-3 bg-neutral-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (filteredInspirations.length === 0) {
    return null;
  }

  return (
    <section className="px-4 max-w-7xl mx-auto pb-10">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-2">
          More Inspiration Ideas
        </h2>
        <p className="text-neutral-600 text-sm">Discover other styles you might like</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredInspirations.slice(0, 8).map((inspiration, idx) => (
          <motion.div
            key={inspiration._id}
            className="group cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.1 }}
          >
            <Link href={`/inspiration/${inspiration.slug}`}>
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                <Image
                  src={inspiration.heroImage?.url || '/placeholder.jpg'}
                  alt={inspiration.heroImage?.alt || inspiration.title}
                  fill
                  className="object-cover transition duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  priority={idx === 0}
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition duration-300 flex items-center justify-center">
                  <motion.button
                    className="opacity-0 group-hover:opacity-100 bg-white text-black px-5 py-2 text-sm font-medium shadow-md"
                    initial={{ scale: 0.9 }}
                    whileHover={{ scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore This Look
                  </motion.button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-neutral-900">{inspiration.title}</h3>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {inspiration.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default MoreInspirationIdeas;
