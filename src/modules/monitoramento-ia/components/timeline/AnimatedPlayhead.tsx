import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface AnimatedPlayheadProps {
  position: number;
  currentTime: Date;
  height: number;
}

export const AnimatedPlayhead = ({ position, currentTime, height }: AnimatedPlayheadProps) => {
  return (
    <motion.div
      className="absolute top-0 pointer-events-none z-20"
      style={{ left: position }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Triangle indicator */}
      <div className="absolute -top-1 -left-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-500" />
      
      {/* Vertical line with glow */}
      <div 
        className="w-0.5 bg-red-500 relative"
        style={{ height: `${height}px` }}
      >
        <div className="absolute inset-0 bg-red-500 blur-sm opacity-50" />
        <div className="absolute inset-0 bg-red-500 blur-md opacity-30" />
      </div>
      
      {/* Time label */}
      <motion.div
        className="absolute -top-8 -left-10 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
      >
        {format(currentTime, 'HH:mm:ss')}
      </motion.div>
    </motion.div>
  );
};
