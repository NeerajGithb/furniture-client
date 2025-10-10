'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, SlidersHorizontal, AlertCircle, ShoppingBag } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterSidebar from '@/components/filter/FilterSidebar';
import { useProductStore } from '@/stores/productStore';
import GridSkeleton from '@/components/sceleton/GridSkeleton';
import EmptyState from '@/components/state/EmptyState';

const selectProducts = (state: any) => state.products;
const selectCategories = (state: any) => state.categories;
const selectSubcategories = (state: any) => state.subcategories;
const selectMaterials = (state: any) => state.materials;
const selectPriceRange = (state: any) => state.priceRange;
const selectLoadingProducts = (state: any) => state.loadingProducts;
const selectLoadingMore = (state: any) => state.loadingMore;
const selectError = (state: any) => state.error;
const selectTotalProducts = (state: any) => state.totalProducts;
const selectHasMore = (state: any) => state.hasMore;
const selectInitializeProducts = (state: any) => state.initializeProducts;
const selectFetchProducts = (state: any) => state.fetchProducts;
const selectResetProductState = (state: any) => state.resetProductState;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'discount', label: 'Highest Discount' },
] as const;

const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const products = useProductStore(selectProducts);
  const categories = useProductStore(selectCategories);
  const subcategories = useProductStore(selectSubcategories);
  const materials = useProductStore(selectMaterials);
  const priceRange = useProductStore(selectPriceRange);
  const loadingProducts = useProductStore(selectLoadingProducts);
  const loadingMore = useProductStore(selectLoadingMore);
  const error = useProductStore(selectError);
  const totalProducts = useProductStore(selectTotalProducts);
  const hasMore = useProductStore(selectHasMore);

  const initializeProducts = useProductStore(selectInitializeProducts);
  const fetchProducts = useProductStore(selectFetchProducts);
  const resetProductState = useProductStore(selectResetProductState);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeProducts().then(() => setIsInitialized(true));
    }
  }, [initializeProducts, isInitialized]);

  const filterParams = useMemo(
    () => ({
      selectedCategory: searchParams.get('category') || '',
      selectedSubcategory: searchParams.get('subcategory') || '',
      selectedMaterial: searchParams.get('material') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStockOnly: searchParams.get('inStock') === 'true',
      onSaleOnly: searchParams.get('onSale') === 'true',
      discountRange: searchParams.get('discount') || '',
      sortBy: searchParams.get('sort') || 'newest',
    }),
    [searchParams],
  );

  const hasActiveFilters = useMemo(() => {
    const {
      selectedCategory,
      selectedSubcategory,
      selectedMaterial,
      minPrice,
      maxPrice,
      inStockOnly,
      onSaleOnly,
      discountRange,
      sortBy,
    } = filterParams;
    return !!(
      selectedCategory ||
      selectedSubcategory ||
      selectedMaterial ||
      minPrice ||
      maxPrice ||
      inStockOnly ||
      onSaleOnly ||
      discountRange ||
      (sortBy && sortBy !== 'newest')
    );
  }, [filterParams]);

  useEffect(() => {
    if (!isInitialized) return;

    setCurrentPage(1);
    isLoadingMoreRef.current = false;
    resetProductState();

    const params = new URLSearchParams(searchParams.toString());
    fetchProducts(params.toString(), true);
  }, [searchParams.toString(), isInitialized, fetchProducts, resetProductState]);

  const loadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      !hasMore ||
      products.length === 0 ||
      loadingProducts ||
      loadingMore
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    const nextPage = currentPage + 1;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', nextPage.toString());
    params.set('limit', '20');

    try {
      await fetchProducts(params.toString(), false);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 1000);
    }
  }, [
    hasMore,
    products.length,
    loadingProducts,
    loadingMore,
    currentPage,
    searchParams,
    fetchProducts,
  ]);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (!target || loadingProducts || !hasMore || products.length === 0 || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && loadMoreRef.current && !isLoadingMoreRef.current) {
          setTimeout(() => {
            if (loadMoreRef.current && !isLoadingMoreRef.current) {
              loadMoreRef.current();
            }
          }, 500);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingProducts, loadingMore, products.length]);

  const clearAllFilters = useCallback(() => {
    router.push('/products');
  }, [router]);

  const removeFilter = useCallback(
    (filterKey: string) => {
      const params = new URLSearchParams(searchParams);

      if (filterKey === 'category') {
        params.delete('category');
        params.delete('subcategory');
      } else if (filterKey === 'subcategory') {
        params.delete('subcategory');
      } else if (filterKey === 'price') {
        params.delete('minPrice');
        params.delete('maxPrice');
      } else {
        params.delete(filterKey);
      }

      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams],
  );

  const findCategoryName = useCallback(
    (slug: any) => {
      if (!categories) return slug;
      return categories.find((c: { slug: any }) => c.slug === slug)?.name || slug;
    },
    [categories],
  );

  const findSubcategoryName = useCallback(
    (subcategorySlug: any) => {
      if (!subcategories) return subcategorySlug;
      return (
        subcategories.find((s: { slug: any }) => s.slug === subcategorySlug)?.name ||
        subcategorySlug
      );
    },
    [subcategories],
  );

  const findSortLabel = useCallback((value: string) => {
    return SORT_OPTIONS.find((opt) => opt.value === value)?.label || value;
  }, []);

  const getDiscountLabel = useCallback((value: string) => {
    const discountOptions = [
      { value: '', label: 'All Products' },
      { value: '10', label: '10% or more' },
      { value: '25', label: '25% or more' },
      { value: '50', label: '50% or more' },
      { value: '70', label: '70% or more' },
    ];
    return discountOptions.find((opt) => opt.value === value)?.label || `${value}% or more`;
  }, []);

  const activeFilterCount = useMemo(() => {
    const {
      selectedCategory,
      selectedSubcategory,
      selectedMaterial,
      minPrice,
      maxPrice,
      inStockOnly,
      onSaleOnly,
      discountRange,
      sortBy,
    } = filterParams;

    const filters = [
      selectedCategory,
      selectedSubcategory,
      selectedMaterial,
      minPrice || maxPrice,
      inStockOnly,
      onSaleOnly,
      discountRange,
      sortBy !== 'newest',
    ];

    return filters.filter(Boolean).length;
  }, [filterParams]);

  const filters = useMemo(
    () => ({
      categories: Array.isArray(categories)
        ? categories.filter((c) => c && typeof c === 'object' && c._id)
        : [],
      subcategories: Array.isArray(subcategories)
        ? subcategories.filter((s) => s && typeof s === 'object' && s._id)
        : [],
      materials: Array.isArray(materials)
        ? materials.filter((m) => m && typeof m === 'object' && m._id)
        : [],
      priceRange:
        priceRange && typeof priceRange === 'object'
          ? priceRange
          : { minPrice: 0, maxPrice: 100000 },
    }),
    [categories, subcategories, materials, priceRange],
  );

  return (
    <div className="min-h-screen bg-white ">
      <div className="mx-auto">
        <div className="flex">
          {/* Left Sidebar Filters - Desktop */}
          <FilterSidebar filters={filters} />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="py-2 ">
              {/* Fixed Header Section */}
              <div className="flex flex-col justify-between">
                {/* Results Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="relative flex items-center mb-2"
                >
                  <div className="w-full flex justify-center">
                    {error ? (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-full px-4 py-2 shadow-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Error loading products</span>
                      </div>
                    ) : !loadingProducts && products?.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="text-center"
                      >
                        <h1 className="text-sm sm:text-base font-semibold text-gray-900">
                          Showing{' '}
                          <span className="font-bold text-gray-900">
                            {(currentPage - 1) * 20 + 1}
                          </span>{' '}
                          –{' '}
                          <span className="font-bold text-gray-900">
                            {Math.min(currentPage * 20, totalProducts)}
                          </span>{' '}
                          of{' '}
                          <span className="font-bold text-gray-900">
                            {totalProducts?.toLocaleString() || 0}
                          </span>{' '}
                          {totalProducts === 1 ? 'product' : 'products'}
                        </h1>
                      </motion.div>
                    ) : loadingProducts ? (
                      <div className="text-center">
                        <div className="h-6 w-56"></div>
                      </div>
                    ) : (
                      <div className="h-6"></div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Mobile Filter Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden w-full flex items-center justify-between px-4 mx-1 py-3 border border-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm hover:shadow-md hover:border-slate-400 hover:from-slate-100 hover:to-gray-100 transition-all duration-300 text-sm font-medium text-slate-800 hover:text-slate-900"
              >
                <span className="flex items-center gap-2.5">Sort & Filters</span>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1 font-semibold min-w-[20px] h-[20px] flex items-center justify-center shadow-sm">
                      {activeFilterCount}
                    </span>
                  )}
                  <SlidersHorizontal className="w-4 h-4 text-slate-800 " />
                </div>
              </motion.button>

              {/* Active Filters with Discount Support */}
              {hasActiveFilters && (
                <div className="px-4  my-4 md:mb-4 ">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                      Filters:
                    </span>
                    {filterParams.selectedMaterial && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                        {filterParams.selectedMaterial}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('material')}
                        />
                      </span>
                    )}

                    {(filterParams.minPrice || filterParams.maxPrice) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                        ₹{filterParams.minPrice || 0}–₹
                        {filterParams.maxPrice || 100000}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('price')}
                        />
                      </span>
                    )}

                    {filterParams.discountRange && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        {getDiscountLabel(filterParams.discountRange)}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('discount')}
                        />
                      </span>
                    )}

                    {filterParams.inStockOnly && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        In Stock
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('inStock')}
                        />
                      </span>
                    )}

                    {filterParams.onSaleOnly && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        On Sale
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('onSale')}
                        />
                      </span>
                    )}

                    {filterParams.sortBy !== 'newest' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {findSortLabel(filterParams.sortBy)}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('sort')}
                        />
                      </span>
                    )}

                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] text-red-600 hover:text-red-700 font-medium underline px-1 py-0.5 hover:bg-red-50 rounded transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="min-h-[400px]">
                {loadingProducts && (!products || products.length === 0) ? (
                  <GridSkeleton />
                ) : error ? (
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                    isError={true}
                    errorMessage={error}
                  />
                ) : !products || products.length === 0 ? (
                  <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearAllFilters} />
                ) : (
                  <ProductGrid
                    products={products}
                    loading={false}
                    error={null}
                    loadingMore={loadingMore}
                  />
                )}
              </div>

              {/* Intersection Observer Target */}
              {hasMore && products && products.length > 0 && !loadingMore && (
                <div ref={observerTarget} className="h-4 w-full -mt-8" />
              )}

              {/* End of Results */}
              {!hasMore && products && products.length > 0 && !loadingMore && !loadingProducts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 mt-8"
                >
                  <div className="bg-white rounded-xs p-8 border border-gray-200 shadow-sm max-w-md mx-auto">
                    <p className="text-gray-600 text-base">
                      You've viewed all{' '}
                      <span className="font-semibold text-blue-600">
                        {totalProducts?.toLocaleString() || 0}
                      </span>{' '}
                      {totalProducts === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </main>
        </div>

        {/* Mobile Filter Overlay */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden min-h-screen"
              onClick={() => setShowMobileFilters(false)}
            >
              <motion.div
                className="w-70"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                <FilterSidebar
                  filters={filters}
                  isMobile={true}
                  onClose={() => setShowMobileFilters(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductsPage;
