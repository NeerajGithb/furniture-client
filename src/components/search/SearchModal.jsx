"use client";
import { X, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";

const suggestions = [
  { text: "Wooden Sofa Sets", category: "Living Room", trending: true },
  { text: "Office Chairs", category: "Office", trending: false },
  { text: "Dining Tables", category: "Dining", trending: true },
  { text: "TV Units", category: "Entertainment", trending: false },
  { text: "Premium Beds", category: "Bedroom", trending: true },
  { text: "Bookshelves", category: "Storage", trending: false },
];

const categories = ["Living Room", "Bedroom", "Dining", "Office", "Storage", "Decor"];

export default function SearchModal({ isOpen, onClose }) {
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(recent.slice(0, 4));
      } catch {
        setRecentSearches([]);
      }
    }
  }, [isOpen]);

  const handleSuggestionClick = (text) => {
    try {
      localStorage.setItem('lastSearchQuery', text);
    } catch {}
    onClose();
  };

  const handleRecentSearch = (search) => {
    try {
      localStorage.setItem('lastSearchQuery', search);
    } catch {}
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className='fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className='w-full h-full bg-white px-4 py-6 sm:px-8 sm:py-8 relative overflow-y-auto'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className='flex items-center justify-between mb-6'>
              <div>
                <h1 className='text-xl font-bold text-black'>Search Furniture</h1>
                <p className='text-gray-600 text-sm mt-1'>Find your perfect pieces</p>
              </div>
              <button
                onClick={onClose}
                className='p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xs'
              >
                <X size={20} />
              </button>
            </div>

            <div className='mb-6'>
              <SearchBar onSearch={handleSuggestionClick} />
            </div>

            <div className='space-y-6'>
              {recentSearches.length > 0 && (
                <div>
                  <div className='flex items-center gap-2 mb-3'>
                    <Clock size={16} className='text-gray-400' />
                    <h3 className='text-sm font-medium text-black'>Recent</h3>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentSearch(search)}
                        className='px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-black rounded-xs'
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className='flex items-center gap-2 mb-3'>
                  <TrendingUp size={16} className='text-gray-400' />
                  <h3 className='text-sm font-medium text-black'>Popular</h3>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.text}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className='flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-xs'
                    >
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-black'>{suggestion.text}</span>
                          {suggestion.trending && (
                            <span className='px-1.5 py-0.5 bg-black text-white text-xs rounded'>
                              Hot
                            </span>
                          )}
                        </div>
                        <div className='text-xs text-gray-500'>{suggestion.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium text-black mb-3'>Categories</h3>
                <div className='grid grid-cols-3 gap-2'>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleSuggestionClick(category)}
                      className='p-2 text-xs text-center bg-gray-50 hover:bg-gray-100 text-black rounded-xs'
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className='mt-8 pt-4 border-t text-center text-xs text-gray-500'>
              Press ESC to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}