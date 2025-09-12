"use client";
import { memo, useRef } from "react";
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

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
    }
  };

  if (error) {
    return (
      <section className="px-4 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-light text-black mb-2 tracking-wide">
            POPULAR CATEGORIES
          </h2>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-xl md:text-2xl font-light text-black mb-2 tracking-wide">
          POPULAR CATEGORIES
        </h2>
        <p className="text-gray-500 text-xs md:text-sm">
          Explore our most popular categories
        </p>
      </motion.div>

      {/* Mobile: Horizontal scroll + Scroll button */}
      <div className="block md:hidden">
        <div className="relative">
          <div
            className="overflow-x-auto scrollbar-hide"
            ref={scrollRef}
          >
            <div
              className="grid grid-rows-2 grid-flow-col gap-4 pb-2"
              style={{ width: "max-content" }}
            >
              {showSkeletons
                ? Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex-shrink-0">
                      <div className="w-28 h-28 bg-gray-200 mb-2"></div>
                      <div className="h-3 bg-gray-200 w-20 mx-auto"></div>
                    </div>
                  ))
                : categories.slice(0, 12).map((category, index) => (
                    <motion.div
                      key={category._id}
                      className="flex-shrink-0"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.03 }}
                    >
                      <Link
                        onClick={() => resetProductState()}
                        href={`/products?c=${category.slug}`}
                        className="block text-center group"
                      >
                        <div className="relative w-30 h-30 mb-2 overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                          <Image
                            src={category.mainImage?.url || "/placeholder.png"}
                            alt={category.mainImage?.alt || category.name}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="text-xs font-medium text-black w-28 truncate">
                          {category.name}
                        </h3>
                      </Link>
                    </motion.div>
                  ))}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={handleScrollRight}
            className="absolute top-10 -right-3"
          >
            <svg
              className="w-4 h-4 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {showSkeletons
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 mb-3"></div>
                <div className="h-4 bg-gray-200 mx-auto w-3/4"></div>
              </div>
            ))
          : categories.slice(0, 10).map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Link
                  onClick={() => resetProductState()}
                  href={`/products?c=${category.slug}`}
                  className="block h-full group"
                >
                  <div className="relative aspect-square w-full overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                    <Image
                      src={category.mainImage?.url || "/placeholder.png"}
                      alt={category.mainImage?.alt || category.name}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="py-3 text-center">
                    <h3 className="text-sm lg:text-base font-medium text-black tracking-wide transition-colors duration-200 group-hover:text-gray-700">
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
