'use client';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorMessage = ({ message, onClose, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key="error-block"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className={`mt-3 w-full rounded-sm bg-red-50 border border-red-200 p-3 text-sm text-red-700 shadow-sm flex flex-col gap-3 ${className}`}
        >
          <div className="flex items-start justify-between gap-2">
            {/* Icon + Message */}
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M12 19a7 7 0 100-14 7 7 0 000 14z"
                />
              </svg>
              <span>{message}</span>
            </div>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 text-red-500 hover:text-red-700 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorMessage;
