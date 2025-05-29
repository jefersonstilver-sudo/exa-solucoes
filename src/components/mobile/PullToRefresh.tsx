
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  isRefreshing: boolean;
  isPulling: boolean;
  pullDistance: number;
  threshold?: number;
  className?: string;
}

const PullToRefresh = ({
  isRefreshing,
  isPulling,
  pullDistance,
  threshold = 80,
  className
}: PullToRefreshProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = isPulling || isRefreshing;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ 
            opacity: isPulling ? progress : 1, 
            y: isPulling ? Math.min(pullDistance - 50, 30) : 10 
          }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50 flex justify-center pt-4',
            className
          )}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border">
            <motion.div
              animate={{ 
                rotate: isRefreshing ? 360 : progress * 180 
              }}
              transition={{ 
                duration: isRefreshing ? 1 : 0.1,
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear'
              }}
            >
              <RefreshCw className="h-5 w-5 text-indexa-purple" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PullToRefresh;
