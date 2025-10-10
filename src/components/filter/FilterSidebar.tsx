import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useProductStore } from '@/stores/productStore';
interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: string | { _id: string };
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
interface DualRangeSliderRef {
  resetToDefault: () => void;
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
          isExpanded ? 'rotate-180' : ''
        } group-hover:scale-110`}
      />
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const DualRangeSlider = forwardRef<
  DualRangeSliderRef,
  {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
  }
>(({ min, max, value, onChange, step = 1 }, ref) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    resetToDefault: () => {
      setLocalValue([min, max]);
      onChange([min, max]);
    },
  }));

  const applyChanges = useCallback(() => {
    onChange(localValue);
    setIsDragging(false);
  }, [localValue, onChange]);

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Math.max(min, Math.min(Number(e.target.value), localValue[1] - step));
      setLocalValue([newMin, localValue[1]]);
    },
    [min, localValue, step],
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Math.max(localValue[0] + step, Math.min(Number(e.target.value), max));
      setLocalValue([localValue[0], newMax]);
    },
    [max, localValue, step],
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      applyChanges();
    }
  }, [applyChanges, isDragging]);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      applyChanges();
    }
  }, [applyChanges, isDragging]);

  const getPercentage = useCallback(
    (val: number) => {
      if (max === min) return 0;
      return ((val - min) / (max - min)) * 100;
    },
    [min, max],
  );

  const formatPriceDisplay = useCallback((price: number) => {
    return price.toLocaleString('en-IN');
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>

        {/* Active range */}
        <div
          className="absolute h-1 bg-lime-500 rounded-full transition-all duration-75 ease-out"
          style={{
            left: `${getPercentage(localValue[0])}%`,
            width: `${getPercentage(localValue[1]) - getPercentage(localValue[0])}%`,
          }}
        />

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[0]}
          step={step}
          onChange={handleMinChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-lime-500 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:pointer-events-auto 
            [&::-webkit-slider-thumb]:cursor-grab 
            [&::-webkit-slider-thumb]:shadow-md 
            [&::-webkit-slider-thumb]:hover:shadow-lg
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-lime-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:shadow-md"
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={localValue[1]}
          step={step}
          onChange={handleMaxChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-4 
            [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border-2 
            [&::-webkit-slider-thumb]:border-lime-500 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:pointer-events-auto 
            [&::-webkit-slider-thumb]:cursor-grab 
            [&::-webkit-slider-thumb]:shadow-md 
            [&::-webkit-slider-thumb]:hover:shadow-lg
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:transition-shadow
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-lime-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:shadow-md"
        />
      </div>

      {/* Price display */}
      <div className="flex justify-between items-center text-sm">
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500 mb-1">Min. Price</span>
          <span className="font-bold text-gray-900">₹ {formatPriceDisplay(localValue[0])}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500 mb-1">Max. Price</span>
          <span className="font-bold text-gray-900">₹ {formatPriceDisplay(localValue[1])}</span>
        </div>
      </div>
    </div>
  );
});
DualRangeSlider.displayName = 'DualRangeSlider';

const FilterSidebar = ({ filters, isMobile = false, onClose }: FilterSidebarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const sliderRef = useRef<DualRangeSliderRef | null>(null);

  const currentSlug = pathname.slice(1);

  useEffect(() => {
    let ticking = false;
    let lastScrolled = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 80;
          if (scrolled !== lastScrolled) {
            lastScrolled = scrolled;
            if (sidebarRef.current) {
              sidebarRef.current.classList.toggle('top-[50px]', scrolled);
              sidebarRef.current.classList.toggle('top-0', !scrolled);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { categories, subcategories, materials, priceRange } = useProductStore();

  const [expandedSections, setExpandedSections] = useState(() => {
    const defaultExpanded = isMobile;

    return {
      priceSort: defaultExpanded,
      priceRange: defaultExpanded,
      quickPriceRanges: defaultExpanded,
      material: defaultExpanded,
      discount: defaultExpanded,
      category: defaultExpanded,
      subcategory: defaultExpanded,
      availability: defaultExpanded,
    };
  });

  const isValidCategory = (c: any): c is Category =>
    c && typeof c === 'object' && typeof c._id === 'string' && typeof c.slug === 'string';

  const isValidSubcategory = (s: any): s is Subcategory =>
    s &&
    typeof s === 'object' &&
    typeof s._id === 'string' &&
    typeof s.slug === 'string' &&
    (typeof s.categoryId === 'string' ||
      (typeof s.categoryId === 'object' &&
        s.categoryId !== null &&
        typeof s.categoryId._id === 'string'));

  const safeFilters = useMemo(
    () => ({
      categories:
        Array.isArray(categories) && categories.length > 0
          ? categories.filter(isValidCategory)
          : filters?.categories.filter(isValidCategory) || [],
      subcategories:
        Array.isArray(subcategories) && subcategories.length > 0
          ? subcategories.filter(isValidSubcategory)
          : filters?.subcategories.filter(isValidSubcategory) || [],
      materials:
        Array.isArray(materials) && materials.length > 0
          ? materials.filter((m) => typeof m === 'string')
          : filters?.materials.filter((m) => typeof m === 'string') || [],
      priceRange:
        priceRange && priceRange.maxPrice > 0
          ? priceRange
          : filters?.priceRange || { minPrice: 0, maxPrice: 100000 },
    }),
    [categories, subcategories, materials, priceRange, filters],
  );

  const slugAnalysis = useMemo(() => {
    if (!currentSlug || currentSlug === 'products') {
      return { type: null, data: null, parentCategory: null };
    }

    const matchedCategory = safeFilters.categories.find((cat) => cat.slug === currentSlug);
    if (matchedCategory) {
      return { type: 'category', data: matchedCategory, parentCategory: null };
    }

    const matchedSubcategory = safeFilters.subcategories.find((sub) => sub.slug === currentSlug);
    if (matchedSubcategory) {
      const parentCategory = safeFilters.categories.find((cat) => {
        const categoryId =
          typeof matchedSubcategory.categoryId === 'object'
            ? matchedSubcategory.categoryId._id
            : matchedSubcategory.categoryId;
        return cat._id === categoryId;
      });
      return {
        type: 'subcategory',
        data: matchedSubcategory,
        parentCategory,
      };
    }

    return { type: null, data: null, parentCategory: null };
  }, [currentSlug, safeFilters.categories, safeFilters.subcategories]);

  const DEFAULT_MIN_PRICE = safeFilters.priceRange.minPrice;
  const DEFAULT_MAX_PRICE = safeFilters.priceRange.maxPrice;
  const PRICE_STEP = 1;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const urlParams = useMemo(() => {
    let selectedCategory = '';
    let selectedSubcategory = '';

    if (slugAnalysis.type === 'category') {
      selectedCategory = currentSlug;
      selectedSubcategory = searchParams.get('subcategory') || '';
    } else if (slugAnalysis.type === 'subcategory') {
      selectedCategory = slugAnalysis.parentCategory?.slug || '';
      selectedSubcategory = currentSlug;
    }

    return {
      selectedCategory,
      selectedSubcategory,
      selectedMaterial: searchParams.get('material') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStockOnly: searchParams.get('inStock') === 'true',
      onSaleOnly: searchParams.get('onSale') === 'true',
      sortBy: searchParams.get('sort') || 'newest',
      discountRange: searchParams.get('discount') || '',
    };
  }, [searchParams, currentSlug, slugAnalysis]);

  const currentMinPrice = urlParams.minPrice ? parseInt(urlParams.minPrice) : DEFAULT_MIN_PRICE;
  const currentMaxPrice = urlParams.maxPrice ? parseInt(urlParams.maxPrice) : DEFAULT_MAX_PRICE;

  const validatedPriceRange: [number, number] = useMemo(() => {
    const min = Math.max(
      DEFAULT_MIN_PRICE,
      Math.min(currentMinPrice, DEFAULT_MAX_PRICE - PRICE_STEP),
    );
    const max = Math.max(min + PRICE_STEP, Math.min(currentMaxPrice, DEFAULT_MAX_PRICE));
    return [min, max];
  }, [currentMinPrice, currentMaxPrice, DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]);

  const validatePriceRange = useCallback(
    (min: number, max: number): [number, number] => {
      const validMin = Math.max(DEFAULT_MIN_PRICE, Math.min(min, DEFAULT_MAX_PRICE - PRICE_STEP));
      const validMax = Math.max(validMin + PRICE_STEP, Math.min(max, DEFAULT_MAX_PRICE));
      return [validMin, validMax];
    },
    [DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE],
  );

  const updateFilters = useCallback(
    (newFilters: Record<string, string | null>) => {
      try {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(newFilters).forEach(([key, value]) => {
          if (key === 'category' || key === 'subcategory') {
            return;
          }

          if (value && value !== '' && value !== 'false') {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        });

        const newUrl = `/${currentSlug}?${params.toString()}`;
        router.push(newUrl);
      } catch (error) {
        console.error('Error updating filters:', error);
      }
    },
    [router, searchParams, currentSlug],
  );

  const selectedCategory = useMemo(() => {
    return safeFilters.categories.find((cat) => cat.slug === urlParams.selectedCategory);
  }, [safeFilters.categories, urlParams.selectedCategory]);

  const availableSubcategories = useMemo(() => {
    if (!urlParams.selectedCategory) {
      return [];
    }

    const currentCategory = safeFilters.categories.find(
      (cat) => cat.slug === urlParams.selectedCategory,
    );

    if (!currentCategory) {
      return [];
    }

    return safeFilters.subcategories.filter((sub) => {
      const categoryId = typeof sub.categoryId === 'object' ? sub.categoryId._id : sub.categoryId;
      return categoryId === currentCategory._id;
    });
  }, [safeFilters.subcategories, safeFilters.categories, urlParams.selectedCategory]);

  const handleCategoryChange = useCallback(
    (categorySlug: string) => {
      if (!categorySlug) {
        return;
      } else {
        router.push(`/${categorySlug}`);
      }
    },
    [router],
  );
  const handleSubcategoryChange = useCallback(
    (subcategorySlug: string) => {
      if (!subcategorySlug) {
        return;
      } else {
        router.push(`/${subcategorySlug}`);
      }
    },
    [router],
  );

  const handleMaterialChange = useCallback(
    (material: string) => {
      updateFilters({
        material: material || null,
      });

      if (isMobile && onClose) {
        setTimeout(() => onClose(), 150);
      }
    },
    [updateFilters, isMobile, onClose],
  );

  const handlePriceRangeChange = useCallback(
    (newRange: [number, number]) => {
      const [validMin, validMax] = validatePriceRange(newRange[0], newRange[1]);

      const shouldUpdateMin = validMin !== DEFAULT_MIN_PRICE;
      const shouldUpdateMax = validMax !== DEFAULT_MAX_PRICE;

      updateFilters({
        minPrice: shouldUpdateMin ? validMin.toString() : null,
        maxPrice: shouldUpdateMax ? validMax.toString() : null,
      });

      if (isMobile && onClose) {
        setTimeout(() => onClose(), 500);
      }
    },
    [updateFilters, validatePriceRange, DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE, isMobile, onClose],
  );

  const handleCheckboxChange = useCallback(
    (key: string, value: boolean) => {
      updateFilters({
        [key]: value ? 'true' : null,
      });

      if (isMobile && onClose) {
        setTimeout(() => onClose(), 150);
      }
    },
    [updateFilters, isMobile, onClose],
  );

  const handleSortChange = useCallback(
    (value: string) => {
      updateFilters({
        sort: value === 'newest' ? null : value,
      });

      if (isMobile && onClose) {
        setTimeout(() => onClose(), 150);
      }
    },
    [updateFilters, isMobile, onClose],
  );

  const handleQuickPriceRangeChange = useCallback(
    (range: string) => {
      if (!range) {
        updateFilters({
          minPrice: null,
          maxPrice: null,
        });
      } else {
        const [min, max] = range.split('-').map(Number);
        updateFilters({
          minPrice: min !== DEFAULT_MIN_PRICE ? min.toString() : null,
          maxPrice: max !== DEFAULT_MAX_PRICE ? max.toString() : null,
        });
      }

      if (isMobile && onClose) {
        setTimeout(() => onClose(), 150);
      }
    },
    [updateFilters, DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE, isMobile, onClose],
  );

  const handleDiscountChange = useCallback(
    (discount: string) => {
      updateFilters({
        discount: discount || null,
      });

      if (isMobile && onClose) {
        setTimeout(() => onClose(), 150);
      }
    },
    [updateFilters, isMobile, onClose],
  );

  const clearAllFilters = useCallback(() => {
    try {
      sliderRef.current?.resetToDefault();

      const params = new URLSearchParams(searchParams.toString());

      const filterParamsToRemove = [
        'material',
        'minPrice',
        'maxPrice',
        'inStock',
        'onSale',
        'sort',
        'discount',
        'page',
        'limit',
        'category',
        'subcategory',
      ];

      filterParamsToRemove.forEach((param) => {
        params.delete(param);
      });

      const queryString = params.toString();
      const newUrl = `${pathname}${queryString ? `?${queryString}` : ''}`;

      router.push(newUrl);
      onClose?.();
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  }, [router, searchParams, pathname, onClose]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      (urlParams.selectedSubcategory && slugAnalysis.type === 'category') ||
      urlParams.selectedMaterial ||
      urlParams.minPrice ||
      urlParams.maxPrice ||
      urlParams.inStockOnly ||
      urlParams.onSaleOnly ||
      urlParams.discountRange ||
      (urlParams.sortBy && urlParams.sortBy !== 'newest')
    );
  }, [urlParams, slugAnalysis.type]);

  const sortOptions = [
    { value: 'newest', label: 'Latest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
  ];

  const quickPriceRanges = [
    { value: '', label: 'All Prices' },
    { value: `${DEFAULT_MIN_PRICE}-9000`, label: 'Under ₹9,000' },
    { value: '10000-19999', label: '₹10,000 - ₹19,999' },
    { value: '20000-39999', label: '₹20,000 - ₹39,999' },
    { value: '40000-59999', label: '₹40,000 - ₹59,999' },
    { value: `60000-${DEFAULT_MAX_PRICE}`, label: 'Above ₹60,000' },
  ];

  const discountOptions = [
    { value: '', label: 'All Products' },
    { value: '10', label: '10% or more' },
    { value: '25', label: '25% or more' },
    { value: '50', label: '50% or more' },
    { value: '70', label: '70% or more' },
  ];

  const getSelectedQuickPriceRange = () => {
    if (!urlParams.minPrice && !urlParams.maxPrice) return '';

    const currentRange = `${currentMinPrice}-${currentMaxPrice}`;
    return quickPriceRanges.find((range) => range.value === currentRange)?.value || '';
  };

  const activeFiltersCount = useMemo(() => {
    const filters = [
      urlParams.selectedSubcategory && slugAnalysis.type === 'category',
      urlParams.selectedMaterial,
      urlParams.minPrice || urlParams.maxPrice,
      urlParams.inStockOnly,
      urlParams.onSaleOnly,
      urlParams.discountRange,
      urlParams.sortBy !== 'newest' ? urlParams.sortBy : null,
    ];

    return filters.filter(Boolean).length;
  }, [urlParams, slugAnalysis.type]);

  const sidebarContent = (
    <div className="h-full">
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-200">
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

      <div
        className="space-y-0 overflow-y-auto p-4 scrollbar-thin"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        <FilterSection
          title="Sort By Price"
          isExpanded={expandedSections.priceSort}
          onToggle={() => toggleSection('priceSort')}
        >
          <div className="space-y-1.5">
            {sortOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`${isMobile ? 'mobile-' : ''}sort`}
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

        <FilterSection
          title="Price Range"
          isExpanded={expandedSections.priceRange}
          onToggle={() => toggleSection('priceRange')}
        >
          <div className="py-2">
            <DualRangeSlider
              ref={sliderRef}
              min={DEFAULT_MIN_PRICE}
              max={DEFAULT_MAX_PRICE}
              value={
                getSelectedQuickPriceRange()
                  ? [DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]
                  : validatedPriceRange
              }
              onChange={handlePriceRangeChange}
              step={PRICE_STEP}
            />
          </div>
        </FilterSection>

        <FilterSection
          title="Quick Price Ranges"
          isExpanded={expandedSections.quickPriceRanges}
          onToggle={() => toggleSection('quickPriceRanges')}
        >
          <div className="space-y-1.5">
            {quickPriceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`${isMobile ? 'mobile-' : ''}quickPrice`}
                  checked={getSelectedQuickPriceRange() === range.value}
                  onChange={() => handleQuickPriceRangeChange(range.value)}
                  className="mr-2.5 accent-black scale-90"
                />
                <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {safeFilters.materials.length > 0 && (
          <FilterSection
            title="Material"
            isExpanded={expandedSections.material}
            onToggle={() => toggleSection('material')}
          >
            <div className="space-y-1.5">
              <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`${isMobile ? 'mobile-' : ''}material`}
                  checked={urlParams.selectedMaterial === ''}
                  onChange={() => handleMaterialChange('')}
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
                    name={`${isMobile ? 'mobile-' : ''}material`}
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

        <FilterSection
          title="Discount"
          isExpanded={expandedSections.discount}
          onToggle={() => toggleSection('discount')}
        >
          <div className="space-y-1.5">
            {discountOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  name={`${isMobile ? 'mobile-' : ''}discount`}
                  checked={urlParams.discountRange === option.value}
                  onChange={() => handleDiscountChange(option.value)}
                  className="mr-2.5 accent-black scale-90"
                />
                <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection
          title="Category"
          isExpanded={expandedSections.category}
          onToggle={() => toggleSection('category')}
        >
          <div className="space-y-1.5">
            <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name={`${isMobile ? 'mobile-' : ''}category`}
                checked={!urlParams.selectedCategory}
                onChange={() => handleCategoryChange('')}
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
                  name={`${isMobile ? 'mobile-' : ''}category`}
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

        {availableSubcategories.length > 0 && (
          <FilterSection
            title="Subcategory"
            isExpanded={expandedSections.subcategory}
            onToggle={() => toggleSection('subcategory')}
          >
            <div className="space-y-1.5">
              <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`${isMobile ? 'mobile-' : ''}subcategory`}
                  checked={!urlParams.selectedSubcategory}
                  onChange={() => handleSubcategoryChange('')}
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
                    name={`${isMobile ? 'mobile-' : ''}subcategory`}
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

        <FilterSection
          title="Availability"
          isExpanded={expandedSections.availability}
          onToggle={() => toggleSection('availability')}
        >
          <div className="space-y-1.5">
            <label className="flex items-center cursor-pointer group py-1.5 px-2 rounded-sm hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={urlParams.inStockOnly}
                onChange={(e) => handleCheckboxChange('inStock', e.target.checked)}
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
                onChange={(e) => handleCheckboxChange('onSale', e.target.checked)}
                className="mr-2.5 accent-black scale-90"
              />
              <span className="text-xs text-gray-700 group-hover:text-black transition-colors font-medium">
                On Sale Only
              </span>
            </label>
          </div>
        </FilterSection>
      </div>

      {isMobile && (
        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-black text-white rounded-sm text-sm font-medium hover:bg-gray-800 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            Apply Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-black px-1.5 py-0.5 rounded-full text-xs font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="w-80 bg-white h-full shadow-lg overflow-hidden min-h-screen">
        {sidebarContent}
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="hidden lg:block w-60 bg-white shadow-right min-h-screen "
    >
      <div
        ref={sidebarRef}
        className="sticky max-h-screen overflow-y-auto scrollbar-thin transition-all duration-300 top-0"
        style={{
          transition: 'top 0.8s ease-in-out',
        }}
      >
        {sidebarContent}
      </div>
    </motion.aside>
  );
};

export default FilterSidebar;
