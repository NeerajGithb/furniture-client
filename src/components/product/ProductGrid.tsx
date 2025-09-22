'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { Product } from '@/types/Product';
import { usePathname } from 'next/navigation';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  loadingMore?: boolean;
}

const ProductCardWrapper = memo(({ product }: { product: Product }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 5, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.25 }}
    className="w-full"
  >
    <ProductCard product={product} />
  </motion.div>
));
ProductCardWrapper.displayName = 'ProductCardWrapper';

const SkeletonCard = memo(() => (
  <div
    className="bg-white border border-gray-200 overflow-hidden shadow-sm w-full mx-auto p-[6px]"
    style={{
      aspectRatio: '3/4',
      minWidth: '200px',
      maxWidth: '370px',
      width: '100%',
      height: 'auto',
    }}
  >
    {/* Image shimmer */}
    <div
      className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden"
      style={{ height: '65%' }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer transform -skew-x-12"></div>
    </div>

    {/* Content shimmer */}
    <div className="p-2 sm:p-3 lg:p-4 h-[35%] flex flex-col justify-between">
      <div className="space-y-1 sm:space-y-2">
        <div className="h-3 sm:h-3.5 bg-gray-300 w-full animate-pulse rounded"></div>
        <div className="h-3 sm:h-3.5 bg-gray-300 w-3/4 animate-pulse rounded"></div>
        <div className="h-2.5 sm:h-3 bg-gray-200 w-1/2 animate-pulse rounded"></div>
      </div>
      <div className="h-4 sm:h-5 bg-gray-300 w-2/3 animate-pulse rounded"></div>
    </div>
  </div>
));
SkeletonCard.displayName = 'SkeletonCard';

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  error = null,
  loadingMore = false,
}) => {
  const pathname = usePathname();
  const home =
    pathname === '/products' ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/collections/') ||
    pathname === '/search';

  const gridClasses = useMemo(
    () =>
      `grid w-full gap-[2px] lg:gap-5 xl:gap-6 
       grid-cols-2 md:grid-cols-3 
       lg:grid-cols-3 xl:grid-cols-4 
       ${home ? '2xl:grid-cols-4' : '2xl:grid-cols-5'}`,
    [home],
  );

  const uniqueProducts = useMemo(() => {
    const seen = new Set();
    return products.filter((p) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [products]);

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-600 text-sm">No products found</div>
      </div>
    );
  }

  return (
    <div className="w-full max-md:p-[3px] px-2 md:px-3 max-md:bg-gray-200">
      <div className={gridClasses}>
        {/* Show skeletons while loading and no data */}
        {loading && uniqueProducts.length === 0
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={`skeleton-${i}`} />)
          : uniqueProducts.map((product) => (
              <ProductCardWrapper key={product._id} product={product} />
            ))}

        {/* Show skeletons when loading more */}
        {loadingMore &&
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={`loadmore-${i}`} />)}
      </div>
    </div>
  );
};

export default memo(ProductGrid);
