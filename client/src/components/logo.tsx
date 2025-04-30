import React from 'react';
import { motion } from 'framer-motion';

// Cute mouse logo that forms the letter "r"
export const RaccoonLogo: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => {
  return (
    <div className={`relative ${className}`}>
      <motion.div
        className="relative w-full h-full text-white"
      >
        {/* Body - smaller and rounder for mouse */}
        <motion.div 
          className="absolute w-[35%] h-[50%] bg-white rounded-full border border-gray-300 left-[10%] top-[40%]"
          style={{borderColor: 'gray'}}
        />
        
        {/* Head - larger for a mouse with more pronounced snout */}
        <motion.div 
          className="absolute w-[40%] h-[40%] bg-white rounded-full border border-gray-300 left-[10%] top-[10%]"
          style={{borderColor: 'gray'}}
        />

        {/* Snout - distinctive pointed mouse snout */}
        <motion.div 
          className="absolute w-[20%] h-[15%] bg-white rounded-full border border-gray-300 left-[25%] top-[30%]"
          style={{borderColor: 'gray'}}
        />

        {/* Eyes - larger and more cartoonish for a cute mouse */}
        <motion.div className="absolute w-[8%] h-[8%] bg-black rounded-full left-[18%] top-[22%]" />
        <motion.div className="absolute w-[8%] h-[8%] bg-black rounded-full left-[34%] top-[22%]" />

        {/* Eye highlights */}
        <motion.div className="absolute w-[3%] h-[3%] bg-white rounded-full left-[19%] top-[22%]" />
        <motion.div className="absolute w-[3%] h-[3%] bg-white rounded-full left-[35%] top-[22%]" />

        {/* Ears - much larger and more circular for a mouse */}
        <motion.div className="absolute w-[20%] h-[20%] bg-white rounded-full border border-gray-300 left-[5%] top-[0%]" 
          style={{borderColor: 'gray'}}
        />
        <motion.div className="absolute w-[20%] h-[20%] bg-white rounded-full border border-gray-300 left-[35%] top-[0%]" 
          style={{borderColor: 'gray'}}
        />

        {/* Inner ears - larger and pink */}
        <motion.div className="absolute w-[14%] h-[14%] bg-pink-200 rounded-full left-[8%] top-[3%]" />
        <motion.div className="absolute w-[14%] h-[14%] bg-pink-200 rounded-full left-[38%] top-[3%]" />

        {/* Nose - small and black */}
        <motion.div className="absolute w-[6%] h-[6%] bg-black rounded-full left-[32%] top-[32%]" />

        {/* Whiskers - more delicate and longer for a mouse */}
        <motion.div className="absolute w-[20%] h-[0.6%] bg-gray-400 left-[38%] top-[30%] rounded-md" />
        <motion.div className="absolute w-[20%] h-[0.6%] bg-gray-400 left-[38%] top-[33%] rounded-md rotate-5" />
        <motion.div className="absolute w-[20%] h-[0.6%] bg-gray-400 left-[38%] top-[36%] rounded-md rotate-10" />
        
        {/* Left side whiskers */}
        <motion.div className="absolute w-[18%] h-[0.6%] bg-gray-400 left-[2%] top-[30%] rounded-md" />
        <motion.div className="absolute w-[18%] h-[0.6%] bg-gray-400 left-[2%] top-[33%] rounded-md -rotate-5" />
        <motion.div className="absolute w-[18%] h-[0.6%] bg-gray-400 left-[2%] top-[36%] rounded-md -rotate-10" />

        {/* Paws - small and cute */}
        <motion.div className="absolute w-[8%] h-[8%] bg-white rounded-full border border-gray-300 left-[12%] top-[80%]" 
          style={{borderColor: 'gray'}}
        />
        <motion.div className="absolute w-[8%] h-[8%] bg-white rounded-full border border-gray-300 left-[30%] top-[80%]" 
          style={{borderColor: 'gray'}}
        />
      </motion.div>
    </div>
  );
};

// Combined RAD.r logo with the r as a mouse
export const AppLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-bold text-xl mr-1">RAD</span>
      <span className="text-xl">.</span>
      <RaccoonLogo className="h-10 w-8" />
    </div>
  );
};