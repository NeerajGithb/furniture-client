import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useQueryClient } from '@tanstack/react-query';
import { Category, Product, SubCategory } from '@/types/Product';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';
import React from 'react';

interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  inStock?: boolean;
  onSale?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

interface ProductResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    categories: Category[];
    materials: string[];
    priceRange: { minPrice: number; maxPrice: number };
  };
  appliedFilters?: any;
  meta?: {
    fetchTime: number;
    cached: boolean;
    hasMore: boolean;
  };
}

interface ProductStore {
  // Data
  product: Product | null;
  products: Product[];
  relatedProducts: Product[];
  allProducts: Product[];
  categories: Category[];
  subcategories: SubCategory[];
  materials: string[];
  priceRange: { minPrice: number; maxPrice: number };

  // Loading states
  loading: boolean;
  loadingProducts: boolean;
  loadingMore: boolean;
  loadingAll: boolean;
  loadingCategories: boolean;
  loadingSubcategories: boolean;
  loadingCategory: boolean;

  // Pagination & filters
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  availableFilters: {
    categories: Category[];
    materials: string[];
    priceRange: { minPrice: number; maxPrice: number };
  };
  appliedFilters: ProductFilters;

  // Computed values
  hasMore: boolean;
  currentPage: number;
  totalProducts: number;

  error: string | null;

  // UI State
  selectedImageIndex: number;
  quantity: number;
  isZooming: boolean;
  zoomPosition: { x: number; y: number };

  // Action states
  addingToCart: boolean;
  buyingNow: boolean;
  addingToWishlist: boolean;

  // Initialization flags
  initialized: boolean;
  categoriesInitialized: boolean;
  subcategoriesInitialized: boolean;

  // Product Actions
  fetchProduct: (productId: string) => Promise<void>;
  fetchProducts: (queryParams?: string, reset?: boolean) => Promise<void>;
  fetchRelatedProducts: (categoryName?: string, excludeId?: string) => Promise<void>;
  fetchShowcaseProducts: () => Promise<void>;
  fetchAllProducts: (excludeId?: string) => Promise<void>;

  showcaseProducts: Product[];
  loadingShowcase: boolean;

  // Category Actions
  fetchCategories: () => Promise<void>;
  fetchCategoryBySlug: (slug: string) => Promise<Category | null>;
  loadDefaultCategories: () => Promise<void>;

  // Subcategory Actions
  fetchSubcategories: () => Promise<void>;
  loadDefaultSubcategories: () => Promise<void>;

  // Filter Actions
  setFilters: (filters: ProductFilters) => void;
  clearFilters: () => void;
  loadMoreProducts: () => Promise<void>;
  setCurrentPage: (page: number) => void;

  // UI Actions
  setSelectedImageIndex: (index: number) => void;
  setQuantity: (quantity: number) => void;
  setIsZooming: (isZooming: boolean) => void;
  setZoomPosition: (position: { x: number; y: number }) => void;
  setAddingToCart: (isAdding: boolean) => void;
  setBuyingNow: (isBuying: boolean) => void;
  setAddingToWishlist: (isAdding: boolean) => void;

  // Initialize
  initializeProducts: () => Promise<void>;

  // Reset
  resetProductState: () => void;
  resetFilters: () => void;
}

// React Query cache keys
const QUERY_KEYS = {
  product: (id: string) => ['product', id],
  products: (filters: ProductFilters) => ['products', filters],
  categories: () => ['categories'],
  subcategories: () => ['subcategories'],
  category: (slug: string) => ['category', slug],
  relatedProducts: (category?: string, excludeId?: string) => [
    'relatedProducts',
    category,
    excludeId,
  ],
  allProducts: (excludeId?: string) => ['allProducts', excludeId],
};

// Enhanced fetch functions with React Query integration
const createEnhancedFetcher = () => {
  let queryClient: any = null;

  const setQueryClient = (client: any) => {
    queryClient = client;
  };

  const fetchWithQuery = async <T>(
    key: any[],
    fetchFn: () => Promise<T>,
    staleTime = 5 * 60 * 1000,
  ): Promise<T> => {
    if (queryClient) {
      const cachedData = queryClient.getQueryData(key);
      if (cachedData) return cachedData;

      const data = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: fetchFn,
        staleTime,
      });
      return data;
    }
    return fetchFn();
  };

  const invalidateQuery = (key: any[]) => {
    if (queryClient) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

  return { fetchWithQuery, invalidateQuery, setQueryClient };
};

const { fetchWithQuery, invalidateQuery, setQueryClient } = createEnhancedFetcher();

