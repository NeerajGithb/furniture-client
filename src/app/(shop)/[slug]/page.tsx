'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, AlertCircle, SlidersHorizontal } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterSidebar from '@/components/filter/FilterSidebar';
import { useProductStore } from '@/stores/productStore';
import GridSkeleton from '@/components/sceleton/GridSkeleton';
import EmptyState from '@/components/state/EmptyState';
import Link from 'next/link';

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
];

const SlugPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFullDescription, setShowFullDescription] = useState(false);
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
  const [pageType, setPageType] = useState<string | null>(null);
  const [pageData, setPageData] = useState<any>(null);

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeProducts().then(() => setIsInitialized(true));
    }
  }, [initializeProducts, isInitialized]);

  const slugAnalysis = useMemo(() => {
    if (!categories?.length || !subcategories?.length) {
      return {
        type: null,
        data: null,
        categorySlug: null,
        parentCategory: null,
      };
    }

    const matchedCategory = categories.find((cat: any) => cat.slug === slug);
    if (matchedCategory) {
      return {
        type: 'category',
        data: matchedCategory,
        categorySlug: slug,
        parentCategory: null,
      };
    }

    const matchedSubcategory = subcategories.find((sub: any) => sub.slug === slug);
    if (matchedSubcategory) {
      const parentCategory = categories.find((cat: any) => {
        const categoryId =
          matchedSubcategory.categoryId && typeof matchedSubcategory.categoryId === 'object'
            ? matchedSubcategory.categoryId._id
            : matchedSubcategory.categoryId;

        return categoryId != null && cat._id === categoryId;
      });

      return {
        type: 'subcategory',
        data: matchedSubcategory,
        categorySlug: parentCategory?.slug,
        parentCategory,
      };
    }

    return { type: null, data: null, categorySlug: null, parentCategory: null };
  }, [slug, categories, subcategories]);

  useEffect(() => {
    if (slugAnalysis.type) {
      setPageType(slugAnalysis.type);
      setPageData(slugAnalysis.data);
    }
  }, [slugAnalysis]);

  useEffect(() => {
    if (isInitialized && categories?.length && subcategories?.length && !slugAnalysis.type) {
      router.replace('/products');
    }
  }, [isInitialized, categories, subcategories, slugAnalysis.type, router]);

  const filterParams = useMemo(() => {
    const baseParams = {
      selectedMaterial: searchParams.get('material') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStockOnly: searchParams.get('inStock') === 'true',
      onSaleOnly: searchParams.get('onSale') === 'true',
      discountRange: searchParams.get('discount') || '',
      sortBy: searchParams.get('sort') || 'newest',
      selectedCategory: '',
      selectedSubcategory: '',
    };

    if (pageType === 'category') {
      return {
        ...baseParams,
        selectedCategory: slug,
        selectedSubcategory: searchParams.get('subcategory') || '',
      };
    }

    if (pageType === 'subcategory') {
      return {
        ...baseParams,
        selectedCategory: slugAnalysis.categorySlug || '',
        selectedSubcategory: slug,
      };
    }

    return baseParams;
  }, [pageType, slug, slugAnalysis.categorySlug, searchParams]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filterParams.selectedMaterial ||
      filterParams.minPrice ||
      filterParams.maxPrice ||
      filterParams.inStockOnly ||
      filterParams.onSaleOnly ||
      filterParams.discountRange ||
      (filterParams.sortBy && filterParams.sortBy !== 'newest')
    );
  }, [filterParams]);

  useEffect(() => {
    if (!isInitialized || !pageType) return;

    setCurrentPage(1);
    isLoadingMoreRef.current = false;
    resetProductState();

    const params = new URLSearchParams();

    if (filterParams.selectedCategory) {
      params.set('category', filterParams.selectedCategory);
    }
    if (filterParams.selectedSubcategory) {
      params.set('subcategory', filterParams.selectedSubcategory);
    }
    if (filterParams.selectedMaterial) {
      params.set('material', filterParams.selectedMaterial);
    }
    if (filterParams.minPrice) {
      params.set('minPrice', filterParams.minPrice);
    }
    if (filterParams.maxPrice) {
      params.set('maxPrice', filterParams.maxPrice);
    }
    if (filterParams.inStockOnly) {
      params.set('inStock', 'true');
    }
    if (filterParams.onSaleOnly) {
      params.set('onSale', 'true');
    }
    if (filterParams.discountRange) {
      params.set('discount', filterParams.discountRange);
    }
    if (filterParams.sortBy !== 'newest') {
      params.set('sort', filterParams.sortBy);
    }

    fetchProducts(params.toString(), true);
  }, [isInitialized, pageType, JSON.stringify(filterParams), fetchProducts, resetProductState]);

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

    const params = new URLSearchParams();

    if (filterParams.selectedCategory) {
      params.set('category', filterParams.selectedCategory);
    }
    if (filterParams.selectedSubcategory) {
      params.set('subcategory', filterParams.selectedSubcategory);
    }
    if (filterParams.selectedMaterial) {
      params.set('material', filterParams.selectedMaterial);
    }
    if (filterParams.minPrice) {
      params.set('minPrice', filterParams.minPrice);
    }
    if (filterParams.maxPrice) {
      params.set('maxPrice', filterParams.maxPrice);
    }
    if (filterParams.inStockOnly) {
      params.set('inStock', 'true');
    }
    if (filterParams.onSaleOnly) {
      params.set('onSale', 'true');
    }
    if (filterParams.discountRange) {
      params.set('discount', filterParams.discountRange);
    }
    if (filterParams.sortBy !== 'newest') {
      params.set('sort', filterParams.sortBy);
    }

    params.set('page', nextPage.toString());
    params.set('limit', '20');

    try {
      await fetchProducts(params.toString(), false);
      setCurrentPage(nextPage);
    } catch (error) {
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
    filterParams,
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
    if (pageType === 'category') {
      router.push(`/${slug}`);
    } else if (pageType === 'subcategory') {
      router.push(`/${slug}`);
    } else {
      router.push('/products');
    }
  }, [router, pageType, slug]);

  const removeFilter = useCallback(
    (filterKey: string) => {
      const params = new URLSearchParams(searchParams);

      if (filterKey === 'subcategory') {
        params.delete('minPrice');
        params.delete('maxPrice');
      } else if (filterKey === 'price') {
        params.delete('minPrice');
        params.delete('maxPrice');
      } else {
        params.delete(filterKey);
      }

      const baseUrl = `/${slug}`;
      const queryString = params.toString();
      router.push(queryString ? `${baseUrl}?${queryString}` : baseUrl);
    },
    [router, searchParams, slug],
  );

  const findCategoryName = useCallback(
    (categorySlug: string) => {
      if (!categories) return categorySlug;
      return categories.find((c: any) => c.slug === categorySlug)?.name || categorySlug;
    },
    [categories],
  );

  const findSubcategoryName = useCallback(
    (subcategorySlug: string) => {
      if (!subcategories) return subcategorySlug;
      return subcategories.find((s: any) => s.slug === subcategorySlug)?.name || subcategorySlug;
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
    const filters = [
      filterParams.selectedMaterial,
      filterParams.minPrice || filterParams.maxPrice ? true : false,
      filterParams.inStockOnly,
      filterParams.onSaleOnly,
      filterParams.discountRange,
      filterParams.sortBy !== 'newest',
    ];

    return filters.filter(Boolean).length;
  }, [filterParams]);

  const filters = useMemo(
    () => ({
      categories: Array.isArray(categories)
        ? categories.filter((c: any) => c && typeof c === 'object' && c._id)
        : [],
      subcategories: Array.isArray(subcategories)
        ? subcategories.filter((s: any) => s && typeof s === 'object' && s._id)
        : [],
      materials: Array.isArray(materials)
        ? materials.filter((m: any) => m && typeof m === 'object' && m._id)
        : [],
      priceRange:
        priceRange && typeof priceRange === 'object'
          ? priceRange
          : { minPrice: 0, maxPrice: 100000 },
    }),
    [categories, subcategories, materials, priceRange],
  );

  const getPageTitle = () => {
    if (pageType === 'category' && pageData) {
      return pageData.name;
    }
    if (pageType === 'subcategory' && pageData) {
      return pageData.name;
    }
    return 'Products';
  };

  const getPageDescription = () => {
    if (pageType === 'category' && pageData && pageData.description) {
      return pageData.description;
    }
    if (pageType === 'subcategory' && pageData && pageData.description) {
      return pageData.description;
    }
    return null;
  };

  if (!isInitialized || !pageType) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto">
          <div className="flex">
            <FilterSidebar filters={filters} />
            <main className="flex-1 min-w-0">
              <div className="py-2">
                <GridSkeleton />
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  const description = getPageDescription();

  return (
    <div className="min-h-screen bg-white ">
      <div className="mx-auto">
        <div className="flex">
          <FilterSidebar filters={filters} />
          <main className="flex-1 min-w-0">
            <div className="py-3">
              {/* Compact Header */}
              <div className="px-4 mb-4 flex flex-col items-center text-center">
                <h1 className="text-xl font-semibold text-gray-800 mb-2">{getPageTitle()}</h1>

                {/* Product Count - Only show when we have data */}
                {!error && !loadingProducts && products?.length > 0 && (
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-gray-900">
                      {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, totalProducts)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-gray-900">
                      {totalProducts?.toLocaleString() || 0}
                    </span>{' '}
                    {totalProducts === 1 ? 'product' : 'products'}
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 px-2 py-1 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">Error loading products</span>
                  </div>
                )}

                {/* Description - Only show if available */}
                {description && (
                  <div className="max-w-4xl">
                    {description.length > 100 ? (
                      <div className="flex items-center">
                        <p
                          className={`text-sm text-gray-500 leading-relaxed flex-1 ${
                            !showFullDescription ? 'line-clamp-1 md:line-clamp-2' : ''
                          }`}
                        >
                          {description}
                        </p>
                        <button
                          type="button"
                          className="text-red-600 md:hidden hover:text-red-700 hover:underline font-medium text-xs transition-colors flex-shrink-0 ml-2"
                          onClick={() => setShowFullDescription((prev) => !prev)}
                        >
                          {showFullDescription ? 'Less' : 'More'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                    )}
                  </div>
                )}
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

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="px-4 my-3">
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

              {/* Product Grid */}
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

              {/* Load More Observer */}
              {hasMore && products && products.length > 0 && !loadingMore && (
                <div ref={observerTarget} className="h-4 w-full -mt-8" />
              )}

              {/* End Message - View All Related */}
              {!hasMore && products && products.length > 0 && !loadingMore && !loadingProducts && (
                <motion.div
                  className="bg-gray-50 p-4 border border-gray-200 rounded-xs h-[100px] w-[300px] mx-auto mt-6 mb-10 flex justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="space-y-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href={`/${
                          pageType === 'category'
                            ? slug
                            : pageType === 'subcategory'
                            ? slugAnalysis.categorySlug ||
                              slugAnalysis.parentCategory?.slug ||
                              'products'
                            : 'products'
                        }`}
                        className="text-sm font-medium text-white bg-black px-4 py-2 hover:bg-gray-800 transition-colors duration-200 rounded-xs"
                      >
                        Explore All{' '}
                        {pageType === 'category'
                          ? findCategoryName(slug)
                          : pageType === 'subcategory'
                          ? slugAnalysis.parentCategory?.name ||
                            findCategoryName(slugAnalysis.categorySlug || '')
                          : 'Products'}{' '}
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </main>
        </div>
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

export default SlugPage;
