"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface MoreInspirationIdeasProps {
  categoryName: string;
}

// Curated inspiration ideas based on category
const inspirationIdeas: Record<string, Array<{
  id: string;
  title: string;
  image: string;
  description: string;
  shopLink: string;
}>> = {
  "Living Room": [
    {
      id: "cozy-corner",
      title: "Cozy Reading Corner",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
      description: "Create a peaceful retreat with soft textures and warm lighting",
      shopLink: "/products?subcategory=chairs"
    },
    {
      id: "minimalist-setup",
      title: "Minimalist Setup",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
      description: "Clean lines and neutral tones for a serene living space",
      shopLink: "/products?subcategory=sofas"
    },
    {
      id: "entertainment-zone",
      title: "Entertainment Zone",
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=400&fit=crop",
      description: "Perfect setup for movie nights and gatherings",
      shopLink: "/products?subcategory=tv-stands"
    },
    {
      id: "bohemian-chic",
      title: "Bohemian Chic",
      image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
      description: "Eclectic patterns and vibrant colors for a worldly feel",
      shopLink: "/products?subcategory=rugs"
    },
    {
      id: "scandinavian-style",
      title: "Scandinavian Style",
      image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600&h=400&fit=crop",
      description: "Natural materials and functional beauty",
      shopLink: "/products?subcategory=coffee-tables"
    },
    {
      id: "modern-luxury",
      title: "Modern Luxury",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
      description: "Sophisticated elegance with premium finishes",
      shopLink: "/products?subcategory=shelving"
    }
  ],
  "Bedroom": [
    {
      id: "serene-sanctuary",
      title: "Serene Sanctuary",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop",
      description: "Create a peaceful retreat for ultimate relaxation",
      shopLink: "/products?subcategory=beds"
    },
    {
      id: "romantic-escape",
      title: "Romantic Escape",
      image: "https://images.unsplash.com/photo-1631079518889-e24c3b43cb48?w=600&h=400&fit=crop",
      description: "Soft textures and warm lighting for intimate moments",
      shopLink: "/products?subcategory=bedding"
    },
    {
      id: "modern-minimalist",
      title: "Modern Minimalist",
      image: "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=600&h=400&fit=crop",
      description: "Clean aesthetics for a clutter-free mind",
      shopLink: "/products?subcategory=nightstands"
    },
    {
      id: "cozy-retreat",
      title: "Cozy Retreat",
      image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
      description: "Warm textures and earthy tones for comfort",
      shopLink: "/products?subcategory=dressers"
    }
  ],
  "Dining Room": [
    {
      id: "formal-elegance",
      title: "Formal Elegance",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
      description: "Sophisticated dining for special occasions",
      shopLink: "/products?subcategory=dining-tables"
    },
    {
      id: "casual-family",
      title: "Casual Family Dining",
      image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600&h=400&fit=crop",
      description: "Comfortable spaces for everyday meals",
      shopLink: "/products?subcategory=dining-chairs"
    },
    {
      id: "breakfast-nook",
      title: "Breakfast Nook",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
      description: "Intimate spaces for morning coffee",
      shopLink: "/products?subcategory=bar-stools"
    },
    {
      id: "open-concept",
      title: "Open Concept",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
      description: "Seamless flow between kitchen and dining",
      shopLink: "/products?subcategory=sideboards"
    }
  ],
  "Home Office": [
    {
      id: "productive-workspace",
      title: "Productive Workspace",
      image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=600&h=400&fit=crop",
      description: "Organized and inspiring work environment",
      shopLink: "/products?subcategory=desks"
    },
    {
      id: "creative-studio",
      title: "Creative Studio",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
      description: "Space designed to spark creativity",
      shopLink: "/products?subcategory=office-chairs"
    },
    {
      id: "executive-office",
      title: "Executive Office",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
      description: "Professional setup for important meetings",
      shopLink: "/products?subcategory=bookcases"
    },
    {
      id: "home-library",
      title: "Home Library",
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=400&fit=crop",
      description: "Book lover's paradise with organized storage",
      shopLink: "/products?subcategory=bookcases"
    }
  ]
};

// Default ideas for categories not specifically defined
const defaultIdeas = [
  {
    id: "modern-aesthetic",
    title: "Modern Aesthetic",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    description: "Contemporary design with clean lines",
    shopLink: "/products"
  },
  {
    id: "natural-elements",
    title: "Natural Elements",
    image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=600&h=400&fit=crop",
    description: "Bring nature indoors with organic materials",
    shopLink: "/products"
  },
  {
    id: "industrial-charm",
    title: "Industrial Charm",
    image: "https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&h=400&fit=crop",
    description: "Raw materials with urban sophistication",
    shopLink: "/products"
  },
  {
    id: "cozy-comfort",
    title: "Cozy Comfort",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&h=400&fit=crop",
    description: "Warm and inviting spaces for relaxation",
    shopLink: "/products"
  }
];

const MoreInspirationIdeas = ({ categoryName }: MoreInspirationIdeasProps) => {
  const ideas = inspirationIdeas[categoryName] || defaultIdeas;

  return (
    <section className="bg-neutral-50 px-4 py-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4">
            More {categoryName} Ideas
          </h2>
          <p className="text-neutral-600">
            Explore different styles and find your perfect look
          </p>
        </motion.div>

        {/* 2-row grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ideas.map((idea, idx) => (
            <motion.div
              key={idea.id}
              className="group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100">
                <Image
                  src={idea.image}
                  alt={idea.title}
                  fill
                  className="object-cover transition duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition duration-300" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-lg font-medium mb-2">{idea.title}</h3>
                  <p className="text-sm opacity-90 mb-4">{idea.description}</p>
                  
                  <Link href={idea.shopLink}>
                    <motion.button
                      className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 text-sm font-medium rounded hover:bg-white/30 transition"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Shop This Look
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional CTA */}
        <motion.div
          className="flex justify-center mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link 
            href={`/products?category=${categoryName.toLowerCase()}`}
            className="bg-neutral-900 text-white px-8 py-3 font-medium hover:bg-neutral-800 transition"
          >
            Shop All {categoryName} Products
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default MoreInspirationIdeas;