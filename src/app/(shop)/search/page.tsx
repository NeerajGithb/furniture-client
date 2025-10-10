'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Search, AlertCircle, ShoppingBag } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/filter/FilterSidebar';
import useSearchStore from '@/stores/searchStore';
import SearchEmptyState from '@/components/state/SearchEmptyState';
import GridSkeleton from '@/components/sceleton/GridSkeleton';
import { Category } from '@/types/Product';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'discount', label: 'Highest Discount' },
];

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
const selectPagination = (state: any) => state.pagination;
const selectSuggestion = (state: any) => state.suggestion;
const selectRelatedCategories = (state: any) => state.relatedCategories;
const selectSearchProducts = (state: any) => state.searchProducts;
const selectFetchProducts = (state: any) => state.fetchProducts;
const selectSetQuery = (state: any) => state.setQuery;
const selectResetProductState = (state: any) => state.resetProductState;
const selectFallback = (state: any) => state.fallback;
const selectNoResults = (state: any) => state.noResults;

const SearchPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const products = useSearchStore(selectProducts);
  const categories = useSearchStore(selectCategories);
  const subcategories = useSearchStore(selectSubcategories);
  const materials = useSearchStore(selectMaterials);
  const priceRange = useSearchStore(selectPriceRange);
  const loadingProducts = useSearchStore(selectLoadingProducts);
  const loadingMore = useSearchStore(selectLoadingMore);
  const error = useSearchStore(selectError);
  const totalProducts = useSearchStore(selectTotalProducts);
  const hasMore = useSearchStore(selectHasMore);
  const pagination = useSearchStore(selectPagination);
  const suggestion = useSearchStore(selectSuggestion);
  const relatedCategories = useSearchStore(selectRelatedCategories);
  const fallback = useSearchStore(selectFallback);
  const noResults = useSearchStore(selectNoResults);

  const searchProducts = useSearchStore(selectSearchProducts);
  const fetchProducts = useSearchStore(selectFetchProducts);
  const setQuery = useSearchStore(selectSetQuery);
  const resetProductState = useSearchStore(selectResetProductState);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const lastSearchRef = useRef<string>('');

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const isLoadingMoreRef = useRef(false);

  const query: string = searchParams.get('q') || '';

  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  const filterParams = useMemo(
    () => ({
      query: query,
      selectedCategory: searchParams.get('category') || '',
      selectedSubcategory: searchParams.get('subcategory') || '',
      selectedMaterial: searchParams.get('material') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStockOnly: searchParams.get('inStock') === 'true',
      onSaleOnly: searchParams.get('onSale') === 'true',
      discountRange: searchParams.get('discount') || '',
      sortBy: searchParams.get('sort') || 'relevance',
    }),
    [query, searchParams],
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
      (sortBy && sortBy !== 'relevance')
    );
  }, [filterParams]);

  useEffect(() => {
    const searchKey = `${query}-${searchParams.toString()}`;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    params.delete('limit');
    const hasFiltersOnly = Array.from(params.keys()).length > 0;

    if (!query.trim() && !hasFiltersOnly) {
      lastSearchRef.current = '';
      resetProductState();
      return;
    }

    if (lastSearchRef.current !== searchKey) {
      lastSearchRef.current = searchKey;
      setCurrentPage(1);
      isLoadingMoreRef.current = false;

      const urlParams = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        searchProducts(query, urlParams.toString(), true);
      } else if (hasFiltersOnly) {
        fetchProducts(urlParams.toString(), true);
      }
    }
  }, [searchParams.toString(), query, searchProducts, fetchProducts, resetProductState]);

  const loadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      !hasMore ||
      products.length === 0 ||
      loadingProducts ||
      loadingMore ||
      (!query.trim() && !hasActiveFilters)
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    const nextPage = currentPage + 1;

    try {
      const params = new URLSearchParams();

      if (query.trim()) {
        params.set('q', query);
      }

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
      if (filterParams.sortBy !== 'relevance') {
        params.set('sort', filterParams.sortBy);
      }

      params.set('page', nextPage.toString());
      params.set('limit', '20');

      if (query.trim()) {
        await searchProducts(query, params.toString(), false);
      } else {
        await fetchProducts(params.toString(), false);
      }

      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more results:', error);
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
    query,
    filterParams,
    searchProducts,
    fetchProducts,
    hasActiveFilters,
  ]);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const target = observerTarget.current;
    if (
      !target ||
      loadingProducts ||
      !hasMore ||
      products.length === 0 ||
      loadingMore ||
      (!query.trim() && !hasActiveFilters)
    ) {
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
  }, [hasMore, loadingProducts, loadingMore, products.length, query, hasActiveFilters]);

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, query]);

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

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
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

  const handleSuggestionClick = useCallback(
    (suggestionText: string) => {
      const params = new URLSearchParams(searchParams);
      params.set('q', suggestionText);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

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

      minPrice || maxPrice ? true : false,
      inStockOnly,
      onSaleOnly,
      discountRange,
      sortBy !== 'relevance',
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

  const shouldShowSkeleton = loadingProducts && products.length === 0;
  const shouldShowError = error && !loadingProducts;
  const shouldShowEmptyState =
    !loadingProducts &&
    !error &&
    ((query.trim() && (noResults || (fallback && products.length === 0))) ||
      (!query.trim() && hasActiveFilters && products.length === 0));
  const shouldShowProducts = !loadingProducts && !error && products.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex">
          <FilterSidebar filters={filters} />
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="py-2 px-3">
              <motion.nav
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mb-2 text-xs text-gray-600 flex items-center justify-start flex-wrap gap-1"
              >
                <span
                  className="cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => router.push('/')}
                >
                  Home
                </span>
                <span className="text-gray-400">›</span>
                <span
                  className="cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => router.push('/products')}
                >
                  Furniture
                </span>
                <span className="text-gray-400">›</span>
                {query ? (
                  <span
                    className="cursor-pointer hover:text-indigo-600 transition text-gray-500"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
                  >
                    {query}
                  </span>
                ) : hasActiveFilters ? (
                  <span className="text-gray-500">Filtered Results</span>
                ) : (
                  <span className="text-gray-400">Search</span>
                )}
              </motion.nav>

              {/* UPDATED: Unified Search Results Header - support filter-only */}
              {(query || hasActiveFilters) && !loadingProducts && !shouldShowError ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="mb-3 pb-2 border-b border-gray-200"
                >
                  <h1 className="text-sm font-semibold text-gray-900 text-center leading-tight">
                    {products.length > 0 ? (
                      <>
                        Showing{' '}
                        <span className="font-bold text-gray-900">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        –{' '}
                        <span className="font-bold text-gray-900">
                          {Math.min(pagination.page * pagination.limit, totalProducts)}
                        </span>{' '}
                        of{' '}
                        <span className="font-bold text-gray-900">
                          {totalProducts?.toLocaleString() || 0}
                        </span>{' '}
                        {query ? (
                          <>
                            results for <span className="font-bold text-indigo-600">"{query}"</span>
                            {fallback && (
                              <span className="block text-xs text-orange-600 mt-1">
                                (Related results - no exact matches found)
                              </span>
                            )}
                          </>
                        ) : (
                          <span>products</span>
                        )}
                      </>
                    ) : query ? (
                      <span className="text-gray-600">Search results for "{query}"</span>
                    ) : (
                      <span className="text-gray-600">Filtered products</span>
                    )}
                  </h1>
                </motion.div>
              ) : (
                <div>
                  <div className="mb-2 pb-2 border-b border-gray-200 h-6" />
                </div>
              )}

              {/* Suggestion - only show for search queries */}
              {suggestion && query && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
                    <div className="flex items-center space-x-2 text-xs">
                      <Search size={12} className="text-blue-600" />
                      <span className="text-blue-800">Did you mean:</span>
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        {suggestion}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Related Categories - only show for search queries */}
              {relatedCategories.length > 0 && query && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-gray-600 mr-1">Related:</span>
                    {relatedCategories.map((category: Category) => (
                      <button
                        key={category._id}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('category', category.slug);
                          router.push(`${pathname}?${params.toString()}`);
                        }}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results Header */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="mb-1"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs sm:text-sm text-gray-800">
                      {shouldShowError && (
                        <div className="flex items-center gap-1.5 text-red-600 bg-red-50 rounded-full px-2.5 py-1 shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-medium text-xs">Search error</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden w-full flex items-center justify-between px-3 py-2.5 border border-slate-300 bg-gradient-to-r from-slate-50 to-gray-50 shadow-sm hover:shadow-md hover:border-slate-400 hover:from-slate-100 hover:to-gray-100 transition-all duration-300 text-sm font-medium text-slate-800 hover:text-slate-900 mb-2"
              >
                <span className="flex items-center gap-2">Sort & Filters</span>
                <div className="flex items-center gap-1.5">
                  {hasActiveFilters && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-1.5 py-0.5 font-semibold min-w-[16px] h-[16px] flex items-center justify-center shadow-sm rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                  <SlidersHorizontal className="w-4 h-4 text-slate-800" />
                </div>
              </motion.button>

              {/* Enhanced Active Filters Display */}
              {hasActiveFilters && (
                <div className="px-1 my-3">
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wide">
                      Filters:
                    </span>

                    {filterParams.selectedCategory && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {findCategoryName(filterParams.selectedCategory)}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('category')}
                        />
                      </span>
                    )}

                    {filterParams.selectedSubcategory && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                        {findSubcategoryName(filterParams.selectedSubcategory)}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('subcategory')}
                        />
                      </span>
                    )}

                    {filterParams.selectedMaterial && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                        {filterParams.selectedMaterial}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('material')}
                        />
                      </span>
                    )}

                    {(filterParams.minPrice || filterParams.maxPrice) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                        ₹{filterParams.minPrice || 0}–₹
                        {filterParams.maxPrice || 100000}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('price')}
                        />
                      </span>
                    )}

                    {filterParams.discountRange && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                        {getDiscountLabel(filterParams.discountRange)}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('discount')}
                        />
                      </span>
                    )}

                    {filterParams.inStockOnly && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        In Stock
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('inStock')}
                        />
                      </span>
                    )}

                    {filterParams.onSaleOnly && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                        On Sale
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('onSale')}
                        />
                      </span>
                    )}

                    {filterParams.sortBy !== 'relevance' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        {findSortLabel(filterParams.sortBy)}
                        <X
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500 transition-colors"
                          onClick={() => removeFilter('sort')}
                        />
                      </span>
                    )}

                    <button
                      onClick={clearAllFilters}
                      className="text-[9px] text-red-600 hover:text-red-700 font-medium underline px-1 py-0.5 hover:bg-red-50 rounded transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="min-h-[300px]">
                {shouldShowSkeleton ? (
                  <GridSkeleton />
                ) : shouldShowError ? (
                  <SearchEmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                    isError={true}
                    errorMessage={error}
                    query={query}
                    isFallback={fallback}
                  />
                ) : shouldShowEmptyState ? (
                  <SearchEmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                    query={query}
                    isFallback={fallback}
                  />
                ) : shouldShowProducts ? (
                  <>
                    {fallback && query && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-1 mb-3"
                      >
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs p-2.5 rounded-md">
                          Showing related results for <strong>"{query}"</strong> - no exact matches
                          found.
                        </div>
                      </motion.div>
                    )}
                    <ProductGrid
                      products={products}
                      loading={false}
                      error={null}
                      loadingMore={loadingMore}
                    />
                  </>
                ) : null}
              </div>

              {/* Load More Observer */}
              {hasMore && products && products.length > 0 && !loadingMore && (
                <div ref={observerTarget} className="h-3 w-full -mt-6" />
              )}

              {/* End of Results */}
              {!hasMore && products && products.length > 0 && !loadingMore && !loadingProducts && (
                <motion.div
                  className="bg-gray-50 p-3 border border-gray-200 rounded-md h-[80px] w-[250px] mx-auto mt-4 mb-6 flex justify-center items-center"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ShoppingBag className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-gray-900 font-semibold text-xs text-center">
                      All results shown!
                    </div>
                    <div className="text-gray-600 text-[10px] text-center leading-tight">
                      Found {totalProducts?.toLocaleString() || 0} {query ? 'results' : 'products'}
                      {fallback && query && (
                        <span className="block text-orange-600 mt-0.5">(Related results only)</span>
                      )}
                    </div>
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

export default SearchPage;
