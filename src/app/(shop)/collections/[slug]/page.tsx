"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { useRouter, useSearchParams, useParams } from "next/navigation";
import FilterSidebar from "@/components/FilterSidebar";
import { useProductStore } from "@/stores/productStore";

// Cache stable selectors - fixes hydration issues
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
const selectInitialize = (state: any) => state.initialize;
const selectFetchProducts = (state: any) => state.fetchProducts;
const selectResetProductState = (state: any) => state.resetProductState;

// Stable sort options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
  { value: "rating", label: "Customer Rating" },
  { value: "discount", label: "Highest Discount" },
] as const;

const GridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-white border border-gray-200 overflow-hidden shadow-sm w-full max-w-[280px] mx-auto"
        style={{ height: "420px" }}
      >
        <div
          className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden"
          style={{ height: "65%" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer transform -skew-x-12"></div>
          <div className="absolute top-3 left-3 space-y-2">
            <div className="w-16 h-6 bg-gray-300 animate-pulse"></div>
          </div>
          <div className="absolute top-3 right-3 w-10 h-10 bg-gray-300 animate-pulse"></div>
        </div>

        <div className="p-4 h-[35%] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="h-3.5 bg-gray-300 w-full animate-pulse"></div>
              <div className="h-3.5 bg-gray-300 w-3/4 animate-pulse"></div>
            </div>
            <div className="h-3 bg-gray-200 w-1/2 animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 w-full animate-pulse"></div>
              <div className="h-3 bg-gray-200 w-2/3 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="w-2.5 h-2.5 bg-gray-200 animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="h-3 bg-gray-200 w-8 animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-2 mt-auto">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-gray-300 w-20 animate-pulse"></div>
                <div className="h-3 bg-gray-200 w-16 animate-pulse"></div>
              </div>
              <div className="h-2.5 bg-gray-200 w-24 animate-pulse"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-3 bg-gray-200 w-20 animate-pulse"></div>
              <div className="h-3 bg-gray-200 w-18 animate-pulse"></div>
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

type EmptyStateProps = {
  hasFilters: boolean;
  onClearFilters: () => void;
  isError?: boolean;
  errorMessage?: string;
};

const EmptyState = ({
  hasFilters,
  onClearFilters,
  isError = false,
  errorMessage = "",
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
            Something went wrong
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {errorMessage || "We encountered an error while loading products."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6 text-gray-400" />
          </div>
          {hasFilters ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We couldn't find any products matching your filters. Try
                adjusting your search criteria.
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
                No products available
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                We don't have any products available at the moment. Please check
                back later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </>
          )}
        </>
      )}
    </div>
  </motion.div>
);

export default function CollectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // Get category slug from URL params
  const categorySlug = params?.slug as string;

  // Use cached selectors to prevent hydration issues
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

  const initialize = useProductStore(selectInitialize);
  const fetchProducts = useProductStore(selectFetchProducts);
  const resetProductState = useProductStore(selectResetProductState);

  // Local state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs for stable actions
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);
  const isLoadingMoreRef = useRef(false);

  // Initialize store once
  useEffect(() => {
    if (!isInitialized) {
      initialize().then(() => setIsInitialized(true));
    }
  }, [initialize, isInitialized]);

  // Stable filter parameters - memoized with category from URL slug
  const filterParams = useMemo(
    () => ({
      selectedCategory: categorySlug || searchParams.get("category") || "",
      selectedSubcategory: searchParams.get("subcategory") || "",
      selectedMaterial: searchParams.get("material") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      inStockOnly: searchParams.get("inStock") === "true",
      onSaleOnly: searchParams.get("onSale") === "true",
      sortBy: searchParams.get("sort") || "newest",
    }),
    [searchParams, categorySlug]
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
      (sortBy && sortBy !== "newest")
    );
  }, [filterParams]);

  // Clear products and fetch new ones when filters change
  useEffect(() => {
    if (!isInitialized) return;

    // Reset page and loading state
    setCurrentPage(1);
    isLoadingMoreRef.current = false;

    // Clear existing products first
    resetProductState();

    // Build params
    const params = new URLSearchParams(searchParams.toString());
    if (categorySlug) {
      params.set("category", categorySlug);
    }

    // Fetch new products
    fetchProducts(params.toString(), true);
  }, [
    searchParams.toString(),
    categorySlug,
    isInitialized,
    fetchProducts,
    resetProductState,
  ]);

  // Load more function with better state management
  const loadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      !hasMore ||
      products?.length === 0 ||
      loadingProducts ||
      loadingMore
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    const nextPage = currentPage + 1;

    try {
      const params = new URLSearchParams();
      params.append("page", nextPage.toString());
      params.append("limit", "20");

      // Add all active filters
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== "newest") {
          if (key === "inStockOnly" || key === "onSaleOnly") {
            if (value)
              params.append(
                key === "inStockOnly" ? "inStock" : "onSale",
                "true"
              );
          } else if (key === "sortBy") {
            params.append("sort", String(value));
          } else if (key === "selectedCategory") {
            params.append("category", String(value));
          } else if (key === "selectedSubcategory") {
            params.append("subcategory", String(value));
          } else if (key === "selectedMaterial") {
            params.append("material", String(value));
          } else if (key === "minPrice") {
            params.append("minPrice", String(value));
          } else if (key === "maxPrice") {
            params.append("maxPrice", String(value));
          }
        }
      });

      if (!filterParams.sortBy || filterParams.sortBy === "newest") {
        params.append("sort", "newest");
      }

      await fetchProducts(params.toString(), false);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more products:", error);
    } finally {
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 1000);
    }
  }, [
    hasMore,
    products?.length,
    loadingProducts,
    loadingMore,
    currentPage,
    filterParams,
    fetchProducts,
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
      products?.length === 0 ||
      loadingMore
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
  }, [hasMore, loadingProducts, loadingMore, products?.length]);

  // Navigation functions
  const clearAllFilters = useCallback(() => {
    if (categorySlug) {
      router.push(`/collections/${categorySlug}`);
    } else {
      router.push("/products");
    }
  }, [router, categorySlug]);

  const removeFilter = useCallback(
    (filterKey: string) => {
      const params = new URLSearchParams(searchParams);

      if (filterKey === "category") {
        if (categorySlug) {
          router.push(`/collections/${categorySlug}`);
          return;
        }
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

      const baseUrl = categorySlug
        ? `/collections/${categorySlug}`
        : "/products";
      router.push(`${baseUrl}?${params.toString()}`);
    },
    [router, searchParams, categorySlug]
  );

  // Helper functions - memoized with null checks
  const findCategoryName = useCallback(
    (slug: string) => {
      if (!categories) return slug;
      return (
        categories.find((c: { slug: string }) => c.slug === slug)?.name || slug
      );
    },
    [categories]
  );

  const findSubcategoryName = useCallback(
    (subcategorySlug: string) => {
      if (!subcategories) return subcategorySlug;
      return (
        subcategories.find((s: { slug: string }) => s.slug === subcategorySlug)
          ?.name || subcategorySlug
      );
    },
    [subcategories]
  );

  const findSortLabel = useCallback((value: string) => {
    return SORT_OPTIONS.find((opt) => opt.value === value)?.label || value;
  }, []);

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
      sortBy !== "newest",
    ].filter(Boolean).length;
  }, [filterParams]);

  // Filters object - stable with null checks
  const filters = useMemo(
    () => ({
      categories: categories || [],
      subcategories: subcategories || [],
      materials: materials || [],
      priceRange: priceRange || { minPrice: 0, maxPrice: 100000 },
    }),
    [categories, subcategories, materials, priceRange]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex">
          {/* Left Sidebar Filters - Desktop */}
          <FilterSidebar filters={filters} />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="px-3 py-2 sm:px-4 bg-gradient-to-b from-gray-50 to-white shadow-sm">
              {/* Results Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-1"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm sm:text-base text-gray-700">
                      {error ? (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-full px-3 py-1.5 shadow-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">
                            Error loading products
                          </span>
                        </div>
                      ) : (
                        <>
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {products?.length?.toLocaleString() || 0}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">
                            {totalProducts?.toLocaleString() || 0}
                          </span>{" "}
                          {totalProducts === 1 ? "result" : "results"}
                        </>
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
                  {filterParams.sortBy !== "newest" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-xs rounded-full font-medium shadow-sm">
                      {findSortLabel(filterParams.sortBy)}
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
                  <EmptyState
                    hasFilters={hasActiveFilters}
                    onClearFilters={clearAllFilters}
                  />
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
                        You've seen everything!
                      </div>
                      <div className="text-gray-600 text-sm">
                        All {totalProducts?.toLocaleString() || 0}{" "}
                        {totalProducts === 1 ? "product" : "products"} shown.
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
}
