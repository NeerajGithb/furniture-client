'use client';

import { useEffect } from 'react';
import { useHomeStore } from '@/stores/homeStore';
import ProductShowcase from '../homepage/ProductShowcase';

interface RelatedProductsProps {
  inspirationSlug: string;
  limit?: number;
}

const RelatedProducts = ({ inspirationSlug, limit = 20 }: RelatedProductsProps) => {
  const { fetchRelatedProducts, getRelatedProducts, relatedProductsLoading, relatedProductsError } =
    useHomeStore();

  const relatedProducts = getRelatedProducts(inspirationSlug);

  useEffect(() => {
    if (inspirationSlug && relatedProducts.length === 0 && !relatedProductsLoading) {
      fetchRelatedProducts(inspirationSlug, limit);
    }
  }, [
    inspirationSlug,
    limit,
    relatedProducts.length,
    relatedProductsLoading,
    fetchRelatedProducts,
  ]);

  if (relatedProductsLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Products</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover products that complement this inspiration
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (relatedProductsError) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Products</h2>
            <p className="text-gray-600">
              Unable to load related products. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!relatedProducts.length) {
    return null;
  }

  return (
    <ProductShowcase
      title="Related Products"
      description="Discover products that complement this inspiration."
      productsData={relatedProducts}
    />
  );
};

export default RelatedProducts;
