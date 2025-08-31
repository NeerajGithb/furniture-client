"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Filter,
  SlidersHorizontal,
  Search,
  AlertCircle,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import FilterSidebar from "@/components/FilterSidebar";
import useSearchStore from "@/stores/searchStore";

// Cache stable selectors
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
const selectSetQuery = (state: any) => state.setQuery;
const selectFallback = (state: any) => state.fallback;
const selectNoResults = (state: any) => state.noResults;

interface category {
  _id: Key | null | undefined;
  slug: string;
  name:
    | string
    | number
    | bigint
    | boolean
    | ReactElement<unknown, string | JSXElementConstructor<any>>
    | Iterable<ReactNode>
    | ReactPortal
    | Promise<
        | string
        | number
        | bigint
        | boolean
        | ReactPortal
        | ReactElement<unknown, string | JSXElementConstructor<any>>
        | Iterable<ReactNode>
        | null
        | undefined
      >
    | null
    | undefined;
}

const GridSkeleton = () => (
  <div className="">
    <div className="flex items-center justify-center w-full h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-black"
          ></motion.div>
        </div>

        {/* Loading text with shimmer */}
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-lg font-medium text-gray-800 tracking-wide"
        >
          Loading products...
        </motion.div>

        {/* Progress bar style shimmer */}
        <div className="w-48 h-2 bg-gray-200 rounded overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-1/2 h-full bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
          ></motion.div>
        </div>
      </motion.div>
    </div>
  </div>
);

type EmptyStateProps = {
  hasFilters: boolean;
  onClearFilters: () => void;
  isError?: boolean;
  errorMessage?: string;
  query?: string;
  isFallback?: boolean;
};

