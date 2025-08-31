"use client";

import { useProductStore } from "@/stores/productStore";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

interface RelatedInspirationsProps {
  currentCategoryId: string;
}

const inspirationCategories = [
  {
    id: "living-room",
    title: "Living Room",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
    alt: "Living Room inspiration"
  },
  {
    id: "bedroom", 
    title: "Bedroom",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop",
    alt: "Bedroom inspiration"
  },
  {
    id: "dining-room",
    title: "Dining Room", 
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
    alt: "Dining Room inspiration"
  },
  {
    id: "office",
    title: "Home Office",
    image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=600&h=400&fit=crop", 
    alt: "Home Office inspiration"
  },
  {
    id: "kitchen",
    title: "Kitchen",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
    alt: "Kitchen inspiration"
  },
  {
    id: "bathroom",
    title: "Bathroom",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop",
    alt: "Bathroom inspiration"
  },
  {
    id: "outdoor",
    title: "Outdoor",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
    alt: "Outdoor inspiration"
  },
  {
    id: "kids-room",
    title: "Kids Room",
    image: "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=600&h=400&fit=crop",
    alt: "Kids Room inspiration"
  }
];

const RelatedInspirations = ({ currentCategoryId }: RelatedInspirationsProps) => {
  const { categories, fetchCategories } = useProductStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter out current category and show max 6 related categories
  const relatedCategories = inspirationCategories
    .filter(cat => cat.id !== currentCategoryId)
    .slice(0, 6);

  if (relatedCategories.length === 0) {
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
          Explore Other Rooms
        </h2>
        <p className="text-neutral-600">
          Continue your design journey with more inspiration
        </p>
      </motion.div>

      {/* Related categories grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
        {relatedCategories.map((category, idx) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
          >
            <Link href={`/inspiration/${category.id}`}>
              <div className="group cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 rounded-lg">
                  <Image
                    src={category.image}
                    alt={category.alt}
                    fill
                    className="object-cover transition duration-500 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 flex items-center justify-center">
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 text-white text-center"
                      initial={{ scale: 0.9 }}
                      whileHover={{ scale: 1 }}
                    >
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                        <span className="text-sm font-medium">Explore {category.title}</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Category Info */}
                <div className="mt-4 text-center">
                  <h3 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-700 transition">
                    {category.title}
                  </h3>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Browse all CTA */}
      <motion.div
        className="flex justify-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Link 
          href="/inspiration"
          className="border border-neutral-900 text-neutral-900 px-8 py-3 font-medium hover:bg-neutral-900 hover:text-white transition"
        >
          Browse All Room Inspiration
        </Link>
      </motion.div>
    </section>
  );
};

export default RelatedInspirations;