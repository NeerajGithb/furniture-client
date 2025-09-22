'use client';
import { memo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useProductStore } from '@/stores/productStore';
import PrevRight from '../ui/PrevRight';
import PrevLeft from '../ui/PrevLeft';

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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollButtons();
    const onScroll = () => updateScrollButtons();
    container.addEventListener('scroll', onScroll);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  if (error) {
    return (
      <section className="px-4 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-2 tracking-wide">
            Popular Categories
          </h2>
          <p className="text-red-400 text-sm font-medium">{error}</p>
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
        <h2 className="text-2xl font-light text-gray-900 mb-3 tracking-wide">POPULAR CATEGORIES</h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm md:text-base font-light">
          Discover our curated collections
        </p>
      </motion.div>

      {/* Mobile: Horizontal scroll */}
      <div className="block md:hidden relative">
        <div className="overflow-x-auto scrollbar-hide" ref={scrollRef}>
          <div
            className="grid grid-rows-2 grid-flow-col gap-4 pb-4"
            style={{ width: 'max-content' }}
          >
            {showSkeletons
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex-shrink-0">
                    <div className="w-28 h-28 bg-gray-100"></div>
                    <div className="h-2.5 bg-gray-200 w-20 mx-auto mt-3 rounded-full"></div>
                  </div>
                ))
              : categories.slice(0, 12).map((category, index) => (
                  <motion.div
                    key={category._id}
                    className="flex-shrink-0 group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.03 }}
                  >
                    <Link
                      onClick={() => resetProductState()}
                      href={`/${category.slug}`}
                      className="block text-center"
                    >
                      <div className="relative w-28 h-28 mb-3 overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
                        <Image
                          src={category.mainImage?.url || '/placeholder.png'}
                          alt={category.mainImage?.alt || category.name}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="120px"
                        />
                      </div>
                      <h3 className="text-xs font-medium text-gray-800 w-28 truncate group-hover:text-gray-900 transition-colors">
                        {category.name}
                      </h3>
                    </Link>
                  </motion.div>
                ))}
          </div>
        </div>

        {canScrollLeft && <PrevLeft onClick={handleScrollLeft} isMobile={true} />}
        {canScrollRight && <PrevRight onClick={handleScrollRight} isMobile={true} />}
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 lg:gap-8">
        {showSkeletons
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100"></div>
                <div className="h-3 bg-gray-200 w-3/4 mx-auto mt-4 rounded-full"></div>
                <div className="h-2 bg-gray-100 w-1/2 mx-auto mt-2 rounded-full"></div>
              </div>
            ))
          : categories.slice(0, 12).map((category, index) => (
              <motion.div
                key={category._id}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link
                  onClick={() => resetProductState()}
                  href={`/${category.slug}`}
                  className="block text-center"
                >
                  <div className="relative shadow-all aspect-square w-full overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
                    <Image
                      src={category.mainImage?.url || '/placeholder.png'}
                      alt={category.mainImage?.alt || category.name}
                      fill
                      className="object-cover hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                      sizes="(max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 15vw"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm md:text-base font-medium text-gray-800 truncate group-hover:text-gray-900 transition-colors duration-200">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
};

export default memo(CategoryGrid);
