"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Filter,
  SlidersHorizontal,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/filter/FilterSidebar";
import { useProductStore } from "@/stores/productStore";
import GridSkeleton from "@/components/sceleton/GridSkeleton";
import EmptyState from "@/components/state/EmptyState";

// Cache stable selectors - this is the key fix
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


const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Stable filter parameters - memoized
  const filterParams = useMemo(
    () => ({
      selectedCategory: searchParams.get("c") || "",
      selectedSubcategory: searchParams.get("sc") || "",
      selectedMaterial: searchParams.get("m") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      inStockOnly: searchParams.get("inStock") === "true",
      onSaleOnly: searchParams.get("onSale") === "true",
      sortBy: searchParams.get("sort") || "newest",
    }),
    [searchParams]
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

    // Build and fetch with new params
    const params = new URLSearchParams(searchParams.toString());
    fetchProducts(params.toString(), true);
  }, [
    searchParams.toString(),
    isInitialized,
    fetchProducts,
    resetProductState,
  ]);

  // Load more function with debouncing and better state management
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

    // Use current searchParams directly to maintain filter context
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nextPage.toString());
    params.set("limit", "20");

    try {
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
    products.length,
    loadingProducts,
    loadingMore,
    currentPage,
    searchParams,
    fetchProducts,
  ]);

  // Set load more ref
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Intersection Observer with better conditions and throttling
  useEffect(() => {
    const target = observerTarget.current;
    if (
      !target ||
      loadingProducts ||
      !hasMore ||
      products.length === 0 ||
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
          // Add throttling to prevent rapid calls
          setTimeout(() => {
            if (loadMoreRef.current && !isLoadingMoreRef.current) {
              loadMoreRef.current();
            }
          }, 500);
        }
      },
      {
        threshold: 0.1,
        // Trigger when element is 200px from viewport
        rootMargin: "200px",
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingProducts, loadingMore, products.length]);

  // Stable navigation functions
  const clearAllFilters = useCallback(() => {
    router.push("/products");
  }, [router]);

  const removeFilter = useCallback(
    (filterKey: string) => {
      const params = new URLSearchParams(searchParams);

      if (filterKey === "c") {
        params.delete("c");
        params.delete("sc");
        params.delete("minPrice");
        params.delete("maxPrice");
      } else if (filterKey === "sc") {
        params.delete("sc");
        params.delete("minPrice");
        params.delete("maxPrice");
      } else if (filterKey === "price") {
        params.delete("minPrice");
        params.delete("maxPrice");
      } else {
        params.delete(filterKey);
      }

      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Helper functions - memoized
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
                {/* Results Header - Fixed Height */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative flex items-center mb-2"
                >
                  {/* Results Count - Always Centered */}
                  <div className="w-full flex justify-center">
                    {error ? (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-full px-4 py-2 shadow-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">
                          Error loading products
                        </span>
                      </div>
                    ) : !loadingProducts && products?.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="text-center"
                      >
                        <h1 className="text-sm sm:text-base font-semibold text-gray-900">
                          Showing{" "}
                          <span className="font-bold text-gray-900">
                            {(currentPage - 1) * 20 + 1}
                          </span>{" "}
                          –{" "}
                          <span className="font-bold text-gray-900">
                            {Math.min(currentPage * 20, totalProducts)}
                          </span>{" "}
                          of{" "}
                          <span className="font-bold text-gray-900">
                            {totalProducts?.toLocaleString() || 0}
                          </span>{" "}
                          {totalProducts === 1 ? "product" : "products"}
                        </h1>
                      </motion.div>
                    ) : loadingProducts ? (
                      <div className="text-center">
                        <div className="h-6 w-56 bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    ) : (
                      <div className="h-6"></div>
                    )}
                  </div>

                  {/* Mobile Filter Button - Absolute positioned */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-sm font-medium"
                  >
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                      <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[18px] h-[18px] flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </motion.button>
                </motion.div>
              </div>

              {/* Active Filters - Variable Height */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-600 flex items-center gap-2 mr-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Active Filters:
                  </span>

                  {filterParams.selectedCategory && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full font-medium shadow-sm">
                      {findCategoryName(filterParams.selectedCategory)}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("c")}
                      />
                    </span>
                  )}

                  {filterParams.selectedSubcategory && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full font-medium shadow-sm">
                      {findSubcategoryName(filterParams.selectedSubcategory)}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("sc")}
                      />
                    </span>
                  )}

                  {filterParams.selectedMaterial && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full font-medium shadow-sm">
                      {filterParams.selectedMaterial}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("material")}
                      />
                    </span>
                  )}

                  {(filterParams.minPrice || filterParams.maxPrice) && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-full font-medium shadow-sm">
                      ₹{filterParams.minPrice || 0} - ₹
                      {filterParams.maxPrice || "∞"}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("price")}
                      />
                    </span>
                  )}

                  {filterParams.inStockOnly && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-full font-medium shadow-sm">
                      In Stock Only
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("inStock")}
                      />
                    </span>
                  )}

                  {filterParams.onSaleOnly && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-full font-medium shadow-sm">
                      On Sale Only
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("onSale")}
                      />
                    </span>
                  )}

                  {filterParams.sortBy !== "newest" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full font-medium shadow-sm">
                      {findSortLabel(filterParams.sortBy)}
                      <X
                        className="w-3.5 h-3.5 cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() => removeFilter("sort")}
                      />
                    </span>
                  )}

                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-800 font-medium underline ml-3 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </motion.div>
              )}

              {/* Content Area - Consistent spacing */}
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
                <div ref={observerTarget} className="h-4 w-full -mt-8" />
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
                    className="text-center py-12 mt-8"
                  >
                    <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm max-w-md mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-gray-900 font-semibold text-xl mb-2">
                        That's everything!
                      </h3>
                      <p className="text-gray-600 text-base">
                        You've viewed all{" "}
                        <span className="font-semibold text-blue-600">
                          {totalProducts?.toLocaleString() || 0}
                        </span>{" "}
                        {totalProducts === 1 ? "product" : "products"} in this
                        collection.
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

export default ProductsPage;
