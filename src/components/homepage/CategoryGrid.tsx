'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Category {
    id: number;
    name: string;
    image: string;
    alt: string;
}
const categories: Category[] = [
    {
        id: 1,
        name: 'Seating',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        alt: 'Modern chair collection',
    },
    {
        id: 2,
        name: 'Tables',
        image: 'https://images.unsplash.com/photo-1550226891-ef816aed4a98?w=400&h=300&fit=crop',
        alt: 'Dining table collection',
    },
    {
        id: 3,
        name: 'Storage',
        image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&h=300&fit=crop',
        alt: 'Modern storage cabinet',
    },
    {
        id: 4,
        name: 'Bedroom',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop',
        alt: 'Stylish bedroom furniture',
    },
    {
        id: 5,
        name: 'Office',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
        alt: 'Ergonomic office setup',
    },
    {
        id: 6,
        name: 'Lighting',
        image: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=300&fit=crop',
        alt: 'Modern lighting fixture',
    },
    {
        id: 7,
        name: 'Outdoor',
        image: 'https://images.unsplash.com/photo-1601628828688-632f38a5a7d0?w=400&h=300&fit=crop',
        alt: 'Outdoor patio furniture',
    },
    {
        id: 8,
        name: 'Kitchen',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        alt: 'Modern kitchen interior',
    },
    {
        id: 9,
        name: 'Decor',
        image: 'https://images.unsplash.com/photo-1615874694520-474822394e73?q=80&w=880&auto=format&fit=crop',
        alt: 'Home decor items',
    },
    {
        id: 10,
        name: 'Rugs',
        image: 'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=400&h=300&fit=crop',
        alt: 'Patterned area rug',
    },
    {
        id: 11,
        name: 'Shelves',
        image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=400&h=300&fit=crop',
        alt: 'Wall shelving units',
    },
    {
        id: 12,
        name: 'Mirrors',
        image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop',
        alt: 'Decorative mirror',
    }
];

const CategoryGrid = () => {
    return (
        <section className="px-4 max-w-7xl mx-auto">
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-2xl md:text-3xl font-light text-black mb-2 tracking-wide">
                    Shop by Category
                </h2>
                <p className="text-gray-500 text-sm">
                    Curated collections for every space
                </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {categories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        className="group cursor-pointer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                    >
                        <div className="relative aspect-square overflow-hidden bg-gray-100  shadow-sm">
                            <Image
                                src={category.image}
                                alt={category.alt}
                                fill
                                className="object-cover  transition-all duration-500"
                                loading="lazy"
                            />
                        </div>
                        <div className="py-3 text-center">
                            <h3 className="text-sm md:text-base font-medium text-black group-hover:text-gray-700 transition-colors tracking-wide">
                                {category.name}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default CategoryGrid;
