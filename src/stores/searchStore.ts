import { create } from 'zustand';
import { Product } from '@/types/Product';
import { handleApiResponse } from '@/utils/fetchWithCredentials';

interface RelatedCategory {
  _id: string;
  name: string;
  slug: string;
}

interface SearchState {
  // Products data
  products: Product[];
  totalProducts: number;

  // Loading states
  loadingProducts: boolean;
  loadingMore: boolean;
  setLoadingProducts: (value: boolean) => void;
  // Error state
  error: string | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  hasMore: boolean;

  // Search specific data
  query: string;
  suggestion: string | null;
  relatedCategories: RelatedCategory[];
  normalized: string | null;
  fallback: boolean; // shows if results are fallback
  noResults: boolean; // shows if query returned nothing

  // Filter data (these should come from layout, not fetched here)
  categories: any[];
  subcategories: any[];
  materials: string[];
  priceRange: { minPrice: number; maxPrice: number };

  // Actions
  searchProducts: (query: string, params: string, reset?: boolean) => Promise<void>;
  setQuery: (query: string) => void;
  setFilters: (filters: any) => void; // To accept filters from layout
  resetSearch: () => void;
}

const useSearchStore = create<SearchState>((set, get) => ({
  // Initial state
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

  // Set filters from external source (layout)
  setFilters: (filters) => {
    set({
      categories: filters.categories || [],
      subcategories: filters.subcategories || [],
      materials: filters.materials || [],
      priceRange: filters.priceRange || { minPrice: 0, maxPrice: 100000 },
    });
  },

  // Reset search state
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
    });
  },

  // Search products function
  searchProducts: async (query: string, params: string, reset = false) => {
    const state = get();

    if (!query.trim()) {
      return;
    }

    try {
      // Set appropriate loading state
      if (reset) {
        set({
          products: [], // Clear products immediately for new search
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

      // Build search URL
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

      // Handle no results case
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

      // Calculate pagination
      const totalPages = Math.ceil(data.total / data.pageSize);
      const hasMore = data.page < totalPages;

      // Update with results
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

  // Set query
  setQuery: (query: string) => {
    set({ query });
  },
}));

export default useSearchStore;
