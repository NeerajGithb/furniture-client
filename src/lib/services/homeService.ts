import { handleApiResponse } from '@/utils/fetchWithCredentials';
import { Product } from '@/types/Product';
import { IInspiration } from '@/stores/ui/homeUiStore';

export async function fetchInspirations(): Promise<IInspiration[]> {
  const res = await fetch('/api/inspirations', { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await handleApiResponse(res);
  return Array.isArray(data) ? data : data.inspirations || [];
}

export async function fetchInspirationBySlug(slug: string): Promise<IInspiration> {
  const res = await fetch(`/api/inspirations/${slug}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Inspiration not found');
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return handleApiResponse(res);
}

export async function fetchCategoryProducts(
  categoryId: string,
): Promise<{ products: Product[]; slug?: string }> {
  const res = await fetch(`/api/products/showcase/${categoryId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return handleApiResponse(res);
}

export async function fetchRelatedProducts(
  inspirationSlug: string,
  limit = 20,
  sort: 'newest' | 'oldest' | 'popular' = 'newest',
): Promise<Product[]> {
  const params = new URLSearchParams({ slug: inspirationSlug, limit: limit.toString(), sort });
  const res = await fetch(`/api/inspirations/relatedProduct?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await handleApiResponse(res);
  return data.products || [];
}
