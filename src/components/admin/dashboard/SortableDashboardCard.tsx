import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

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
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 300ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  // Show placeholder when this card is being dragged
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 min-h-[200px] transition-all duration-300"
      />
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={false}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }}
      className="cursor-grab active:cursor-grabbing will-change-transform"
    >
      {children}
    </motion.div>
  );
};

export default SortableDashboardCard;