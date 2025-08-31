"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  X,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
} from "lucide-react";
import ProductGrid from "@/components/product/ProductGrid";
import { Product } from '@/types/Product';
import { fetchWithCredentials } from "@/utils/fetchWithCredentials";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Filters {
  subcategories: Category[];
  materials: string[];
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
}

const FilterSection = memo(({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-100 pb-4 mb-4">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full text-left font-semibold text-gray-900 hover:text-black transition-colors mb-3"
    >
      <span className="text-sm uppercase tracking-wide">{title}</span>
      <ChevronDown
        className={`w-4 h-4 transform transition-transform ${
          isExpanded ? "rotate-180" : ""
        }`}
      />
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

FilterSection.displayName = "FilterSection";

// Memoized Sidebar Component
const FilterSidebar = memo(({ 
  filters, 
  selectedSubcategory,
  setSelectedSubcategory,
  selectedMaterial,
  setSelectedMaterial,
  priceRange,
  setPriceRange,
  inStockOnly,
  setInStockOnly,
  onSaleOnly,
  setOnSaleOnly,
  sortBy,
  setSortBy,
  hasActiveFilters,
  clearAllFilters,
  isScrolled,
  expandedSections,
  setExpandedSections
}: {
  filters: Filters;
  selectedSubcategory: string;
  setSelectedSubcategory: (value: string) => void;
  selectedMaterial: string;
  setSelectedMaterial: (value: string) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (value: { min: string; max: string } | ((prev: { min: string; max: string }) => { min: string; max: string })) => void;
  inStockOnly: boolean;
  setInStockOnly: (value: boolean) => void;
  onSaleOnly: boolean;
  setOnSaleOnly: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  isScrolled: boolean;
  expandedSections: { [key: string]: boolean };
  setExpandedSections: (value: any) => void;
}) => {
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev: any) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, [setExpandedSections]);

  return (
    <motion.aside
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:block w-64 bg-white shadow-sm min-h-screen"
    >
      <div 
        className={`sticky max-h-screen overflow-y-auto transition-all duration-300 ${
          isScrolled ? 'top-[70px]' : 'top-0'
        }`}
      >
        <div className="p-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-600" />
              <h2 className="font-bold text-lg text-gray-900">Filters</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Subcategory Filter */}
          {filters && filters.subcategories && filters.subcategories.length > 0 && (
            <FilterSection
              title="Subcategories"
              isExpanded={expandedSections.subcategory}
              onToggle={() => toggleSection("subcategory")}
            >
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="subcategory"
                    checked={selectedSubcategory === ""}
                    onChange={() => setSelectedSubcategory("")}
                    className="mr-3 accent-black"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                    All Subcategories
                  </span>
                </label>
                {filters.subcategories.map((subcategory) => (
                  <label
                    key={subcategory._id || subcategory.slug}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="subcategory"
                      checked={selectedSubcategory === subcategory.slug}
                      onChange={() => setSelectedSubcategory(subcategory.slug)}
                      className="mr-3 accent-black"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                      {subcategory.name || subcategory.slug}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Price Range Filter */}
          <FilterSection
            title="Price Range"
            isExpanded={expandedSections.price}
            onToggle={() => toggleSection("price")}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      min: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({
                      ...prev,
                      max: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </FilterSection>

          {/* Material Filter */}
          {filters && filters.materials && filters.materials.length > 0 && (
            <FilterSection
              title="Material"
              isExpanded={expandedSections.material}
              onToggle={() => toggleSection("material")}
            >
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="material"
                    checked={selectedMaterial === ""}
                    onChange={() => setSelectedMaterial("")}
                    className="mr-3 accent-black"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                    All Materials
                  </span>
                </label>
                {filters.materials.slice(0, 8).map((material) => (
                  <label
                    key={material}
                    className="flex items-center cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="material"
                      checked={selectedMaterial === material}
                      onChange={() => setSelectedMaterial(material)}
                      className="mr-3 accent-black"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-black transition-colors capitalize">
                      {material}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Availability & Sale Filter */}
          <FilterSection
            title="Availability"
            isExpanded={expandedSections.availability}
            onToggle={() => toggleSection("availability")}
          >
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="mr-3 accent-black"
                />
                <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                  In Stock Only
                </span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(e) => setOnSaleOnly(e.target.checked)}
                  className="mr-3 accent-black"
                />
                <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                  On Sale Only
                </span>
              </label>
            </div>
          </FilterSection>

          {/* Sort By Filter */}
          <FilterSection
            title="Sort By"
            isExpanded={expandedSections.sort}
            onToggle={() => toggleSection("sort")}
          >
            <div className="space-y-2">
              {[
                { value: "newest", label: "Newest First" },
                { value: "price-low", label: "Price: Low to High" },
                { value: "price-high", label: "Price: High to Low" },
                { value: "name-asc", label: "Name: A-Z" },
                { value: "name-desc", label: "Name: Z-A" },
                { value: "rating", label: "Customer Rating" },
                { value: "discount", label: "Highest Discount" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="sort"
                    checked={sortBy === option.value}
                    onChange={() => setSortBy(option.value)}
                    className="mr-3 accent-black"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>
    </motion.aside>
  );
});

FilterSidebar.displayName = "FilterSidebar";

const CategoryProductsPage = () => {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subcategories: [],
    materials: [],
    priceRange: { minPrice: 0, maxPrice: 100000 },
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filter states
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // UI states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    subcategory: true,
    price: true,
    material: true,
    availability: true,
    sort: true,
  });

  // Infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Scroll state for sidebar
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch category details first
  const fetchCategoryDetails = useCallback(async () => {
    try {
      const response = await fetchWithCredentials(`/api/categories/${categorySlug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Category not found");
        }
        throw new Error("Failed to fetch category");
      }
      const categoryData = await response.json();
      setCategory(categoryData);
    } catch (err) {
      console.error('Error fetching category:', err);
    }
  }, [categorySlug, router]);

  // Fetch products with filters
  const fetchCategoryProducts = useCallback(
    async (page = 1, reset = false) => {
      try {
        if (page === 1) {
          setLoading(true);
          setError(null);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 300));
          setLoadingMore(true);
        }

        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", "20");
        
        // Add category filter - this is the key change
        params.append("category", categorySlug);

        // Add other filters
        if (selectedSubcategory) params.append("subcategory", selectedSubcategory);
        if (selectedMaterial) params.append("material", selectedMaterial);
        if (priceRange.min) params.append("minPrice", priceRange.min);
        if (priceRange.max) params.append("maxPrice", priceRange.max);
        if (inStockOnly) params.append("inStock", "true");
        if (onSaleOnly) params.append("onSale", "true");
        params.append("sort", sortBy);

        // Use the general products API with category filter
        const response = await fetchWithCredentials(`/api/products?${params}`);
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();

        if (reset || page === 1) {
          setProducts(data.products || []);
          // Set filters if available in response
          if (data.filters) {
            setFilters(prev => ({
              subcategories: data.filters.subcategories || prev.subcategories || [],
              materials: data.filters.materials || prev.materials || [],
              priceRange: data.filters.priceRange || prev.priceRange || { minPrice: 0, maxPrice: 100000 },
            }));
          }
        } else {
          setProducts((prev) => [...prev, ...(data.products || [])]);
        }

        setTotalProducts(data.pagination?.total || 0);
        setHasMore(page < (data.pagination?.pages || 0));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      categorySlug,
      selectedSubcategory, 
      selectedMaterial, 
      priceRange.min, 
      priceRange.max, 
      inStockOnly, 
      onSaleOnly, 
      sortBy
    ]
  );

  // Fetch filters data separately if needed
  const fetchFilters = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append("category", categorySlug);
      params.append("filtersOnly", "true");
      
      const response = await fetchWithCredentials(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.filters) {
          setFilters(prev => ({
            subcategories: data.filters.subcategories || [],
            materials: data.filters.materials || [],
            priceRange: data.filters.priceRange || { minPrice: 0, maxPrice: 100000 },
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  }, [categorySlug]);

  // Initial load
  useEffect(() => {
    if (categorySlug) {
      setCurrentPage(1);
      fetchCategoryDetails();
      fetchFilters();
      fetchCategoryProducts(1, true);
    }
  }, [categorySlug, fetchCategoryDetails, fetchFilters, fetchCategoryProducts]);

  // Re-fetch when filters change
  useEffect(() => {
    if (categorySlug) {
      setCurrentPage(1);
      fetchCategoryProducts(1, true);
    }
  }, [
    categorySlug,
    selectedSubcategory,
    selectedMaterial,
    priceRange.min,
    priceRange.max,
    inStockOnly,
    onSaleOnly,
    sortBy,
    fetchCategoryProducts
  ]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchCategoryProducts(nextPage, false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, currentPage, fetchCategoryProducts]);

  // Optimized scroll listener for sidebar
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          setTimeout(() => {
            setIsScrolled(scrollTop > 130);
          }, 600);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedSubcategory("");
    setSelectedMaterial("");
    setPriceRange({ min: "", max: "" });
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
  }, []);

  const hasActiveFilters =
    !!selectedSubcategory ||
    !!selectedMaterial ||
    !!priceRange.min ||
    !!priceRange.max ||
    !!inStockOnly ||
    !!onSaleOnly ||
    sortBy !== "newest";

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A-Z" },
    { value: "name-desc", label: "Name: Z-A" },
    { value: "rating", label: "Customer Rating" },
    { value: "discount", label: "Highest Discount" },
  ];

  // Show loading for initial load
  if (loading && !products.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !products.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button 
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
          >
            Go to All Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex">
          {/* Left Sidebar Filters - Desktop */}
          <FilterSidebar
            filters={filters}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={setSelectedSubcategory}
            selectedMaterial={selectedMaterial}
            setSelectedMaterial={setSelectedMaterial}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            onSaleOnly={onSaleOnly}
            setOnSaleOnly={setOnSaleOnly}
            sortBy={sortBy}
            setSortBy={setSortBy}
            hasActiveFilters={hasActiveFilters}
            clearAllFilters={clearAllFilters}
            isScrolled={isScrolled}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
          />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              {/* Category Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                {/* Back to Products Link */}
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => router.push('/products')}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">All Products</span>
                  </button>
                </div>

                {/* Category Title and Description */}
                {category && (
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {category.name}
                    </h1>
                    {category.description && (
                      <p className="text-gray-600 text-lg max-w-2xl">
                        {category.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Results Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-lg text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-black">
                      {products.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-black">
                      {totalProducts.toLocaleString()}
                    </span>{" "}
                    {category ? `${category.name.toLowerCase()} products` : 'results'}
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 transition-colors rounded-sm"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="font-medium text-sm">Filters</span>
                  </button>
                </div>
              </motion.div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-white border border-gray-200 rounded-sm shadow-sm"
                >
                  <span className="text-sm font-semibold text-gray-700 mr-2">
                    Active:
                  </span>
                  {selectedSubcategory && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-full">
                      Subcategory:{" "}
                      {
                        filters && filters.subcategories && filters.subcategories.find
                          ? filters.subcategories.find((c) => c.slug === selectedSubcategory)?.name
                          : selectedSubcategory
                      }
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => setSelectedSubcategory("")}
                      />
                    </span>
                  )}
                  {selectedMaterial && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-full">
                      Material: {selectedMaterial}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => setSelectedMaterial("")}
                      />
                    </span>
                  )}
                  {(priceRange.min || priceRange.max) && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-full">
                      Price: ₹{priceRange.min || 0} - ₹{priceRange.max || "∞"}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => setPriceRange({ min: "", max: "" })}
                      />
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-full">
                      In Stock Only
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => setInStockOnly(false)}
                      />
                    </span>
                  )}
                  {onSaleOnly && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-full">
                      On Sale Only
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => setOnSaleOnly(false)}
                      />
                    </span>
                  )}
                  {sortBy !== "newest" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-sm rounded-full">
                      Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-200"
                        onClick={() => setSortBy("newest")}
                      />
                    </span>
                  )}
                </motion.div>
              )}

              {/* Products Grid */}
              <div className="mb-8">
                <ProductGrid
                  products={products}
                  loading={loading}
                  error={error}
                  loadingMore={loadingMore}
                />
              </div>

              {/* Infinite Scroll Observer Target */}
              <div ref={observerTarget} className="h-32" />

              {/* No More Products Message */}
              {!hasMore && products.length > 0 && !loadingMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="bg-white rounded-sm p-8 border border-gray-200 shadow-sm">
                    <div className="text-gray-600 font-medium text-lg mb-2">
                      🎉 You've seen all {category?.name.toLowerCase()} products!
                    </div>
                    <div className="text-gray-500 text-sm">
                      That's all {totalProducts.toLocaleString()} products in this category
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
              className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.3 }}
                className="w-80 bg-white h-full overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Mobile Filter Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5" />
                      <h2 className="font-semibold text-lg">Filters</h2>
                    </div>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Clear All Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        clearAllFilters();
                        setShowMobileFilters(false);
                      }}
                      className="w-full mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-sm font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}

                  {/* Mobile Filter Sections */}
                  {filters && filters.subcategories && filters.subcategories.length > 0 && (
                    <FilterSection
                      title="Subcategories"
                      isExpanded={expandedSections.subcategory}
                      onToggle={() => setExpandedSections((prev: any) => ({ ...prev, subcategory: !prev.subcategory }))}
                    >
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="mobile-subcategory"
                            checked={selectedSubcategory === ""}
                            onChange={() => setSelectedSubcategory("")}
                            className="mr-3 accent-black"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                            All Subcategories
                          </span>
                        </label>
                        {filters.subcategories.map((subcategory) => (
                          <label
                            key={subcategory._id || subcategory.slug}
                            className="flex items-center cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="mobile-subcategory"
                              checked={selectedSubcategory === subcategory.slug}
                              onChange={() => setSelectedSubcategory(subcategory.slug)}
                              className="mr-3 accent-black"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                              {subcategory.name || subcategory.slug}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>
                  )}

                  <FilterSection
                    title="Price Range"
                    isExpanded={expandedSections.price}
                    onToggle={() => setExpandedSections((prev: any) => ({ ...prev, price: !prev.price }))}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange((prev) => ({
                              ...prev,
                              min: e.target.value,
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange((prev) => ({
                              ...prev,
                              max: e.target.value,
                            }))
                          }
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {filters && filters.materials && filters.materials.length > 0 && (
                    <FilterSection
                      title="Material"
                      isExpanded={expandedSections.material}
                      onToggle={() => setExpandedSections((prev: any) => ({ ...prev, material: !prev.material }))}
                    >
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer group">
                          <input
                            type="radio"
                            name="mobile-material"
                            checked={selectedMaterial === ""}
                            onChange={() => setSelectedMaterial("")}
                            className="mr-3 accent-black"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                            All Materials
                          </span>
                        </label>
                        {filters.materials.slice(0, 8).map((material) => (
                          <label
                            key={material}
                            className="flex items-center cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name="mobile-material"
                              checked={selectedMaterial === material}
                              onChange={() => setSelectedMaterial(material)}
                              className="mr-3 accent-black"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-black transition-colors capitalize">
                              {material}
                            </span>
                          </label>
                        ))}
                      </div>
                    </FilterSection>
                  )}

                  <FilterSection
                    title="Availability"
                    isExpanded={expandedSections.availability}
                    onToggle={() => setExpandedSections((prev: any) => ({ ...prev, availability: !prev.availability }))}
                  >
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={inStockOnly}
                          onChange={(e) => setInStockOnly(e.target.checked)}
                          className="mr-3 accent-black"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                          In Stock Only
                        </span>
                      </label>
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={onSaleOnly}
                          onChange={(e) => setOnSaleOnly(e.target.checked)}
                          className="mr-3 accent-black"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                          On Sale Only
                        </span>
                      </label>
                    </div>
                  </FilterSection>

                  <FilterSection
                    title="Sort By"
                    isExpanded={expandedSections.sort}
                    onToggle={() => setExpandedSections((prev: any) => ({ ...prev, sort: !prev.sort }))}
                  >
                    <div className="space-y-2">
                      {sortOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name="mobile-sort"
                            checked={sortBy === option.value}
                            onChange={() => setSortBy(option.value)}
                            className="mr-3 accent-black"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-black transition-colors">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Apply Filters Button */}
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full mt-6 px-6 py-3 bg-black text-white rounded-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CategoryProductsPage;