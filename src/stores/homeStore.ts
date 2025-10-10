import { create } from 'zustand';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/types/Product';
import { handleApiResponse } from '@/utils/fetchWithCredentials';

export interface IInspiration {
  _id: string;
  title: string;
  slug: string;
  description: string;
  heroImage: { url: string; alt: string; publicId: string };
  tags: string[];
  keywords: string[];
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryProducts {
  products: Product[];
  slug: string | null;
  fetchedAt: number;
}

interface InspirationCache {
  inspiration: IInspiration;
  fetchedAt: number;
}

interface RelatedProductsCache {
  products: Product[];
  fetchedAt: number;
}

interface HomeStore {
  inspirations: IInspiration[];
  currentInspiration: IInspiration | null;
  inspirationCache: Record<string, InspirationCache>;
  categoryProducts: Record<string, CategoryProducts>;
  relatedProducts: Record<string, RelatedProductsCache>;
  loading: boolean;
  inspirationLoading: boolean;
  relatedProductsLoading: boolean;
  categoryLoading: Record<string, boolean>;
  error: string | null;
  inspirationError: string | null;
  relatedProductsError: string | null;
  categoryErrors: Record<string, string | null>;
  initialized: boolean;
  initializeHome: () => Promise<void>;
  fetchInspirations: () => Promise<void>;
  fetchInspirationBySlug: (slug: string) => Promise<IInspiration | null>;
  fetchCategoryProducts: (
    categoryId: string,
  ) => Promise<{ products: Product[]; slug: string | null }>;
  fetchRelatedProducts: (
    inspirationSlug: string,
    limit?: number,
    sort?: 'newest' | 'oldest' | 'popular' | 'rating' | '',
  ) => Promise<Product[]>;
  getCategoryProducts: (categoryId: string) => CategoryProducts | null;
  getRelatedProducts: (inspirationSlug: string) => Product[];
  getRemainingInspirations: (currentInspirationId: string) => IInspiration[];
  setInspirations: (inspirations: IInspiration[]) => void;
  setCurrentInspiration: (inspiration: IInspiration | null) => void;
  clearError: () => void;
  clearInspirationError: () => void;
  clearRelatedProductsError: () => void;
  clearCategoryError: (categoryId: string) => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

let queryClient: any = null;

export const setQueryClient = (client: any) => {
  queryClient = client;
};

export const useHomeStore = create<HomeStore>((set, get) => ({
  inspirations: [],
  currentInspiration: null,
  inspirationCache: {},
  categoryProducts: {},
  relatedProducts: {},
  loading: false,
  inspirationLoading: false,
  relatedProductsLoading: false,
  categoryLoading: {},
  error: null,
  inspirationError: null,
  relatedProductsError: null,
  categoryErrors: {},
  initialized: false,

  initializeHome: async () => {
    const state = get();
    if (state.initialized) return;

    set({ initialized: true });

    try {
      await get().fetchInspirations();
      await get().fetchRelatedProducts('default', 20, 'newest');
      await get().fetchCategoryProducts('default');
    } catch (error) {
      console.error('Home store initialization error:', error);
    }
  },

  fetchInspirations: async () => {
    const { initialized, loading } = get();
    if (initialized || loading) return;

    if (queryClient) {
      const cachedData = queryClient.getQueryData(['inspirations']);
      if (cachedData) {
        set({
          inspirations: cachedData,
          initialized: true,
          loading: false,
          error: null,
        });
        return;
      }
    }

    let hasDefault = false;
    let defaultInspirations: IInspiration[] = [];

    try {
      const resDefault = await fetch('/inspirations.json');
      if (resDefault.ok) {
        defaultInspirations = await resDefault.json();
        if (defaultInspirations.length > 0) {
          set({ inspirations: defaultInspirations });
          hasDefault = true;
        }
      }
    } catch (err) {
      console.warn('No default inspirations found.');
    }

    if (!hasDefault) set({ loading: true, error: null });

    try {
      const res = await fetch('/api/inspirations', { credentials: 'include' });
      const data = await handleApiResponse(res);

      let inspirations: IInspiration[] = [];
      if (Array.isArray(data)) inspirations = data;
      else if (Array.isArray(data.inspirations)) inspirations = data.inspirations;

      if (queryClient) {
        queryClient.setQueryData(['inspirations'], inspirations);
      }

      await fetch('api/saveDefault/insparation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspirations),
      });

      set({
        inspirations,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({
        inspirations: defaultInspirations,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inspirations',
        initialized: true,
      });
    }
  },

  fetchInspirationBySlug: async (slug: string) => {
    const state = get();

    if (queryClient) {
      const cachedData = queryClient.getQueryData(['inspiration', slug]);
      if (cachedData) {
        set({ currentInspiration: cachedData as IInspiration });
        return cachedData as IInspiration;
      }
    }

    const cached = state.inspirationCache[slug];
    if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION) {
      set({ currentInspiration: cached.inspiration });
      return cached.inspiration;
    }

    if (state.inspirationLoading) {
      return state.currentInspiration;
    }

    set({ inspirationLoading: true, inspirationError: null });

    try {
      const res = await fetch(`/api/inspirations/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Inspiration not found');
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const inspiration: IInspiration = await handleApiResponse(res);

      if (queryClient) {
        queryClient.setQueryData(['inspiration', slug], inspiration);
      }

      set((state) => ({
        currentInspiration: inspiration,
        inspirationCache: {
          ...state.inspirationCache,
          [slug]: {
            inspiration,
            fetchedAt: Date.now(),
          },
        },
        inspirationLoading: false,
        inspirationError: null,
      }));

      return inspiration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load inspiration';

      set({
        inspirationLoading: false,
        inspirationError: errorMessage,
        currentInspiration: null,
      });

      return null;
    }
  },

  fetchCategoryProducts: async (categoryId: string) => {
    const state = get();

    if (queryClient) {
      const cachedData = queryClient.getQueryData(['categoryProducts', categoryId]);
      if (cachedData) {
        const result = cachedData as { products: Product[]; slug: string | null };
        set((state) => ({
          categoryProducts: {
            ...state.categoryProducts,
            [categoryId]: {
              ...result,
              fetchedAt: Date.now(),
            },
          },
        }));
        return result;
      }
    }

    const cached = state.categoryProducts[categoryId];
    const isLoading = state.categoryLoading[categoryId];

    if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION) {
      return { products: cached.products, slug: cached.slug };
    }

    if (isLoading) {
      return { products: cached?.products || [], slug: cached?.slug || null };
    }

    set((state) => ({
      categoryLoading: { ...state.categoryLoading, [categoryId]: true },
      categoryErrors: { ...state.categoryErrors, [categoryId]: null },
    }));

    try {
      const res = await fetch(`/api/products/showcase/${categoryId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await handleApiResponse(res);
      const products = data.products || [];
      const slug = data.slug || null;
      const result = { products, slug };

      if (queryClient) {
        queryClient.setQueryData(['categoryProducts', categoryId], result);
      }

      set((state) => ({
        categoryProducts: {
          ...state.categoryProducts,
          [categoryId]: {
            products,
            slug,
            fetchedAt: Date.now(),
          },
        },
        categoryLoading: { ...state.categoryLoading, [categoryId]: false },
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';

      set((state) => ({
        categoryLoading: { ...state.categoryLoading, [categoryId]: false },
        categoryErrors: { ...state.categoryErrors, [categoryId]: errorMessage },
      }));

      return { products: [], slug: null };
    }
  },

  fetchRelatedProducts: async (inspirationSlug: string, limit = 20, sort = '') => {
    const state = get();

    if (queryClient) {
      const cachedData = queryClient.getQueryData([
        'relatedProducts',
        inspirationSlug,
        limit,
        sort,
      ]);
      if (cachedData) {
        const products = cachedData as Product[];
        set((state) => ({
          relatedProducts: {
            ...state.relatedProducts,
            [inspirationSlug]: {
              products,
              fetchedAt: Date.now(),
            },
          },
        }));
        return products;
      }
    }

    const cached = state.relatedProducts[inspirationSlug];
    if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION) {
      return cached.products;
    }

    if (state.relatedProductsLoading) {
      return cached?.products || [];
    }

    set({ relatedProductsLoading: true, relatedProductsError: null });

    try {
      const params = new URLSearchParams();
      params.append('slug', inspirationSlug);
      params.append('limit', limit.toString());
      params.append('sort', sort);
      const res = await fetch(`/api/inspirations/relatedProduct?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await handleApiResponse(res);
      const products = data.products || [];

      if (queryClient) {
        queryClient.setQueryData(['relatedProducts', inspirationSlug, limit, sort], products);
      }

      set((state) => ({
        relatedProducts: {
          ...state.relatedProducts,
          [inspirationSlug]: {
            products,
            fetchedAt: Date.now(),
          },
        },
        relatedProductsLoading: false,
        relatedProductsError: null,
      }));

      return products;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load related products';

      set({
        relatedProductsLoading: false,
        relatedProductsError: errorMessage,
      });

      return [];
    }
  },

  getCategoryProducts: (categoryId: string) => {
    return get().categoryProducts[categoryId] || null;
  },

  getRelatedProducts: (inspirationSlug: string) => {
    return get().relatedProducts[inspirationSlug]?.products || [];
  },

  getRemainingInspirations: (currentInspirationId: string) => {
    return get().inspirations.filter((inspiration) => inspiration._id !== currentInspirationId);
  },

  setInspirations: (inspirations) => set({ inspirations }),

  setCurrentInspiration: (inspiration) => set({ currentInspiration: inspiration }),

  clearError: () => set({ error: null }),

  clearInspirationError: () => set({ inspirationError: null }),

  clearRelatedProductsError: () => set({ relatedProductsError: null }),

  clearCategoryError: (categoryId: string) => {
    set((state) => ({
      categoryErrors: { ...state.categoryErrors, [categoryId]: null },
    }));
  },
}));

const connectedClients = new WeakSet();

export const useHomeStoreWithReactQuery = () => {
  const queryClient = useQueryClient();

  if (queryClient && !connectedClients.has(queryClient)) {
    setQueryClient(queryClient);
    connectedClients.add(queryClient);
  }

  useQuery({
    queryKey: ['inspirations'],
    queryFn: async () => {
      const store = useHomeStore.getState();
      if (store.inspirations.length > 0) {
        return store.inspirations;
      }

      let defaultInspirations: IInspiration[] = [];
      try {
        const resDefault = await fetch('/inspirations.json');
        if (resDefault.ok) {
          defaultInspirations = await resDefault.json();
        }
      } catch (err) {
        console.warn('No default inspirations found.');
      }

      try {
        const res = await fetch('/api/inspirations', { credentials: 'include' });
        const data = await handleApiResponse(res);

        let inspirations: IInspiration[] = [];
        if (Array.isArray(data)) inspirations = data;
        else if (Array.isArray(data.inspirations)) inspirations = data.inspirations;

        return inspirations;
      } catch (error) {
        if (defaultInspirations.length > 0) {
          return defaultInspirations;
        }
        throw error;
      }
    },
    staleTime: CACHE_DURATION,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return useHomeStore();
};