const EmptyState = ({
  hasFilters,
  onClearFilters,
  isError = false,
  errorMessage = "",
  query = "",
  isFallback = false,
}: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-8 sm:py-12 px-4"
  >
    <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-6 sm:p-8 text-center max-w-md mx-auto">
      {isError ? (
        <>
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Search Error
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {errorMessage || "We encountered an error while searching."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </>
      ) : !query.trim() ? (
        <>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start your search
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Enter a search term to find products
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6 text-gray-400" />
          </div>
          {isFallback ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Limited results found
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We found some related products for "{query}", but no exact matches. 
                {hasFilters && " Try adjusting your filters for more results."}
              </p>
              {hasFilters && (
                <button
                  onClick={onClearFilters}
                  className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </>
          ) : hasFilters ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We couldn't find any products matching "{query}" with your
                current filters. Try adjusting your search criteria.
              </p>
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Search className="w-4 h-4" />
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We couldn't find any products matching "{query}". Try different
                search terms.
              </p>
            </>
          )}
        </>
      )}
    </div>
  </motion.div>
);

const SearchPage: React.FC = () => {
  console.log("SearchPage rendered");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use cached selectors from search store
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
  const setQuery = useSearchStore(selectSetQuery);

  // Local state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const lastSearchRef = useRef<string>("");

  // Refs for stable actions
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const isLoadingMoreRef = useRef(false);

  // Get current query
  const query: string = searchParams.get("q") || "";

  // Update store query when URL changes
  useEffect(() => {
    setQuery(query);
  }, [query, setQuery]);

  // Stable filter parameters - memoized
  const filterParams = useMemo(
    () => ({
      query: query,
      selectedCategory: searchParams.get("category") || "",
      selectedSubcategory: searchParams.get("subcategory") || "",
      selectedMaterial: searchParams.get("material") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      inStockOnly: searchParams.get("inStock") === "true",
      onSaleOnly: searchParams.get("onSale") === "true",
      sortBy: searchParams.get("sort") || "relevance",
    }),
    [query, searchParams]
  );

  // Check active filters
  const hasActiveFilters = useMemo(() => {
    const {
      selectedCategory,
      selectedSubcategory,
      selectedMaterial,
      minPrice,
      maxPrice,
      inStockOnly,
      onSaleOnly,
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
      (sortBy && sortBy !== "relevance")
    );
  }, [filterParams]);

  // Search products when query or filters change
  useEffect(() => {
    // Create search key to detect if this is a new search
    const searchKey = `${query}-${searchParams.toString()}`;

    if (!query.trim()) {
      lastSearchRef.current = "";
      return;
    }

    // Only search if this is a completely new search
    if (lastSearchRef.current !== searchKey) {
      lastSearchRef.current = searchKey;
      const params = new URLSearchParams(searchParams.toString());
      searchProducts(query, params.toString(), true);
    }
  }, [searchParams.toString(), query, searchProducts]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      !hasMore ||
      products.length === 0 ||
      loadingProducts ||
      loadingMore ||
      !query.trim()
    ) {
      return;
    }

    isLoadingMoreRef.current = true;

    try {
      const params = new URLSearchParams(searchParams.toString());
      await searchProducts(query, params.toString(), false);
    } catch (error) {
      console.error("Error loading more search results:", error);
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
    query,
    searchParams,
    searchProducts,
  ]);

  // Set load more ref
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (
      !target ||
      loadingProducts ||
      !hasMore ||
      products.length === 0 ||
      loadingMore ||
      !query.trim()
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          loadMoreRef.current &&
          !isLoadingMoreRef.current
        ) {
          setTimeout(() => {
            if (loadMoreRef.current && !isLoadingMoreRef.current) {
              loadMoreRef.current();
            }
          }, 500);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingProducts, loadingMore, products.length, query]);

  // Navigation functions
  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set("q", query);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, query]);

  const removeFilter = useCallback(
    (filterKey: string) => {
      const params = new URLSearchParams(searchParams);

      if (filterKey === "category") {
        params.delete("category");
        params.delete("subcategory");
        params.delete("minPrice");
        params.delete("maxPrice");
      } else if (filterKey === "subcategory") {
        params.delete("subcategory");
        params.delete("minPrice");
        params.delete("maxPrice");
      } else if (filterKey === "price") {
        params.delete("minPrice");
        params.delete("maxPrice");
      } else {
        params.delete(filterKey);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Helper functions
  const findCategoryName = useCallback(
    (slug: any) => {
      if (!categories) return slug;
      return (
        categories.find((c: { slug: any }) => c.slug === slug)?.name || slug
      );
    },
    [categories]
  );

  const findSubcategoryName = useCallback(
    (subcategorySlug: any) => {
      if (!subcategories) return subcategorySlug;
      return (
        subcategories.find((s: { slug: any }) => s.slug === subcategorySlug)
          ?.name || subcategorySlug
      );
    },
    [subcategories]
  );

  const handleSuggestionClick = useCallback(
    (suggestionText: string) => {
      const params = new URLSearchParams(searchParams);
      params.set("q", suggestionText);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Active filter count
  const activeFilterCount = useMemo(() => {
    const {
      selectedCategory,
      selectedSubcategory,
      selectedMaterial,
      minPrice,
      maxPrice,
      inStockOnly,
      onSaleOnly,
      sortBy,
    } = filterParams;
    return [
      selectedCategory,
      selectedSubcategory,
      selectedMaterial,
      minPrice,
      maxPrice,
      inStockOnly,
      onSaleOnly,
      sortBy !== "relevance",
    ].filter(Boolean).length;
  }, [filterParams]);

  // Filters object
  const filters = useMemo(
    () => ({
      categories: categories || [],
      subcategories: subcategories || [],
      materials: materials || [],
      priceRange: priceRange || { minPrice: 0, maxPrice: 100000 },
    }),
    [categories, subcategories, materials, priceRange]
  );

  // Determine what to show - Fixed logic
  const shouldShowSkeleton = loadingProducts && products.length === 0;
  const shouldShowError = error && !loadingProducts;
  const shouldShowEmptyState = 
    !loadingProducts && 
    !error && 
    query.trim() && 
    (noResults || (fallback && products.length === 0));
  const shouldShowProducts = !loadingProducts && !error && products.length > 0;

  return (
    <div className="min-h-screen bg-white ">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex">
          {/* Left Sidebar Filters - Desktop */}
          <FilterSidebar filters={filters} />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="px-3 py-2 sm:px-4 shadow-sm">
              <motion.nav
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mb-2 text-xs text-gray-600 flex items-center justify-start flex-wrap gap-1"
              >
                <span
                  className="cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => router.push("/")}
                >
                  Home
                </span>
                <span className="text-gray-400">›</span>
                <span
                  className="cursor-pointer hover:text-indigo-600 transition"
                  onClick={() => router.push("/products")}
                >
                  Furniture
                </span>
                <span className="text-gray-400">›</span>
                {query ? (
                  <span
                    className="cursor-pointer hover:text-indigo-600 transition text-gray-500"
                    onClick={() =>
                      router.push(`/search?q=${encodeURIComponent(query)}`)
                    }
                  >
                    {query}
                  </span>
                ) : (
                  <span className="text-gray-400">No search query</span>
                )}
              </motion.nav>

              {/* Unified Search Results Header */}
              {query && !loadingProducts && !shouldShowError ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mb-4 pb-3 border-b border-gray-200"
                >
                  <h1 className="text-base font-semibold text-gray-900 text-center">
                    {products.length > 0 ? (
                      <>
                        Showing{" "}
                        <span className="font-bold text-gray-900">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{" "}
                        –{" "}
                        <span className="font-bold text-gray-900">
                          {Math.min(
                            pagination.page * pagination.limit,
                            totalProducts
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-bold text-gray-900">
                          {totalProducts?.toLocaleString() || 0}
                        </span>{" "}
                        results for{" "}
                        <span className="font-bold text-indigo-600">"{query}"</span>
                        {fallback && (
                          <span className="block text-sm text-orange-600 mt-1">
                            (Related results - no exact matches found)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-600">Search results for "{query}"</span>
                    )}
                  </h1>
                </motion.div>
              ) : (
                <div>
                  <div className="mb-3 pb-3 border-b border-gray-200 h-10" />
                </div>
              )}

              {/* Suggestion */}
              {suggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-xs p-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Search size={14} className="text-blue-600" />
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

              {/* Related Categories */}
              {relatedCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600 mr-2">Related:</span>
                    {relatedCategories.map((category: category) => (
                      <button
                        key={category._id}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set("category", category.slug);
                          router.push(`${pathname}?${params.toString()}`);
                        }}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Results Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-1"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm sm:text-base text-gray-800">
                      {shouldShowError && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-full px-3 py-1.5 shadow-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Search error</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Filter Button */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-sm border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-sm font-medium"
                  >
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                      <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] h-[18px] flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-white border border-gray-100 rounded-sm shadow-sm"
                >
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" />
                    Active:
                  </span>
                  {filterParams.selectedCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      {findCategoryName(filterParams.selectedCategory)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("category")}
                      />
                    </span>
                  )}
                  {filterParams.selectedSubcategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      {findSubcategoryName(filterParams.selectedSubcategory)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("subcategory")}
                      />
                    </span>
                  )}
                  {filterParams.selectedMaterial && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      {filterParams.selectedMaterial}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("material")}
                      />
                    </span>
                  )}
                  {(filterParams.minPrice || filterParams.maxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      ₹{filterParams.minPrice || 0} - ₹
                      {filterParams.maxPrice || "∞"}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("price")}
                      />
                    </span>
                  )}
                  {filterParams.inStockOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      In Stock
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("inStock")}
                      />
                    </span>
                  )}
                  {filterParams.onSaleOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      On Sale
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("onSale")}
                      />
                    </span>
                  )}
                  {filterParams.sortBy !== "relevance" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      Sort: {filterParams.sortBy}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("sort")}
                      />
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 hover:text-red-800 font-medium underline ml-2"
                  >
                    Clear All
                  </button>
                </motion.div>
              )}

              {/* Content Area */}
              <div className="mb-8">
                {shouldShowSkeleton ? (
                  <GridSkeleton />
                ) : shouldShowError ? (
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                    isError={true}
                    errorMessage={error}
                    query={query}
                  />
                ) : shouldShowEmptyState ? (
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                    query={query}
                    isFallback={fallback}
                  />
                ) : shouldShowProducts ? (
                  <>
                    {fallback && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4"
                      >
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-sm">
                          Showing related results for{" "}
                          <strong>"{query}"</strong> - no exact matches found.
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

              {/* Intersection Observer Target - positioned after content */}
              {hasMore && products && products.length > 0 && !loadingMore && (
                <div
                  ref={observerTarget}
                  className="h-4 w-full"
                  style={{ marginTop: "-2rem" }}
                />
              )}

              {/* End of Results */}
              {!hasMore &&
                products &&
                products.length > 0 &&
                !loadingMore &&
                !loadingProducts && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="bg-white rounded-xs p-8 border border-gray-100 shadow-sm max-w-sm mx-auto">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="text-gray-900 font-semibold text-lg mb-2">
                        All results shown!
                      </div>
                      <div className="text-gray-600 text-sm">
                        Found {totalProducts?.toLocaleString() || 0}{" "}
                        {totalProducts === 1 ? "result" : "results"} for "
                        {query}".
                        {fallback && (
                          <span className="block text-orange-600 mt-1">
                            (Related results only)
                          </span>
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
              className="fixed inset-0 bg-black bg-opacity-60 z-50 lg:hidden backdrop-blur-sm"
              onClick={() => setShowMobileFilters(false)}
            >
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
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