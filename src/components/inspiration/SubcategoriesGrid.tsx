"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  categoryId: {
    _id: string;
    name: string;
    slug: string;
  };
}

interface SubcategoriesGridProps {
  subcategories: SubCategory[];
  loading: boolean;
}

// Default images for subcategories
const subcategoryImages: Record<string, string> = {
  // Living Room
  "sofas": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
  "chairs": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
  "coffee-tables": "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop",
  "side-tables": "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop",
  "tv-stands": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop",
  "shelving": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "lighting": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
  "rugs": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
  
  // Bedroom
  "beds": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
  "nightstands": "https://images.unsplash.com/photo-1631079518889-e24c3b43cb48?w=400&h=300&fit=crop",
  "dressers": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
  "wardrobes": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
  "mattresses": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
  "bedding": "https://images.unsplash.com/photo-1631079518889-e24c3b43cb48?w=400&h=300&fit=crop",

  // Dining Room
  "dining-tables": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
  "dining-chairs": "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop",
  "bar-stools": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
  "sideboards": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "china-cabinets": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop",

  // Office
  "desks": "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop",
  "office-chairs": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
  "bookcases": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "filing-cabinets": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop",

  // Default fallback
  "default": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop"
};

const SubcategoriesGrid = ({ subcategories, loading }: SubcategoriesGridProps) => {
  if (loading) {
    return (
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
            Shop by Category
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="aspect-square bg-neutral-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-neutral-200 rounded mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (subcategories.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-16 max-w-7xl mx-auto">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
          Shop by Category
        </h2>
        <p className="text-neutral-600">
          Find exactly what you need for your space
        </p>
      </motion.div>

      {/* 2-row grid layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {subcategories.map((subcategory, idx) => {
          const imageUrl = subcategoryImages[subcategory.slug] || subcategoryImages["default"];
          
          return (
            <motion.div
              key={subcategory._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Link href={`/products?subcategory=${subcategory.slug}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden bg-neutral-100 rounded-lg">
                    <Image
                      src={imageUrl}
                      alt={`${subcategory.name} subcategory`}
                      fill
                      className="object-cover transition duration-500 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300 flex items-center justify-center">
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 text-white"
                        initial={{ scale: 0.9 }}
                        whileHover={{ scale: 1 }}
                      >
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                          <span className="text-sm font-medium">Shop Now</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Subcategory Info */}
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-700 transition">
                      {subcategory.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default SubcategoriesGrid;