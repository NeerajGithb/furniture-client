"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/stores/productStore";
import { useHomeStore } from "@/stores/homeStore";
import Image from "next/image";
import { Category, Product, SubCategory } from "@/types/Product";
import { Loader } from "lucide-react";

interface CategoryPageParams {
  category: string;
}

interface CategoryPageProps {
  params: CategoryPageParams | Promise<CategoryPageParams>;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ params }) => {
  const resolvedParams = React.use(params as React.Usable<CategoryPageParams>);
  const { category } = resolvedParams;

  const router = useRouter();

  const categories = useProductStore((state) => state.categories) as Category[];

  const subcategories = useProductStore(
    (state) => state.subcategories
  ) as SubCategory[];
  const initialize = useProductStore((state) => state.initialize);
  const categoriesLoaded = categories.length > 0 && subcategories.length > 0;
  const {
    fetchCategoryProducts,
    getCategoryProducts,
    categoryLoading,
    categoryErrors,
  } = useHomeStore();

  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categorySubcategories, setCategorySubcategories] = useState<
    SubCategory[]
  >([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef<boolean>(false);

  const loading = currentCategory
    ? categoryLoading[currentCategory._id] || false
    : false;

  useEffect(() => {
    if (!initialized.current) {
      initialize();
      initialized.current = true;
    }
  }, [initialize]);

  useEffect(() => {
    if (categories.length > 0 && subcategories.length > 0) {
      const foundCategory = categories.find(
        (cat: Category) => cat.slug === category
      );
      if (foundCategory) {
        setCurrentCategory(foundCategory);

        const filteredSubcategories = subcategories.filter(
          (sub: SubCategory) => sub.categoryId._id === foundCategory._id
        );
        setCategorySubcategories(filteredSubcategories);

        loadCategoryProducts(foundCategory._id);
      }
    }
  }, [categories, subcategories, category]);

  const loadCategoryProducts = async (categoryId: string) => {
    try {
      setError(null);

      // Check if we have cached data first
      const cached = getCategoryProducts(categoryId);
      if (cached) {
        setFeaturedProducts(cached.products);
        setSlug(cached.slug);
      }

      // Fetch (will use cache if valid)
      const { products, slug: newSlug } = await fetchCategoryProducts(
        categoryId
      );
      setFeaturedProducts(products);
      setSlug(newSlug);
    } catch (err) {
      console.error("Failed to load category products:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    }
  };

  const handleSubcategoryClick = (subcategory: SubCategory): void => {
    router.push(`/products?c=${category}&sc=${subcategory.slug}`);
  };

  const handleProductClick = (product: Product): void => {
    router.push(`/product/${product.slug}`);
  };
  if (!categoriesLoaded) {
    // Show a loading skeleton while fetching categories/subcategories
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500"><Loader className="animate-spin " /></p>
        </div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Category not found
          </h1>
          <button
            onClick={() => router.push("/products")}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }
  

  const currentError =
    error || (currentCategory ? categoryErrors[currentCategory._id] : null);

  return (
    <div className="min-h-screen bg-white">
      {slug && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="py-3 "
        >
          <nav className="mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center gap-1 text-sm text-gray-500">
              <li className="font-medium text-gray-700">Furniture Home</li>
              <li>&gt;</li>
              <li className="capitalize">
                {slug ? slug.replace("-", " ") : "-"}
              </li>
              <li>&gt;</li>
              <li className="capitalize font-semibold">{category}</li>
            </ol>
          </nav>
        </motion.section>
      )}
      <section className="py-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {currentCategory?.name}
        </h1>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subcategories */}
        {categorySubcategories.length > 0 && (
          <section className="py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {categorySubcategories.map(
                  (sub: SubCategory, index: number) => (
                    <motion.div
                      key={sub._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onClick={() => handleSubcategoryClick(sub)}
                      className="cursor-pointer transition-colors duration-200 hover:bg-gray-100 p-2"
                    >
                      <div className="bg-white">
                        <div className="relative overflow-hidden aspect-video max-w-[350px] mx-auto">
                          <Image
                            src={
                              sub.mainImage?.url ||
                              "https://images.unsplash.com/photo-1441986300917-64674bd600d8"
                            }
                            alt={sub.mainImage?.alt || sub.name}
                            fill
                            className="object-cover "
                          />
                        </div>
                      </div>
                      <div className="mt-4 text-center max-w-[350px] mx-auto mb-6">
                        {/* Decorative separator */}
                        <div className="flex justify-center mb-2">
                          <span className="inline-block w-10 h-[2px] bg-gray-300 rounded-full"></span>
                        </div>

                        {/* Subcategory Name */}
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 tracking-wide">
                          {sub.name}
                        </h3>

                        {/* Description */}
                        {sub.description && (
                          <p className="text-sm text-gray-500 mt-2 leading-snug line-clamp-1">
                            {sub.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          </section>
        )}

        {/* Featured Products */}
        <section className="py-12 border-t border-gray-100">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Featured Products
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : currentError ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{currentError}</p>
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product: Product, index: number) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleProductClick(product)}
                    className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] transition-all duration-300"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={
                          product.galleryImages?.[0]?.url ||
                          product.mainImage?.url ||
                          "https://images.unsplash.com/photo-1441986300917-64674bd600d8"
                        }
                        alt={product.galleryImages?.[0]?.alt || product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₹
                          {product.finalPrice ||
                            product.price ||
                            product.originalPrice}
                        </span>
                        {product.originalPrice &&
                          product.finalPrice &&
                          product.finalPrice < product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No featured products available</p>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default CategoryPage;
