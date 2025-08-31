"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface CategoryGridProps {
  categories: Category[];
  loading: boolean;
}

// Category images mapping
const categoryImages: Record<string, string> = {
  "living-room": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
  "bedroom": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
  "dining-room": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "office": "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=600&fit=crop",
  "kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
  "bathroom": "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop",
  "outdoor": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
  "kids-room": "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=800&h=600&fit=crop",
  "home-office": "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=600&fit=crop",
  "entryway": "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop",
  "laundry": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
  "storage": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=600&fit=crop",
  "default": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop"
};

// Category descriptions
const categoryDescriptions: Record<string, string> = {
  "living-room": "Create the perfect living space with our curated collection",
  "bedroom": "Transform your bedroom into a peaceful sanctuary",
  "dining-room": "Design dining spaces that bring people together",
  "office": "Create an inspiring workspace that boosts productivity",
  "home-office": "Create an inspiring workspace that boosts productivity",
  "kitchen": "Design kitchens that are both beautiful and functional",
  "bathroom": "Create a spa-like retreat in your own home",
  "outdoor": "Extend your living space to the great outdoors",
  "kids-room": "Create magical spaces where imagination thrives",
  "entryway": "Make a great first impression with your entrance",
  "laundry": "Transform utility spaces into organized havens",
  "storage": "Smart solutions for organized living",
  "default": "Discover beautiful furniture and decor for your space"
};

const CategoryGrid = ({ categories, loading }: CategoryGridProps) => {
  if (loading) {
    return (
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="h-8 bg-neutral-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 rounded w-48 mx-auto animate-pulse"></div>
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

  if (categories.length === 0) {
    return (
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
            Explore by Room
          </h2>
          <p className="text-neutral-600 mb-8">
            No categories available at the moment. Please check back later.
          </p>
          <Link 
            href="/products" 
            className="bg-neutral-900 text-white px-6 py-3 font-medium hover:bg-neutral-800 transition"
          >
            Browse All Products
          </Link>
        </div>
      </section>
    );
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
          Explore by Room
        </h2>
        <p className="text-neutral-600">
          Find inspiration for every space in your home
        </p>
      </motion.div>

      {/* Categories Grid - 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category, idx) => {
          const imageUrl = categoryImages[category.slug] || categoryImages["default"];
          const description = categoryDescriptions[category.slug] || categoryDescriptions["default"];
          
          return (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Link href={`/inspiration/${category.slug}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden bg-neutral-100 rounded-lg">
                    <Image
                      src={imageUrl}
                      alt={`${category.name} inspiration`}
                      fill
                      className="object-cover transition duration-500 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      priority={idx < 4}
                    />
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 flex items-center justify-center">
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 text-white text-center px-4"
                        initial={{ scale: 0.9 }}
                        whileHover={{ scale: 1 }}
                      >
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                          <span className="text-sm font-medium">Explore Ideas</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-700 transition">
                      {category.name}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* View All Categories CTA */}
      <motion.div
        className="flex justify-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Link 
          href="/products" 
          className="border border-neutral-900 text-neutral-900 px-8 py-3 font-medium hover:bg-neutral-900 hover:text-white transition"
        >
          Shop All Categories
        </Link>
      </motion.div>
    </section>
  );
};

export default CategoryGrid;