'use client';

import { motion } from 'framer-motion';
import HeroBanner from '@/components/homepage/HeroBanner';
import CategoryGrid from '@/components/homepage/CategoryGrid';
import ProductShowcase from '@/components/homepage/ProductShowcase';
import RoomInspiration from '@/components/homepage/RoomInspiration';
import NewsletterSignup from '@/components/homepage/NewsletterSignup';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  return (
    <motion.main
      className="min-h-screen bg-white"
      initial="initial"
      animate="animate"
      variants={staggerChildren}
    >
      <motion.div variants={fadeInUp}>
        <HeroBanner />
      </motion.div>

      <motion.div variants={fadeInUp} className="py-6">
        <CategoryGrid />
      </motion.div>

      <div className="flex flex-col md:flex-col-reverse">
        <motion.div variants={fadeInUp} className="md:py-12">
          <RoomInspiration />
        </motion.div>

        <motion.div variants={fadeInUp} className="py-5 md:py-12">
          <ProductShowcase />
        </motion.div>
      </div>

      <motion.div variants={fadeInUp} className="py-16">
        <NewsletterSignup />
      </motion.div>
    </motion.main>
  );
}
