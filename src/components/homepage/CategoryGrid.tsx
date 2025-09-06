"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useProductStore } from "@/stores/productStore";

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

  const showSkeletons =
    loading || (!loading && categories.length === 0 && !error);

  // Limit to 2 rows * 5 cols = 10
  const visibleCategories = categories.slice(0, 10);

  if (error) {
    return (
      <section className="px-4 max-w-7xl mx-auto">
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
    <section className="px-4 max-w-7xl mx-auto">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {showSkeletons
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-md mb-3"></div>
                <div className="h-4 bg-gray-200 mx-auto w-3/4 rounded"></div>
              </div>
            ))
          : visibleCategories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Link
                  onClick={() => resetProductState()}
                  href={`/products?c=${category.slug}`}
                  className="block h-full overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.1"
                >
                  {/* Image */}
                  <div className="relative aspect-square w-full">
                    <Image
                      src={category.mainImage?.url || "/placeholder.png"}
                      alt={category.mainImage?.alt || category.name}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Content */}
                  <div className="py-2 text-center">
                    <h3 className="text-sm md:text-base font-medium text-black tracking-wide transition-colors duration-200 group-hover:text-gray-700">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
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
