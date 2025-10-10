'use client';

import { useEffect } from 'react';
import { useHomeStore } from '@/stores/homeStore';
import ProductShowcase from '../homepage/ProductShowcase';
import Loading from '../ui/Loader';

interface NewArrivalsProps {
  inspirationSlug: string;
  categoryName?: string;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'popular';
}

const NewArrivals = ({
  inspirationSlug,
  categoryName,
  limit = 20,
  sort = 'newest',
}: NewArrivalsProps) => {
  const { fetchRelatedProducts, getRelatedProducts, relatedProductsLoading, relatedProductsError } =
    useHomeStore();

  const newArrivalProducts = getRelatedProducts(inspirationSlug);

  useEffect(() => {
    if (inspirationSlug && newArrivalProducts.length === 0 && !relatedProductsLoading) {
      fetchRelatedProducts(inspirationSlug, limit, sort);
    }
  }, [
    inspirationSlug,
    limit,
    sort,
    newArrivalProducts.length,
    relatedProductsLoading,
    fetchRelatedProducts,
  ]);

  if (relatedProductsLoading && newArrivalProducts.length === 0) {
    return (
      <section className="py-16 bg-white">
        <Loading fullScreen title="" message="" />
      </section>
    );
  }

  if (relatedProductsError) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">New Arrivals</h2>
            <p className="text-gray-600">Unable to load new arrivals. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!newArrivalProducts.length) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <ProductShowcase
        title="New Arrivals"
        description={
          categoryName
            ? `Latest products in ${categoryName}. Discover our newest additions.`
            : 'Discover our newest additions.'
        }
        productsData={newArrivalProducts}
      />
    </section>
  );
};

export default NewArrivals;
