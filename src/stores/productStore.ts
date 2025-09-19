import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Category, Product, SubCategory } from '@/types/Product';
import { fetchWithCredentials, handleApiResponse } from '@/utils/fetchWithCredentials';

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
  fetchAllProducts: (excludeId?: string) => Promise<void>;

  // Category Actions
  fetchCategories: () => Promise<void>;
  fetchCategoryBySlug: (slug: string) => Promise<Category | null>;

  // Subcategory Actions
  fetchSubcategories: () => Promise<void>;

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

    // Initialize store - fetch categories and subcategories once
    initializeProducts: async () => {
      const state = get();
      if (state.initialized) return;

      set({ initialized: true });

      try {
        await Promise.all([get().fetchCategories(), get().fetchSubcategories()]);
      } catch (error) {
        console.error('Error during initialization:', error);
        set({ error: 'Failed to initialize store' });
      }
    },

    // Fetch single product
    fetchProduct: async (productId: string) => {
      if (!productId) return;
      set({ loading: true, error: null });

      try {
        const response = await fetchWithCredentials(`/api/products/${productId}`);
        if (!response.ok) throw new Error(`Failed to fetch product: ${response.status}`);

        const productData = await handleApiResponse(response);
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

    // Fetch products with improved parameter handling and state management
    // Replace the entire fetchProducts method in your store with this:

    fetchProducts: async (queryParams?: string, reset: boolean = false) => {
      // Set loading states
      set({
        loadingProducts: reset ? true : false,
        loadingMore: !reset ? true : false,
        error: null,
      });

      try {
        const url = queryParams ? `/api/products?${queryParams}` : '/api/products';
        const response = await fetchWithCredentials(url);

        if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);

        const data: ProductResponse = await handleApiResponse(response);

        set((state) => {
          // For filtered results, use the pagination total as the source of truth
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

    // Load more products (pagination)
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

    // Fetch related products
    fetchRelatedProducts: async (categoryName?: string, excludeId?: string) => {
      set({ loadingMore: true });

      try {
        const params = new URLSearchParams({ page: '1', limit: '8', sort: 'newest' });
        if (categoryName) params.append('category', categoryName.toLowerCase());

        const response = await fetchWithCredentials(`/api/products?${params}`);
        if (!response.ok) throw new Error(`Failed to fetch related products: ${response.status}`);

        const data: ProductResponse = await handleApiResponse(response);
        const productsArray: Product[] = data.products || [];

        set({
          relatedProducts: productsArray
            .filter((p) => p._id !== excludeId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 8),
          loadingMore: false,
        });
      } catch (err) {
        console.error('Failed to fetch related products:', err);
        set({ relatedProducts: [], loadingMore: false });
      }
    },

    // Fetch all products (general listing)
    fetchAllProducts: async (excludeId?: string) => {
      set({ loadingAll: true });

      try {
        const params = new URLSearchParams({ page: '1', limit: '12', sort: 'newest' });
        const response = await fetchWithCredentials(`/api/products?${params}`);
        if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);

        const data: ProductResponse = await handleApiResponse(response);
        const productsArray: Product[] = data.products || [];

        set({
          allProducts: productsArray
            .filter((p) => p._id !== excludeId)
            .sort(() => Math.random() - 0.5)
            .slice(0, 12),
          loadingAll: false,
        });
      } catch (err) {
        console.error('Failed to fetch all products:', err);
        set({ allProducts: [], loadingAll: false });
      }
    },

    // Fetch all categories - only once
    fetchCategories: async () => {
      const state = get();
      if (state.categoriesInitialized || state.loadingCategories) return;

      set({ loadingCategories: true, error: null });

      try {
        const response = await fetchWithCredentials('/api/categories');
        if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);

        const categories = await handleApiResponse(response);
        set({ categories, loadingCategories: false, categoriesInitialized: true });
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        set({
          error: err instanceof Error ? err.message : 'Failed to load categories',
          loadingCategories: false,
          categories: [],
        });
      }
    },

    // Fetch category by slug
    fetchCategoryBySlug: async (slug: string) => {
      set({ loadingCategory: true, error: null });

      try {
        const response = await fetchWithCredentials(`/api/categories/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Category '${slug}' not found`);
          }
          throw new Error(`Failed to fetch category: ${response.status}`);
        }

        const categoryData = await handleApiResponse(response);
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

    // Fetch all subcategories - only once
    fetchSubcategories: async () => {
      const state = get();
      if (state.subcategoriesInitialized || state.loadingSubcategories) return;

      set({ loadingSubcategories: true, error: null });

      try {
        const response = await fetchWithCredentials('/api/subcategories');
        if (!response.ok) throw new Error(`Failed to fetch subcategories: ${response.status}`);

        const subcategories = await handleApiResponse(response);
        set({ subcategories, loadingSubcategories: false, subcategoriesInitialized: true });
      } catch (err) {
        console.error('Failed to fetch subcategories:', err);
        set({
          error: err instanceof Error ? err.message : 'Failed to load subcategories',
          loadingSubcategories: false,
          subcategories: [],
        });
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

      get().fetchProducts(params.toString(), true);
    },

    clearFilters: () => {
      const defaultFilters = {
        page: 1,
        limit: 24,
        sort: 'newest',
      };
      set({ appliedFilters: defaultFilters });
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

    // Reset functions - FIXED: Clear products state properly
    resetProductState: () =>
      set({
        products: [],
        product: null,
        relatedProducts: [],
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
      }),

    resetFilters: () => {
      const defaultFilters = {
        page: 1,
        limit: 24,
        sort: 'newest',
      };
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
