'use client';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';

export default function SearchModal({ isOpen, onClose, initialQuery = '' }) {
  const handleSearch = (searchText) => {
    try {
      localStorage.setItem('lastSearchQuery', searchText);

      window.dispatchEvent(
        new CustomEvent('searchQueryUpdated', {
          detail: { query: searchText },
        }),
      );
    } catch (error) {
      console.error('Error saving search query:', error);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="fixed top-0 left-0 right-0 h-[60px] bg-white shadow-lg"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 0.25,
                ease: 'easeOut',
                delay: 0.2,
              },
            }}
            exit={{
              opacity: 0,
              transition: {
                duration: 0.15,
                ease: 'easeIn',
              },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center h-full px-4 gap-3">
              <div className="flex-1">
                <SearchBar onSearch={handleSearch} autoFocus={true} initialQuery={initialQuery} />
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors duration-150"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
