import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'white' | 'minimal';
  showText?: boolean;
  text?: string;
  className?: string;
}

const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  showText = false,
  text = 'Carregando...',
  className
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const variantStyles = {
    primary: {
      spinner: 'border-primary/20 border-t-primary',
      text: 'text-primary'
    },
    white: {
      spinner: 'border-white/20 border-t-white',
      text: 'text-white'
    },
    minimal: {
      spinner: 'border-muted/20 border-t-foreground',
      text: 'text-foreground'
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={cn(
          "border-2 rounded-full",
          sizeMap[size],
          currentVariant.spinner
        )}
      />
      
      {showText && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "font-medium",
            textSizeMap[size],
            currentVariant.text
          )}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default EnhancedLoadingSpinner;