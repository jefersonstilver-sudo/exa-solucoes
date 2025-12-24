import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface SortableDashboardCardProps {
  id: string;
  children: React.ReactNode;
}

export const SortableDashboardCard: React.FC<SortableDashboardCardProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={false}
      animate={{
        scale: isDragging ? 1.02 : 1,
        opacity: isDragging ? 0.9 : 1,
        boxShadow: isDragging 
          ? '0 20px 40px rgba(0,0,0,0.15)' 
          : '0 1px 3px rgba(0,0,0,0.05)'
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
        mass: 0.8
      }}
      className="cursor-grab active:cursor-grabbing will-change-transform"
    >
      {children}
    </motion.div>
  );
};

export default SortableDashboardCard;
