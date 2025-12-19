import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SofiaVoiceModal from './SofiaVoiceModal';

interface SofiaVoiceButtonProps {
  className?: string;
}

const SofiaVoiceButton: React.FC<SofiaVoiceButtonProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 md:w-16 md:h-16
          rounded-full
          bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500
          shadow-lg shadow-purple-500/30
          flex items-center justify-center
          cursor-pointer
          transition-all duration-300
          hover:shadow-xl hover:shadow-purple-500/40
          group
          ${className}
        `}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          delay: 0.5 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse Animation Ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Secondary Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50 blur-lg group-hover:blur-xl transition-all duration-300" />

        {/* Icon Container */}
        <motion.div
          className="relative z-10 flex items-center justify-center"
          animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-lg" />
        </motion.div>

        {/* Floating particles */}
        <AnimatePresence>
          {isHovered && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0,
                    scale: 0 
                  }}
                  animate={{ 
                    x: Math.cos(i * 60 * Math.PI / 180) * 30,
                    y: Math.sin(i * 60 * Math.PI / 180) * 30,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1 
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && !isModalOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="fixed bottom-8 right-24 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Falar com Sofia
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <SofiaVoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default SofiaVoiceButton;
