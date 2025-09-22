import { create } from 'zustand';
import { Product } from '@/types/Product';
import { handleApiResponse } from '@/utils/fetchWithCredentials';

interface RelatedCategory {
  _id: string;
  name: string;
  slug: string;
}

interface SearchState {
  products: Product[];
  totalProducts: number;

  loadingProducts: boolean;
  loadingMore: boolean;
  setLoadingProducts: (value: boolean) => void;

  error: string | null;

  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  hasMore: boolean;

  query: string;
  suggestion: string | null;
  relatedCategories: RelatedCategory[];
  normalized: string | null;
  fallback: boolean;
  noResults: boolean;

  categories: any[];
  subcategories: any[];
  materials: string[];
  priceRange: { minPrice: number; maxPrice: number };

  searchProducts: (query: string, params: string, reset?: boolean) => Promise<void>;
  fetchProducts: (params: string, reset?: boolean) => Promise<void>;
  setQuery: (query: string) => void;
  setFilters: (filters: any) => void;
  resetSearch: () => void;
  resetProductState: () => void;
}

const useSearchStore = create<SearchState>((set, get) => ({
  products: [],
  totalProducts: 0,
  loadingProducts: false,
  setLoadingProducts: (value) => set({ loadingProducts: value }),
  loadingMore: false,
  error: null,
  pagination: {
    page: 1,
    limit: 24,
    total: 0,
    pages: 0,
  },
  hasMore: false,
  query: '',
  suggestion: null,
  relatedCategories: [],
  normalized: null,
  fallback: false,
  noResults: false,
  categories: [],
  subcategories: [],
  materials: [],
  priceRange: { minPrice: 0, maxPrice: 100000 },

  setFilters: (filters) => {
    set({
      categories: filters.categories || [],
      subcategories: filters.subcategories || [],
      materials: filters.materials || [],
      priceRange: filters.priceRange || { minPrice: 0, maxPrice: 100000 },
    });
  },

  resetSearch: () => {
    set({
      products: [],
      totalProducts: 0,
      loadingProducts: false,
      loadingMore: false,
      error: null,
      pagination: {
        page: 1,
        limit: 24,
        total: 0,
        pages: 0,
      },
      hasMore: false,
      suggestion: null,
      relatedCategories: [],
      normalized: null,
      fallback: false,
      noResults: false,
      query: '',
    });
  },

  resetProductState: () => {
    set({
      products: [],
      totalProducts: 0,
      loadingProducts: false,
      loadingMore: false,
      error: null,
      pagination: {
        page: 1,
        limit: 24,
        total: 0,
        pages: 0,
      },
      hasMore: false,
      suggestion: null,
      relatedCategories: [],
      normalized: null,
      fallback: false,
      noResults: false,
    });
  },

  fetchProducts: async (params: string, reset = false) => {
    const state = get();

    try {
      if (reset) {
        set({
          products: [],
          totalProducts: 0,
          loadingProducts: true,
          loadingMore: false,
          error: null,
          suggestion: null,
          relatedCategories: [],
          normalized: null,
          fallback: false,
          noResults: false,
        });
      } else {
        set({
          loadingMore: true,
          error: null,
        });
      }

      const searchParams = new URLSearchParams(params);

      if (!reset) {
        const currentPage = state.pagination.page;
        searchParams.set('page', (currentPage + 1).toString());
      }

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await handleApiResponse(response);

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      if (!data.products || data.products.length === 0) {
        set({
          products: [],
          totalProducts: 0,
          loadingProducts: false,
          loadingMore: false,
          hasMore: false,
          pagination: {
            page: 1,
            limit: state.pagination.limit,
            total: 0,
            pages: 0,
          },
          fallback: false,
          noResults: true,
          suggestion: null,
          relatedCategories: [],
          normalized: null,
        });
        return;
      }

      const totalPages = Math.ceil(data.total / data.pageSize);
      const hasMore = data.page < totalPages;

      set({
        products: reset ? data.products : [...state.products, ...data.products],
        totalProducts: data.total,
        pagination: {
          page: data.page,
          limit: data.pageSize,
          total: data.total,
          pages: totalPages,
        },
        hasMore,
        suggestion: null,
        relatedCategories: data.relatedCategories || [],
        normalized: null,
        fallback: false,
        noResults: false,
        loadingProducts: false,
        loadingMore: false,
        error: null,
      });
    } catch (error) {
      console.error('Fetch products error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';

      set({
        loadingProducts: false,
        loadingMore: false,
        error: errorMessage,
        noResults: false,
        fallback: false,
      });
    }
  },

  searchProducts: async (query: string, params: string, reset = false) => {
    const state = get();

    if (!query.trim()) {
      const searchParams = new URLSearchParams(params);
      const hasFilters = Array.from(searchParams.keys()).some(
        (key) => key !== 'q' && key !== 'page' && key !== 'limit',
      );

      if (hasFilters) {
        return get().fetchProducts(params, reset);
      }

      set({
        products: [],
        totalProducts: 0,
        loadingProducts: false,
        loadingMore: false,
        error: null,
        hasMore: false,
        noResults: false,
        fallback: false,
        suggestion: null,
        relatedCategories: [],
        normalized: null,
      });
      return;
    }

    try {
      if (reset) {
        set({
          products: [],
          totalProducts: 0,
          loadingProducts: true,
          loadingMore: false,
          error: null,
          suggestion: null,
          relatedCategories: [],
          normalized: null,
          fallback: false,
          noResults: false,
        });
      } else {
        set({
          loadingMore: true,
          error: null,
        });
      }

      const searchParams = new URLSearchParams(params);
      searchParams.set('q', query);

      if (!reset) {
        const currentPage = state.pagination.page;
        searchParams.set('page', (currentPage + 1).toString());
      }

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await handleApiResponse(response);

      if (!data.ok) {
        throw new Error(data.error || 'Search failed');
      }

      if (!data.products || data.products.length === 0) {
        set({
          products: [],
          totalProducts: 0,
          loadingProducts: false,
          loadingMore: false,
          hasMore: false,
          pagination: {
            page: 1,
            limit: state.pagination.limit,
            total: 0,
            pages: 0,
          },
          fallback: data.fallback || false,
          noResults: true,
          suggestion: data.suggestion || null,
          relatedCategories: data.relatedCategories || [],
          normalized: data.normalized || null,
        });
        return;
      }

      const totalPages = Math.ceil(data.total / data.pageSize);
      const hasMore = data.page < totalPages;

      set({
        products: reset ? data.products : [...state.products, ...data.products],
        totalProducts: data.total,
        pagination: {
          page: data.page,
          limit: data.pageSize,
          total: data.total,
          pages: totalPages,
        },
        hasMore,
        suggestion: data.suggestion || null,
        relatedCategories: data.relatedCategories || [],
        normalized: data.normalized || null,
        fallback: data.fallback || false,
        noResults: false,
        loadingProducts: false,
        loadingMore: false,
        error: null,
      });
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search products';

      set({
        loadingProducts: false,
        loadingMore: false,
        error: errorMessage,
        noResults: false,
        fallback: false,
      });
    }
  },

  setQuery: (query: string) => {
    set({ query });
  },
}));

export default useSearchStore;
