"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProductStore } from "@/stores/productStore";
import InspirationBanner from "@/components/inspiration/InspirationBanner";
import Link from "next/link";
import CategoryGrid from "@/components/inspiration/CategoryGrid";
import NewArrivals from "@/components/inspiration/NewArrivals";
import MoreInspirationIdeas from "@/components/inspiration/MoreInspirationIdeas";
import RelatedInspirations from "@/components/inspiration/RelatedInspirations";

const InspirationDetailPage = () => {
  const params = useParams();
  const categorySlug = params?.id as string;
  
  const { 
    fetchCategoryBySlug, 
    fetchProducts,
    fetchCategories,
    categories,
    products,
    loadingCategory,
    loadingProducts,
    loadingCategories 
  } = useProductStore();

  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    const initializePage = async () => {
      if (!categorySlug) return;

      try {
        // Fetch category details
        const categoryData = await fetchCategoryBySlug(categorySlug);
        if (categoryData) {
          setCategory(categoryData);
          
          // Fetch products for this category with newest sort
          const params = new URLSearchParams({
            category: categoryData.name,
            sort: 'newest',
            page: '1',
            limit: '24'
          });
          await fetchProducts(params.toString(), true);
        }

        await fetchCategories();
      } catch (error) {
        console.error('Error initializing inspiration page:', error);
      }
    };

    initializePage();
  }, [categorySlug, fetchCategoryBySlug, fetchProducts, fetchCategories]);

  if (loadingCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading inspiration...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-neutral-900 mb-2">Category Not Found</h1>
          <p className="text-neutral-600 mb-4">The inspiration category you're looking for doesn't exist.</p>
          <Link 
            href="/inspiration" 
            className="bg-neutral-900 text-white px-6 py-2 text-sm font-medium hover:bg-neutral-800 transition"
          >
            Back to Inspiration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <InspirationBanner category={category} />

      {/* Categories Grid */}
      <CategoryGrid categories={categories} loading={loadingCategories} />

      {/* New Arrivals */}
      <NewArrivals 
        categoryName={category.name}
        products={products}
        loading={loadingProducts}
      />

      {/* More Inspiration Ideas */}
      <MoreInspirationIdeas categoryName={category.name} />

      {/* Related Inspirations */}
      <RelatedInspirations currentCategoryId={category._id} />
    </div>
  );
};

export default InspirationDetailPage;