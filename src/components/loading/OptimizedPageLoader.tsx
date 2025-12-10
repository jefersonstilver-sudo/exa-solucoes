import React from 'react';
import OptimizedSpinner from '@/components/ui/OptimizedSpinner';
import { cn } from '@/lib/utils';

interface OptimizedPageLoaderProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Lightweight page loader using CSS-only animations
 * Replaces heavy Framer Motion loaders
 */
const OptimizedPageLoader: React.FC<OptimizedPageLoaderProps> = ({
  message = 'Carregando...',
  className,
  size = 'lg'
}) => {
  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-background/95 backdrop-blur-sm',
        'animate-fade-in',
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <OptimizedSpinner size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} />
        
        {message && (
          <p className="text-sm text-muted-foreground animate-fade-in">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default OptimizedPageLoader;
