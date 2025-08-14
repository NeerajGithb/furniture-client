'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface RoomStyle {
    id: number;
    title: string;
    image: string;
    alt: string;
    products: string[];
}

const roomStyles: RoomStyle[] = [
    {
        id: 1,
        title: 'Scandinavian Living',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=400&fit=crop',
        alt: 'Scandinavian living room setup',
        products: ['Oak Coffee Table', 'Linen Sofa', 'Pendant Light'],
    },
    {
        id: 2,
        title: 'Modern Workspace',
        image: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=500&h=400&fit=crop',
        alt: 'Modern home office setup',
        products: ['Standing Desk', 'Ergonomic Chair', 'Task Lighting'],
    },
    {
        id: 3,
        title: 'Minimalist Bedroom',
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&h=400&fit=crop',
        alt: 'Minimalist bedroom design',
        products: ['Platform Bed', 'Floating Nightstand', 'Floor Lamp'],
    },
];

const RoomInspiration = () => (
    <section className="px-4 max-w-6xl mx-auto">
        <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-2">
                Room Inspiration
            </h2>
            <p className="text-neutral-600 text-sm">
                Complete looks for your space
            </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roomStyles.map((room, idx) => (
                <motion.div
                    key={room.id}
                    className="group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                    whileHover={{ y: -4 }}
                >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100">
                        <Image
                            src={room.image}
                            alt={room.alt}
                            fill
                            className="object-cover transition duration-500 ease-out group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority={idx === 0}
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition duration-300 flex items-center justify-center">
                            <motion.button
                                className="opacity-0 group-hover:opacity-100 bg-white text-black px-5 py-2 text-sm font-medium rounded"
                                initial={{ scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Shop This Look
                            </motion.button>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <h3 className="text-lg font-medium text-neutral-900">{room.title}</h3>
                        <p className="text-xs text-neutral-500 mt-1">
                            {room.products.join(' • ')}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>

        <motion.div
            className="flex justify-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
        >
            <button className="border border-neutral-900 text-neutral-900 px-6 py-2 text-sm font-medium rounded hover:bg-neutral-900 hover:text-white transition">
                View All Inspirations
            </button>
        </motion.div>
    </section>
);

export default RoomInspiration;