"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface RoomStyle {
  id: string;
  title: string;
  image: string;
  alt: string;
  description: string;
}

const roomStyles: RoomStyle[] = [
  {
    id: "living-room",
    title: "Living Room",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    alt: "Modern living room inspiration",
    description: "Create the perfect living space with our curated collection",
  },
  {
    id: "bedroom",
    title: "Bedroom",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop",
    alt: "Elegant bedroom design inspiration",
    description: "Transform your bedroom into a peaceful sanctuary",
  },
  {
    id: "dining-room",
    title: "Dining Room",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    alt: "Sophisticated dining room setup",
    description: "Design dining spaces that bring people together",
  },
  {
    id: "office",
    title: "Home Office",
    image:
      "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=600&fit=crop",
    alt: "Productive home office workspace",
    description: "Create an inspiring workspace that boosts productivity",
  },
  {
    id: "kitchen",
    title: "Kitchen",
    image:
      "https://i.pinimg.com/736x/03/3f/cc/033fcc1c91e7b7bd6d0306cc6fad4b5c.jpg",
    alt: "Modern kitchen design inspiration",
    description: "Design kitchens that are both beautiful and functional",
  },
  {
    id: "bathroom",
    title: "Bathroom",
    image:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop",
    alt: "Luxurious bathroom design",
    description: "Create a spa-like retreat in your own home",
  },
  {
    id: "outdoor",
    title: "Outdoor",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    alt: "Outdoor patio and garden inspiration",
    description: "Extend your living space to the great outdoors",
  },
  {
    id: "kids-room",
    title: "Kids Room",
    image:
      "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=800&h=600&fit=crop",
    alt: "Playful kids room design",
    description: "Create magical spaces where imagination thrives",
  },
];

const RoomInspiration = () => (
  <section className="px-4 max-w-7xl mx-auto">
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-2">
        Room Inspiration
      </h2>
      <p className="text-neutral-600 text-sm">
        Complete looks styled for every space
      </p>
    </motion.div>

    {/* Grid → 1 col mobile, 2 col tablet, 4 col desktop */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {roomStyles.map((room, idx) => (
        <motion.div
          key={room.id}
          className="group cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: idx * 0.1 }}
          whileHover={{ y: -4 }}
        >
          <Link href={`/inspiration/${room.id}`}>
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
              <Image
                src={room.image}
                alt={room.alt}
                fill
                className="object-cover transition duration-500 ease-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                priority={idx === 0}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition duration-300 flex items-center justify-center">
                <motion.button
                  className="opacity-0 group-hover:opacity-100 bg-white text-black px-5 py-2 text-sm font-medium shadow-md"
                  initial={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Shop This Look
                </motion.button>
              </div>
            </div>

            {/* Caption */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-neutral-900">
                {room.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {room.description}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>

    {/* CTA */}
    <motion.div
      className="flex justify-center mt-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <Link
        href="/inspiration"
        className="border border-neutral-900 text-neutral-900 px-6 py-2 text-sm font-medium hover:bg-neutral-900 hover:text-white transition"
      >
        View All Inspirations
      </Link>
    </motion.div>
  </section>
);

export default RoomInspiration;
