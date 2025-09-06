import React from "react";
import { motion } from "framer-motion";

const GridSkeleton = () => (
  <div className="">
    <div className="flex items-center justify-center w-full h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-black"
          ></motion.div>
        </div>

        {/* Loading text with shimmer */}
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-lg font-medium text-gray-700 tracking-wide"
        >
          Loading products...
        </motion.div>

        {/* Progress bar style shimmer */}
        <div className="w-48 h-2 bg-gray-200 rounded overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-1/2 h-full bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400"
          ></motion.div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default GridSkeleton;