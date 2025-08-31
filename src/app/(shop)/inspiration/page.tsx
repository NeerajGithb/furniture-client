"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import CategoryGrid from "@/components/inspiration/CategoryGrid";
import { useProductStore } from "@/stores/productStore";

const InspirationPage = () => {
  const { categories, fetchCategories, loadingCategories } = useProductStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <motion.section 
        className="relative h-[60vh] flex items-center justify-center bg-gradient-to-r from-neutral-50 to-neutral-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="text-center px-4">
          <motion.h1 
            className="text-4xl md:text-6xl font-light text-neutral-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Room Inspiration
          </motion.h1>
          <motion.p 
            className="text-lg text-neutral-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover carefully curated room designs and shop the complete looks that inspire your perfect space
          </motion.p>
        </div>
      </motion.section>

      {/* Inspiration Categories Grid */}
      <CategoryGrid categories={categories} loading={loadingCategories} />

      {/* Featured Room Styles */}
      <section className="bg-neutral-50 px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
              Featured Styles
            </h2>
            <p className="text-neutral-600">
              Popular design aesthetics to inspire your next project
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                style: "Scandinavian",
                image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
                description: "Clean lines, natural materials, and minimalist beauty"
              },
              {
                style: "Industrial",
                image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=600&fit=crop",
                description: "Raw materials and urban-inspired design elements"
              },
              {
                style: "Bohemian",
                image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop",
                description: "Eclectic patterns and globally-inspired textures"
              }
            ].map((style, idx) => (
              <motion.div
                key={style.style}
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                whileHover={{ y: -4 }}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100">
                  <Image
                    src={style.image}
                    alt={`${style.style} design inspiration`}
                    fill
                    className="object-cover transition duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-300" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-medium mb-2">{style.style}</h3>
                    <p className="text-sm opacity-90">{style.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default InspirationPage;