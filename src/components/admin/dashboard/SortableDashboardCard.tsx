import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface SortableDashboardCardProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
}

export const SortableDashboardCard: React.FC<SortableDashboardCardProps> = ({ id, children, isDragging: isOverlayDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id,
    transition: {
      duration: 400,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 450ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  // Placeholder pulsante quando arrastando
  if (isDragging) {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0.4, scale: 0.98 }}
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [0.97, 0.99, 0.97],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 min-h-[200px]"
      />
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      layoutId={id}
      initial={false}
      animate={{
        scale: isOver ? 1.02 : 1,
        y: isOver ? -6 : 0,
        opacity: 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 28,
        mass: 1.3,
        restDelta: 0.001
      }}
      className="relative will-change-transform"
    >
      {/* Drag Handle - Botão dedicado para arrastar */}
      <motion.div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        whileHover={{
          scale: 1.1,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        }}
        whileTap={{
          scale: 1.2,
          backgroundColor: 'rgba(0, 0, 0, 0.12)',
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg cursor-grab active:cursor-grabbing 
                   bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100
                   opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all duration-200
                   touch-none"
        style={{ opacity: 1 }}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </motion.div>
      
      {/* Card Content */}
      <div className="group">
        {children}
      </div>
    </motion.div>
  );
};

export default SortableDashboardCard;
