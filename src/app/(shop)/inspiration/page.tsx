'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { useHomeStore } from '@/stores/homeStore';
import Loading from '@/components/ui/Loader';

const InspirationPage = () => {
  const { inspirations, loading, fetchInspirations } = useHomeStore();

  useEffect(() => {
    fetchInspirations();
  }, [fetchInspirations]);

  if (loading && inspirations.length === 0) {
    return <Loading fullScreen title="Loading Inspirations" size="lg" variant="elegant" />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.section
        className="relative py-10 bg-gradient-to-b from-gray-50 to-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Room Inspirations
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover curated room collections that transform spaces into stories. Each inspiration
            showcases complete looks you can shop instantly.
          </motion.p>
        </div>
      </motion.section>

      {/* Inspirations Grid */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {inspirations.length === 0 && !loading ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspirations Available</h3>
              <p className="text-gray-600">Check back soon for new room inspirations.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
              {inspirations.map((inspiration, idx) => (
                <Link key={inspiration._id} href={`/inspiration/${inspiration.slug}`}>
                  <motion.div
                    className="group cursor-pointer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xs bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                      <Image
                        src={inspiration.heroImage.url}
                        alt={inspiration.heroImage.alt || inspiration.title}
                        fill
                        className="object-cover transition duration-500 ease-out group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={idx < 6}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-70 transition-opacity duration-300" />

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
                        <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {inspiration.categories?.slice(0, 2).map((category, categoryIdx) => (
                              <span
                                key={`${inspiration._id}-category-${categoryIdx}`}
                                className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-xs text-xs font-medium text-white border border-white/20"
                              >
                                {typeof category === 'object' &&
                                category !== null &&
                                'name' in category
                                  ? (category as any).name
                                  : String(category)}
                              </span>
                            ))}
                          </div>

                          <h3 className="text-lg sm:text-xl font-medium text-white mb-1 leading-tight">
                            {inspiration.title}
                          </h3>

                          <p className="text-white/85 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 line-clamp-2">
                            {inspiration.description}
                          </p>

                          {/* Tags */}
                          {inspiration.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                              {inspiration.tags.slice(0, 3).map((tag, tagIdx) => (
                                <span
                                  key={`${inspiration._id}-tag-${tagIdx}`}
                                  className="px-1.5 py-0.5 bg-white/10 rounded-xs text-xs text-white/70"
                                >
                                  #
                                  {typeof tag === 'object' && tag !== null && 'name' in tag
                                    ? (tag as any).name
                                    : String(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute top-3 right-3 w-8 h-8 bg-white/15 backdrop-blur-sm rounded-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <motion.section
        className="py-12 sm:py-14 bg-gray-900"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-white mb-4">
              Can't Find Your Perfect Style?
            </h2>
            <p className="text-base text-gray-300 mb-6 leading-relaxed">
              Explore our complete furniture collection to create your own unique inspiration.
            </p>
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors duration-200 rounded-xs shadow-md hover:shadow-lg"
              >
                Browse All Products
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default InspirationPage;
