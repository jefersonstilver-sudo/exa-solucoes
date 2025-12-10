import React from 'react';
import { cn } from "@/lib/utils";

interface OptimizedSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'white' | 'muted';
}

/**
 * Optimized CSS-only spinner - No Framer Motion dependency
 * Uses hardware-accelerated CSS animations for 60fps performance
 */
const OptimizedSpinner: React.FC<OptimizedSpinnerProps> = ({ 
  size = 'md',
  className,
  color = 'primary'
}) => {
  const sizeClasses = {
    xs: 'h-4 w-4 border-2',
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  const colorClasses = {
    primary: 'border-primary/30 border-t-primary',
    white: 'border-white/30 border-t-white',
    muted: 'border-muted-foreground/30 border-t-muted-foreground'
  };

  return (
    <div
      className={cn(
        'rounded-full loading-spinner gpu-accelerated',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Carregando"
    />
  );
};

export default OptimizedSpinner;
