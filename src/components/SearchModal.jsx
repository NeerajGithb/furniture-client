"use client";
import { X, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const suggestions = [
  "Wooden Sofa Sets",
  "Office Chairs",
  "Dining Tables",
  "TV Units",
  "Bookshelves",
  "Wardrobes",
  "Premium Beds",
];

export default function SearchModal({ isOpen, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className='w-full h-full bg-white px-5 py-6 sm:px-10 sm:py-8 rounded-none relative overflow-y-auto'
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className='absolute top-4 right-4 text-gray-600 hover:text-black transition'
              aria-label='Close search'
            >
              <X size={22} />
            </button>

            {/* Search Input */}
            <div className='mt-8 sm:mt-10 flex items-center gap-2 border border-gray-300 rounded-md px-4 py-2 shadow-sm'>
              <Search className='text-gray-400' size={18} />
              <input
                ref={inputRef}
                type='text'
                placeholder='Search furniture, categories...'
                className='w-full focus:outline-none text-sm'
              />
            </div>

            {/* Suggestions */}
            <div className='mt-8'>
              <p className='text-xs font-semibold text-gray-500 mb-3'>Popular Searches</p>
              <div className='flex flex-wrap gap-2'>
                {suggestions.map((item) => (
                  <button
                    key={item}
                    className='text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition'
                    onClick={() => {
                      console.log("Search for:", item);
                      onClose();
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
