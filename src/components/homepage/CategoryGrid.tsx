'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useProductStore } from '@/stores/productStore';
const selectResetProductState = (state: any) => state.resetProductState;

const CategoryGrid = () => {
  const resetProductState = useProductStore(selectResetProductState);
  const storeSelectors = {
    categories: (state: { categories: any[] }) => state.categories,
    loading: (state: { loading: boolean }) => state.loading,
    error: (state: { error: string | null }) => state.error,
  };

  const categories = useProductStore(storeSelectors.categories);
  const loading = useProductStore(storeSelectors.loading);
  const error = useProductStore(storeSelectors.error);

  const showSkeletons = loading || (!loading && categories.length === 0 && !error);

  if (error) {
    return (
      <section className="px-4  mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-light text-black mb-2 tracking-wide">
            Shop by Category
          </h2>
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4  mx-auto">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl md:text-3xl font-light text-black mb-2 tracking-wide">
          Shop by Category
        </h2>
        <p className="text-gray-500 text-sm">
          Curated collections for every space
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {showSkeletons
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-sm mb-3"></div>
                <div className="h-4 bg-gray-200 mx-auto w-full"></div>
              </div>
            ))
          : categories.map((category, index) => (
              <motion.div
                key={category._id}
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Link
                  onClick={() => resetProductState()}
                  href={`/products?category=${category.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100 shadow-sm">
                    <Image
                      src={category.mainImage?.url || '/placeholder.png'}
                      alt={category.mainImage?.alt || category.name}
                      fill
                      className="object-cover transition-all duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="py-3 text-center">
                    <h3 className="text-sm md:text-base font-medium text-black group-hover:text-gray-700 transition-colors tracking-wide">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {category.description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
};

export default memo(CategoryGrid);
