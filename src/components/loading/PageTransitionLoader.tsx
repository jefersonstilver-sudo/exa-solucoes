import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
}

const PageTransitionLoader: React.FC<PageTransitionLoaderProps> = ({
  isLoading,
  children,
  loadingMessage = "Carregando página..."
}) => {
  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-primary/95 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className="text-center">
              {/* Mini logo */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 mx-auto mb-4 relative"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-white/30 border-t-white rounded-full"
                />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">EXA</span>
                </div>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-white font-medium"
              >
                {loadingMessage}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PageTransitionLoader;