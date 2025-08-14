'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

interface Product {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    alt: string;
}

const products: Product[] = [
    {
        id: 1,
        name: 'Minimalist Oak Chair',
        price: 299,
        originalPrice: 399,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
        alt: 'Oak wooden chair'
    },
    {
        id: 2,
        name: 'Nordic Coffee Table',
        price: 449,
        image: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=300&h=300&fit=crop',
        alt: 'Nordic style coffee table'
    },
    {
        id: 3,
        name: 'Zen Storage Unit',
        price: 599,
        originalPrice: 699,
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=300&h=300&fit=crop',
        alt: 'Zen storage cabinet'
    },
    {
        id: 4,
        name: 'Modern Desk Lamp',
        price: 129,
        image: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?q=80&w=1170&auto=format&fit=crop',
        alt: 'Modern desk lamp'
    },
    {
        id: 5,
        name: 'Leather Lounge Chair',
        price: 899,
        originalPrice: 1099,
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300&h=300&fit=crop',
        alt: 'Leather lounge chair'
    },
    {
        id: 6,
        name: 'Floating Nightstand',
        price: 199,
        image: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=300&h=300&fit=crop',
        alt: 'Floating nightstand'
    }
];

const ProductShowcase = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const itemsPerView = 4;
    const maxIndex = Math.max(0, products.length - itemsPerView);

    const nextSlide = () => {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    return (
        <section className="px-4 max-w-6xl mx-auto">
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-2xl md:text-3xl font-light text-black mb-2">
                    Featured Products
                </h2>
                <p className="text-gray-600 text-sm">
                    Handpicked pieces for discerning taste
                </p>
            </motion.div>

            <div className="relative">
                <div className="overflow-hidden">
                    <motion.div
                        className="flex gap-4 transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
                    >
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                className="flex-shrink-0 w-1/2 md:w-1/4 group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="relative aspect-square overflow-hidden bg-gray-100 mb-3">
                                    <Image
                                        src={product.image}
                                        alt={product.alt}
                                        fill
                                        className="object-cover  transition-all duration-500"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xs md:text-sm font-medium text-black mb-1 line-clamp-2">
                                        {product.name}
                                    </h3>
                                    <div className="flex justify-center items-center gap-2">
                                        <span className="text-sm md:text-base font-medium text-black">
                                            ₹{product.price}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-xs text-gray-500 line-through">
                                                ₹{product.originalPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {currentIndex > 0 && (
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {currentIndex < maxIndex && (
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="text-center mt-8">
                <motion.button
                    onClick={() => window.location.href = '/products'}
                    className="border border-black text-black px-6 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    View All Products
                </motion.button>
            </div>
        </section>
    );
};

export default ProductShowcase;