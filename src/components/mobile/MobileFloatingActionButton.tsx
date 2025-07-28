
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileFloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

const MobileFloatingActionButton = ({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label,
  className,
  variant = 'primary'
}: MobileFloatingActionButtonProps) => {
  const baseClasses = cn(
    'fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40',
    'hover:shadow-xl transition-all duration-300',
    variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white hover:bg-gray-50',
    className
  );

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.3
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        onClick={onClick}
        className={baseClasses}
        size="icon"
      >
        <motion.div
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      </Button>
      
      {label && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
        >
          {label}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MobileFloatingActionButton;
