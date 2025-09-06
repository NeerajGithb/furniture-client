import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProductStore } from "@/stores/productStore";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | { _id: string }; // Handle both formats
}

interface Filters {
  categories: Category[];
  subcategories: Subcategory[];
  materials: string[];
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
}

interface FilterSidebarProps {
  filters: Filters;
  isMobile?: boolean;
  onClose?: () => void;
  isScrolled?: boolean;
}

const FilterSection = ({
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
  <div className="border-b border-gray-100 pb-3 mb-3">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-black transition-colors mb-2 group"
    >
      <span className="text-xs uppercase tracking-wide group-hover:tracking-wider transition-all">
        {title}
      </span>
      <ChevronDown
        className={`w-3.5 h-3.5 transform transition-all duration-200 ${
          isExpanded ? "rotate-180" : ""
        } group-hover:scale-110`}
      />
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// Simplified Dual Range Slider - No internal state
const DualRangeSlider = ({
  min,
  max,
  value,
  onChange,
  step = 1,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
}) => {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.max(
      min,
      Math.min(Number(e.target.value), value[1] - step)
    );
    onChange([newMin, value[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(
      value[0] + step,
      Math.min(Number(e.target.value), max)
    );
    onChange([value[0], newMax]);
  };

  const getPercentage = (val: number) => {
    if (max === min) return 0;
    return ((val - min) / (max - min)) * 100;
  };

  // Format price for display - hide 0 and max default values
  const formatPriceDisplay = (price: number, isMin: boolean) => {
    if (isMin && price === min) {
      return "0";
    }
    if (!isMin && price === max) {
      return "1,00,000";
    }
    return price.toLocaleString("en-IN");
  };

  return (
    <div className="space-y-4">
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>

        {/* Active track */}
        <div
          className="absolute h-1 bg-lime-500 rounded-full"
          style={{
            left: `${getPercentage(value[0])}%`,
            width: `${getPercentage(value[1]) - getPercentage(value[0])}%`,
          }}
        ></div>

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          step={step}
          onChange={handleMinChange}
          className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-lime-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          step={step}
          onChange={handleMaxChange}
          className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-lime-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>

      {/* Value labels */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 mb-1">Min. Price</span>
          <span className="font-bold text-gray-900">
            ₹ {formatPriceDisplay(value[0], true)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 mb-1">Max. Price</span>
          <span className="font-bold text-gray-900">
            ₹ {formatPriceDisplay(value[1], false)}
          </span>
        </div>
      </div>
    </div>
  );
};

const CategoryFilter = ({
  filters,
  isMobile = false,
  onClose,
}: FilterSidebarProps) => {
  console.log("CategoryFilter rendered");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 100;
          if (scrolled !== lastScrolled) {
            lastScrolled = scrolled;

            if (sidebarRef.current) {
              sidebarRef.current.classList.toggle("top-[50px]", scrolled);
              sidebarRef.current.classList.toggle("top-0", !scrolled);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get data from product store
  const { categories, subcategories, materials, priceRange } =
    useProductStore();

  // Expanded sections state - ALL COLLAPSED BY DEFAULT
  const [expandedSections, setExpandedSections] = useState({
    price: false,
    category: false,
    subcategory: false,
    material: false,
    availability: false,
    sort: false,
  });

  // Use store data if available, fallback to props
  const safeFilters = useMemo(
    () => ({
      categories:
        categories && categories.length > 0
          ? categories
          : filters?.categories || [],
      subcategories:
        subcategories && subcategories.length > 0
          ? subcategories
          : filters?.subcategories || [],
      materials:
        materials && materials.length > 0
          ? materials
          : filters?.materials || [],
      priceRange:
        priceRange && priceRange.maxPrice > 0
          ? priceRange
          : filters?.priceRange || { minPrice: 0, maxPrice: 100000 },
    }),
    [categories, subcategories, materials, priceRange, filters]
  );

  // Constants for price range with validation
  const DEFAULT_MIN_PRICE = safeFilters.priceRange.minPrice;
  const DEFAULT_MAX_PRICE = safeFilters.priceRange.maxPrice;
  const PRICE_STEP = 1;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get URL parameters directly from searchParams
  const urlParams = useMemo(
    () => ({
      selectedCategory: searchParams.get("category") || "",
      selectedSubcategory: searchParams.get("subcategory") || "",
      selectedMaterial: searchParams.get("material") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      inStockOnly: searchParams.get("inStock") === "true",
      onSaleOnly: searchParams.get("onSale") === "true",
      sortBy: searchParams.get("sort") || "newest",
    }),
    [searchParams]
  );

  // URL-first price values - read directly from URL
  const currentMinPrice = urlParams.minPrice
    ? parseInt(urlParams.minPrice)
    : DEFAULT_MIN_PRICE;
  const currentMaxPrice = urlParams.maxPrice
    ? parseInt(urlParams.maxPrice)
    : DEFAULT_MAX_PRICE;

  // Validate the URL values
  const validatedPriceRange: [number, number] = useMemo(() => {
    const min = Math.max(
      DEFAULT_MIN_PRICE,
      Math.min(currentMinPrice, DEFAULT_MAX_PRICE - PRICE_STEP)
    );
    const max = Math.max(
      min + PRICE_STEP,
      Math.min(currentMaxPrice, DEFAULT_MAX_PRICE)
    );
    return [min, max];
  }, [currentMinPrice, currentMaxPrice, DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]);

  // Validate and normalize price values
  const validatePriceRange = useCallback(
    (min: number, max: number): [number, number] => {
      const validMin = Math.max(
        DEFAULT_MIN_PRICE,
        Math.min(min, DEFAULT_MAX_PRICE - PRICE_STEP)
      );
      const validMax = Math.max(
        validMin + PRICE_STEP,
        Math.min(max, DEFAULT_MAX_PRICE)
      );
      return [validMin, validMax];
    },
    [DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]
  );

  // Simple updateFilters function
  const updateFilters = useCallback(
    (newFilters: Record<string, string | null>) => {
      try {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(newFilters).forEach(([key, value]) => {
          if (value && value !== "" && value !== "false") {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        });

        const newUrl = `/products?${params.toString()}`;
        router.push(newUrl);
      } catch (error) {
        console.error("Error updating filters:", error);
      }
    },
    [router, searchParams]
  );

  // Find selected category
  const selectedCategory = useMemo(() => {
    return safeFilters.categories.find(
      (cat) => cat.slug === urlParams.selectedCategory
    );
  }, [safeFilters.categories, urlParams.selectedCategory]);

  // Filter subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    if (!urlParams.selectedCategory || !selectedCategory) {
      return safeFilters.subcategories;
    }

    const categorySubcategories = safeFilters.subcategories.filter(
      (sub) =>
        (typeof sub.categoryId === "object" &&
          sub.categoryId._id === selectedCategory._id) ||
        (typeof sub.categoryId === "string" &&
          sub.categoryId === selectedCategory._id)
    );

    return categorySubcategories;
  }, [safeFilters.subcategories, urlParams.selectedCategory, selectedCategory]);

  // Filter change handlers
  const handleCategoryChange = useCallback(
    (categorySlug: string) => {
      updateFilters({
        category: categorySlug || null,
        subcategory: null, // Clear subcategory when category changes
        minPrice: null, // Reset price when category changes
        maxPrice: null, // Reset price when category changes
      });
    },
    [updateFilters]
  );

  const handleSubcategoryChange = useCallback(
    (subcategorySlug: string) => {
      updateFilters({
        subcategory: subcategorySlug || null,
        minPrice: null, // Reset price when subcategory changes
        maxPrice: null, // Reset price when subcategory changes
      });
    },
    [updateFilters]
  );

  const handleMaterialChange = useCallback(
    (material: string) => {
      updateFilters({
        material: material || null,
      });
    },
    [updateFilters]
  );

  // Direct URL update for price changes - no debouncing, no local state
  const handlePriceRangeChange = useCallback(
    (newRange: [number, number]) => {
      const [validMin, validMax] = validatePriceRange(newRange[0], newRange[1]);

      // Direct URL update
      const shouldUpdateMin = validMin !== DEFAULT_MIN_PRICE;
      const shouldUpdateMax = validMax !== DEFAULT_MAX_PRICE;

      updateFilters({
        minPrice: shouldUpdateMin ? validMin.toString() : null,
        maxPrice: shouldUpdateMax ? validMax.toString() : null,
      });
    },
    [updateFilters, validatePriceRange, DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]
  );

  const handleCheckboxChange = useCallback(
    (key: string, value: boolean) => {
      updateFilters({
        [key]: value ? "true" : null,
      });
    },
    [updateFilters]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      updateFilters({
        sort: value === "newest" ? null : value,
      });
    },
    [updateFilters]
  );

  const clearAllFilters = useCallback(() => {
    try {
      router.push("/products");
      onClose?.();
    } catch (error) {
      console.error("Error clearing filters:", error);
    }
  }, [router, onClose]);

  // Check if there are active filters
  const hasActiveFilters = useMemo(
    () =>
      !!(
        urlParams.selectedCategory ||
        urlParams.selectedSubcategory ||
        urlParams.selectedMaterial ||
        urlParams.minPrice ||
        urlParams.maxPrice ||
        urlParams.inStockOnly ||
        urlParams.onSaleOnly ||
        (urlParams.sortBy && urlParams.sortBy !== "newest")
      ),
    [urlParams]
  );

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A-Z" },
    { value: "name-desc", label: "Name: Z-A" },
    { value: "rating", label: "Customer Rating" },
    { value: "discount", label: "Highest Discount" },
  ];

  // Count active filters for mobile display
  const activeFiltersCount = useMemo(() => {
    return [
      urlParams.selectedCategory,
      urlParams.selectedSubcategory,
      urlParams.selectedMaterial,
      urlParams.minPrice,
      urlParams.maxPrice,
      urlParams.inStockOnly,
      urlParams.onSaleOnly,
      urlParams.sortBy !== "newest" ? urlParams.sortBy : null,
    ].filter(Boolean).length;
  }, [urlParams]);

  const sidebarContent = (
    <div className="p-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-700" />
          <h2 className="font-semibold text-lg text-gray-900">Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-full font-medium transition-all transform hover:scale-105"
            >
              Clear
            </button>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* PRICE RANGE FILTER */}
      <FilterSection
        title="Price Range"
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection("price")}
      >
        <div className="py-2">
          <DualRangeSlider
            min={DEFAULT_MIN_PRICE}
            max={DEFAULT_MAX_PRICE}
            value={validatedPriceRange}
            onChange={handlePriceRangeChange}
            step={PRICE_STEP}
          />
        </div>
      </FilterSection>

      {/* Category Filter */}
      <FilterSection
        title="Category"
        isExpanded={expandedSections.category}
        onToggle={() => toggleSection("category")}
      >
        <div className="space-y-1.5">
          <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name={`${isMobile ? "mobile-" : ""}category`}
              checked={!urlParams.selectedCategory}
              onChange={() => handleCategoryChange("")}
              className="mr-2.5 accent-black scale-90"
            />
            <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
              All Categories
            </span>
          </label>
          {safeFilters.categories.map((category) => (
            <label
              key={category._id}
              className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name={`${isMobile ? "mobile-" : ""}category`}
                checked={urlParams.selectedCategory === category.slug}
                onChange={() => handleCategoryChange(category.slug)}
                className="mr-2.5 accent-black scale-90"
              />
              <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Subcategory Filter */}
      {availableSubcategories.length > 0 && (
        <FilterSection
          title="Subcategory"
          isExpanded={expandedSections.subcategory}
          onToggle={() => toggleSection("subcategory")}
        >
          <div className="space-y-1.5">
            <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name={`${isMobile ? "mobile-" : ""}subcategory`}
                checked={!urlParams.selectedSubcategory}
                onChange={() => handleSubcategoryChange("")}
                className="mr-2.5 accent-black scale-90"
              />
              <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                All Subcategories
              </span>
            </label>
            {availableSubcategories.map((subcategory) => (
              <label
                key={subcategory._id}
                className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`${isMobile ? "mobile-" : ""}subcategory`}
                  checked={urlParams.selectedSubcategory === subcategory.slug}
                  onChange={() => handleSubcategoryChange(subcategory.slug)}
                  className="mr-2.5 accent-black scale-90"
                />
                <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                  {subcategory.name}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Material Filter */}
      {safeFilters.materials.length > 0 && (
        <FilterSection
          title="Material"
          isExpanded={expandedSections.material}
          onToggle={() => toggleSection("material")}
        >
          <div className="space-y-1.5">
            <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name={`${isMobile ? "mobile-" : ""}material`}
                checked={urlParams.selectedMaterial === ""}
                onChange={() => handleMaterialChange("")}
                className="mr-2.5 accent-black scale-90"
              />
              <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                All Materials
              </span>
            </label>
            {safeFilters.materials.slice(0, 8).map((material) => (
              <label
                key={material}
                className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`${isMobile ? "mobile-" : ""}material`}
                  checked={urlParams.selectedMaterial === material}
                  onChange={() => handleMaterialChange(material)}
                  className="mr-2.5 accent-black scale-90"
                />
                <span className="text-xs text-gray-700 group-hover:text-black transition-colors capitalize font-medium">
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
        <div className="space-y-1.5">
          <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={urlParams.inStockOnly}
              onChange={(e) =>
                handleCheckboxChange("inStock", e.target.checked)
              }
              className="mr-2.5 accent-black scale-90"
            />
            <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
              In Stock Only
            </span>
          </label>
          <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={urlParams.onSaleOnly}
              onChange={(e) => handleCheckboxChange("onSale", e.target.checked)}
              className="mr-2.5 accent-black scale-90"
            />
            <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
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
        <div className="space-y-1.5">
          {sortOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name={`${isMobile ? "mobile-" : ""}sort`}
                checked={urlParams.sortBy === option.value}
                onChange={() => handleSortChange(option.value)}
                className="mr-2.5 accent-black scale-90"
              />
              <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Apply Filters Button for Mobile */}
      {isMobile && (
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-black text-white rounded-sm text-sm font-medium hover:bg-gray-800 transition-all transform hover:scale-[1.02] shadow-lg"
        >
          Apply Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-white text-black px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="w-80 bg-white h-full overflow-y-auto shadow-2xl">
        {sidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hidden lg:block w-60 bg-white shadow-lg min-h-screen border-r border-gray-100"
    >
      <div
        ref={sidebarRef}
        className="sticky max-h-screen overflow-y-auto transition-all duration-300 top-0"
      >
        {sidebarContent}
      </div>
    </motion.aside>
  );
};

export default CategoryFilter;