export const useProductStore = create<ProductStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial Data
    product: null,
    products: [],
    relatedProducts: [],
    allProducts: [],
    categories: [],
    subcategories: [],
    materials: [],
    priceRange: { minPrice: 0, maxPrice: 100000 },
    hasMore: false,
    currentPage: 1,
    totalProducts: 0,
    showcaseProducts: [],
    loadingShowcase: false,

    // Initial Loading States
    loading: false,
    loadingProducts: false,
    loadingMore: false,
    loadingAll: false,
    loadingCategories: false,
    loadingSubcategories: false,
    loadingCategory: false,

    // Initial Pagination & Filters
    pagination: {
      page: 1,
      limit: 24,
      total: 0,
      pages: 0,
    },
    availableFilters: {
      categories: [],
      materials: [],
      priceRange: { minPrice: 0, maxPrice: 100000 },
    },
    appliedFilters: {
      page: 1,
      limit: 24,
      sort: 'newest',
    },

    error: null,

    // Initial UI State
    selectedImageIndex: 0,
    quantity: 1,
    isZooming: false,
    zoomPosition: { x: 0, y: 0 },

    // Initial Action states
    addingToCart: false,
    buyingNow: false,
    addingToWishlist: false,

    // Initialization flags
    initialized: false,
    categoriesInitialized: false,
    subcategoriesInitialized: false,

    // Initialize store with default data first
    initializeProducts: async () => {
      const state = get();
      if (state.initialized) return;

      set({ initialized: true });

      try {
        // Load default data first for immediate display
        await Promise.all([get().loadDefaultCategories(), get().loadDefaultSubcategories()]);

        // Then fetch latest from API in background
        await Promise.all([
          get().fetchCategories(),
          get().fetchSubcategories(),
          get().fetchShowcaseProducts(),
        ]);
      } catch (error) {
        console.error('Error during initialization:', error);
        set({ error: 'Failed to initialize store' });
      }
    },

    // Load default categories from static JSON
    loadDefaultCategories: async () => {
      try {
        const res = await fetch('/categories.json');
        if (res.ok) {
          const defaultCategories: Category[] = await res.json();
          if (defaultCategories && defaultCategories.length > 0) {
            set({ categories: defaultCategories });
            console.log('Loaded default categories:', defaultCategories.length);
          }
        }
      } catch (error) {
        console.warn('Failed to load default categories:', error);
      }
    },

    // Load default subcategories from static JSON
    loadDefaultSubcategories: async () => {
      try {
        const res = await fetch('/subcategories.json');
        if (res.ok) {
          const defaultSubcategories: SubCategory[] = await res.json();
          if (defaultSubcategories && defaultSubcategories.length > 0) {
            set({ subcategories: defaultSubcategories });
            console.log('Loaded default subcategories:', defaultSubcategories.length);
          }
        }
      } catch (error) {
        console.warn('Failed to load default subcategories:', error);
      }
    },

    // Fetch categories with default fallback
    fetchCategories: async () => {
      const { categoriesInitialized, loadingCategories } = get();
      if (categoriesInitialized || loadingCategories) return;

      let hasDefault = false;
      let defaultCategories: Category[] = [];

      // Load default data first
      try {
        const resDefault = await fetch('/categories.json');
        if (resDefault.ok) {
          defaultCategories = await resDefault.json();
          if (defaultCategories.length > 0) {
            set({ categories: defaultCategories });
            hasDefault = true;
          }
        }
      } catch (err) {
        console.warn('No default categories found.');
      }

      // Only show loading if no default data
      if (!hasDefault) set({ loadingCategories: true });

      try {
        const categories = await fetchWithQuery(QUERY_KEYS.categories(), async () => {
          const response = await fetchWithCredentials('/api/categories');
          return handleApiResponse(response);
        });

        // Save as default for next time
        await fetch('/api/saveDefault/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categories),
        });

        set({
          categories,
          loadingCategories: false,
          categoriesInitialized: true,
        });
      } catch (error) {
        set({
          categories: defaultCategories,
          loadingCategories: false,
          categoriesInitialized: true,
        });
      }
    },

    // Fetch subcategories with default fallback
    fetchSubcategories: async () => {
      const { subcategoriesInitialized, loadingSubcategories } = get();
      if (subcategoriesInitialized || loadingSubcategories) return;

      let hasDefault = false;
      let defaultSubcategories: SubCategory[] = [];

      // Load default data first
      try {
        const resDefault = await fetch('/subcategories.json');
        if (resDefault.ok) {
          defaultSubcategories = await resDefault.json();
          if (defaultSubcategories.length > 0) {
            set({ subcategories: defaultSubcategories });
            hasDefault = true;
          }
        }
      } catch (err) {
        console.warn('No default subcategories found.');
      }

      // Only show loading if no default data
      if (!hasDefault) set({ loadingSubcategories: true });

      try {
        const subcategories = await fetchWithQuery(QUERY_KEYS.subcategories(), async () => {
          const response = await fetchWithCredentials('/api/subcategories');
          return handleApiResponse(response);
        });

        // Save as default for next time
        await fetch('/api/saveDefault/subcategories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subcategories),
        });

        set({
          subcategories,
          loadingSubcategories: false,
          subcategoriesInitialized: true,
        });
      } catch (error) {
        set({
          subcategories: defaultSubcategories,
          loadingSubcategories: false,
          subcategoriesInitialized: true,
        });
      }
    },

    // Fetch single product with React Query caching
    fetchProduct: async (productId: string) => {
      if (!productId) return;
      set({ loading: true, error: null });

      try {
        const productData = await fetchWithQuery(QUERY_KEYS.product(productId), async () => {
          const response = await fetchWithCredentials(`/api/products/${productId}`);
          if (!response.ok) throw new Error(`Failed to fetch product: ${response.status}`);
          return handleApiResponse(response);
        });

        set({ product: productData, loading: false });

        // Background fetch related products
        if (productData.categoryId?.name) {
          get().fetchRelatedProducts(productData.categoryId.name, productId);
        }
        get().fetchAllProducts(productId);
      } catch (err) {
        console.error('Error fetching product:', err);
        set({
          error: err instanceof Error ? err.message : 'Failed to load product',
          loading: false,
        });
      }
    },

    // Fetch products with React Query caching
    fetchProducts: async (queryParams?: string, reset: boolean = false) => {
      set({
        loadingProducts: reset ? true : false,
        loadingMore: !reset ? true : false,
        error: null,
      });

      try {
        const url = queryParams ? `/api/products?${queryParams}` : '/api/products';
        const filters = get().appliedFilters;

        const data: ProductResponse = await fetchWithQuery(
          QUERY_KEYS.products(filters),
          async () => {
            const response = await fetchWithCredentials(url);
            if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
            return handleApiResponse(response);
          },
          2 * 60 * 1000, // 2 minutes stale time
        );

        set((state) => {
          const filteredTotal = data.pagination?.total || 0;
          const currentPage = data.pagination?.page || 1;
          const totalPages = data.pagination?.pages || 0;

          return {
            products: reset ? data.products : [...state.products, ...data.products],
            pagination: data.pagination,
            totalProducts: filteredTotal,
            currentPage: currentPage,
            hasMore: currentPage < totalPages,
            availableFilters: data.filters,
            materials: Array.isArray(data.filters.materials) ? data.filters.materials : [],
            priceRange: data.filters.priceRange || { minPrice: 0, maxPrice: 100000 },
            loadingProducts: false,
            loadingMore: false,
          };
        });
      } catch (err) {
        console.error('Failed to fetch products:', err);
        set({
          error: err instanceof Error ? err.message : 'Failed to load products',
          loadingProducts: false,
          loadingMore: false,
          products: reset ? [] : get().products,
        });
      }
    },

    // Load more products with caching
    loadMoreProducts: async () => {
      const { pagination, appliedFilters, loadingMore, hasMore } = get();

      if (loadingMore || !hasMore) return;

      set({ loadingMore: true });

      try {
        const nextPage = pagination.page + 1;
        const filters = { ...appliedFilters, page: nextPage };
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });

        await get().fetchProducts(params.toString(), false);
      } catch (err) {
        console.error('Failed to load more products:', err);
      } finally {
        set({ loadingMore: false });
      }
    },

    // Fetch related products with caching
    fetchRelatedProducts: async (categoryName?: string, excludeId?: string) => {
      set({ loadingMore: true });

      try {
        const productsArray = await fetchWithQuery(
          QUERY_KEYS.relatedProducts(categoryName, excludeId),
          async () => {
            const params = new URLSearchParams({ page: '1', limit: '8', sort: 'newest' });
            if (categoryName) params.append('category', categoryName.toLowerCase());

            const response = await fetchWithCredentials(`/api/products?${params}`);
            if (!response.ok)
              throw new Error(`Failed to fetch related products: ${response.status}`);

            const data: ProductResponse = await handleApiResponse(response);
            return (data.products || [])
              .filter((p) => p._id !== excludeId)
              .sort(() => Math.random() - 0.5)
              .slice(0, 8);
          },
        );

        set({ relatedProducts: productsArray, loadingMore: false });
      } catch (err) {
        console.error('Failed to fetch related products:', err);
        set({ relatedProducts: [], loadingMore: false });
      }
    },

    // Fetch showcase products
    fetchShowcaseProducts: async () => {
      set({ loadingShowcase: true, error: null });

      try {
        const productsArray = await fetchWithQuery(
          ['showcaseProducts'],
          async () => {
            const response = await fetchWithCredentials('/api/products/showcase');
            if (!response.ok)
              throw new Error(`Failed to fetch showcase products: ${response.status}`);
            const data = await handleApiResponse(response);
            return data.products || [];
          },
          5 * 60 * 1000, // 5 minutes cache
        );

        set({ showcaseProducts: productsArray, loadingShowcase: false });
      } catch (err) {
        console.error('Failed to fetch showcase products:', err);
        set({
          error: err instanceof Error ? err.message : 'Failed to load showcase products',
          showcaseProducts: [],
          loadingShowcase: false,
        });
      }
    },

    // Fetch all products with caching
    fetchAllProducts: async (excludeId?: string) => {
      set({ loadingAll: true });

      try {
        const productsArray = await fetchWithQuery(QUERY_KEYS.allProducts(excludeId), async () => {
          const params = new URLSearchParams({ page: '1', limit: '12', sort: 'newest' });
          const response = await fetchWithCredentials(`/api/products?${params}`);
          if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);

          const data: ProductResponse = await handleApiResponse(response);
          return (data.products || [])
            .filter((p) => p._id !== excludeId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 12);
        });

        set({ allProducts: productsArray, loadingAll: false });
      } catch (err) {
        console.error('Failed to fetch all products:', err);
        set({ allProducts: [], loadingAll: false });
      }
    },

    // Fetch category by slug with caching
    fetchCategoryBySlug: async (slug: string) => {
      set({ loadingCategory: true, error: null });

      try {
        const categoryData = await fetchWithQuery(
          QUERY_KEYS.category(slug),
          async () => {
            const response = await fetchWithCredentials(`/api/categories/${slug}`);
            if (!response.ok) {
              if (response.status === 404) throw new Error(`Category '${slug}' not found`);
              throw new Error(`Failed to fetch category: ${response.status}`);
            }
            return handleApiResponse(response);
          },
          15 * 60 * 1000,
        );

        set({ loadingCategory: false });
        return categoryData;
      } catch (err) {
        console.error('Failed to fetch category:', err);
        set({
          error: err instanceof Error ? err.message : 'Failed to load category',
          loadingCategory: false,
        });
        return null;
      }
    },

    // Filter Actions
    setFilters: (filters: ProductFilters) => {
      const newFilters = { ...get().appliedFilters, ...filters, page: 1 };
      set({ appliedFilters: newFilters });

      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      // Invalidate products cache when filters change
      invalidateQuery(['products']);
      get().fetchProducts(params.toString(), true);
    },

    clearFilters: () => {
      const defaultFilters = { page: 1, limit: 24, sort: 'newest' };
      set({ appliedFilters: defaultFilters });
      invalidateQuery(['products']);
      get().fetchProducts('', true);
    },

    setCurrentPage: (page: number) => {
      set((state) => ({
        pagination: { ...state.pagination, page },
      }));
    },

    // UI Actions
    setSelectedImageIndex: (index) => set({ selectedImageIndex: index }),
    setQuantity: (quantity) => set({ quantity: Math.max(1, quantity) }),
    setIsZooming: (isZooming) => set({ isZooming }),
    setZoomPosition: (position) => set({ zoomPosition: position }),
    setAddingToCart: (isAdding) => set({ addingToCart: isAdding }),
    setBuyingNow: (isBuying) => set({ buyingNow: isBuying }),
    setAddingToWishlist: (isAdding) => set({ addingToWishlist: isAdding }),

    // Reset functions
    resetProductState: () => {
      // Clear React Query cache
      invalidateQuery(['products']);
      invalidateQuery(['relatedProducts']);
      invalidateQuery(['showcaseProducts']);
      invalidateQuery(['allProducts']);

      set({
        products: [],
        product: null,
        relatedProducts: [],
        showcaseProducts: [],
        loadingShowcase: false,
        allProducts: [],
        selectedImageIndex: 0,
        quantity: 1,
        isZooming: false,
        zoomPosition: { x: 0, y: 0 },
        addingToCart: false,
        buyingNow: false,
        addingToWishlist: false,
        error: null,
        loadingProducts: false,
        loadingMore: false,
        currentPage: 1,
        hasMore: false,
        totalProducts: 0,
        pagination: {
          page: 1,
          limit: 24,
          total: 0,
          pages: 0,
        },
      });
    },

    resetFilters: () => {
      const defaultFilters = { page: 1, limit: 24, sort: 'newest' };
      invalidateQuery(['products']);

      set({
        appliedFilters: defaultFilters,
        products: [],
        pagination: {
          page: 1,
          limit: 24,
          total: 0,
          pages: 0,
        },
        totalProducts: 0,
        currentPage: 1,
        hasMore: false,
      });
    },
  })),
);

// Hook to initialize React Query client
export const useInitializeProductStore = () => {
  const queryClient = useQueryClient();

  // Set query client on first render
  React.useEffect(() => {
    setQueryClient(queryClient);
  }, [queryClient]);
};
