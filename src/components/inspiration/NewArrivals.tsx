"use client";

import { useEffect } from "react";
import { useHomeStore } from "@/stores/homeStore";
import { motion } from "framer-motion";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types/Product";

interface NewArrivalsProps {
  inspirationSlug: string;
  categoryName?: string;
  limit?: number;
  sort?: "newest" | "oldest" | "popular";
}

const NewArrivals = ({
  inspirationSlug,
  categoryName,
  limit = 20,
  sort = "newest",
}: NewArrivalsProps) => {
  console.log("New arival : ", inspirationSlug, categoryName);
  const {
    fetchRelatedProducts,
    relatedProducts,
    relatedProductsLoading,
    relatedProductsError,
  } = useHomeStore();

  useEffect(() => {
    if (inspirationSlug) {
      fetchRelatedProducts(inspirationSlug, limit, sort);
    }
  }, [inspirationSlug, limit, sort, fetchRelatedProducts]);
  console.log("fetchRelatedProducts : ", relatedProducts);

  if (relatedProductsLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              New Arrivals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {categoryName
                ? `Latest products in ${categoryName}`
                : "Discover our newest additions"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden shadow-sm"
              >
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

  // If relatedProducts is an array, use it directly; if it's an object, get the array using the inspirationSlug as key
  const productsArray = Array.isArray(relatedProducts)
    ? relatedProducts
    : relatedProducts && Array.isArray(relatedProducts[inspirationSlug])
    ? relatedProducts[inspirationSlug]
    : [];

  if (relatedProductsError || !productsArray.length) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            New Arrivals
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {categoryName
              ? `Latest products in ${categoryName}`
              : "Discover our newest additions"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsArray.map((product: Product, index: number) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <ProductCard product={product} key={product._id} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
