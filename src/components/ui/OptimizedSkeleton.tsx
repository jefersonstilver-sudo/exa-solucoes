import React from 'react';
import { cn } from "@/lib/utils";

interface OptimizedSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'hero';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

/**
 * Optimized skeleton loader using pure CSS shimmer animation
 * No JavaScript animation overhead
 */
const OptimizedSkeleton: React.FC<OptimizedSkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className,
  animate = true
}) => {
  const variantClasses = {
    text: 'h-4 w-3/4 rounded',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-lg',
    card: 'h-48 w-full rounded-xl',
    hero: 'h-[40vh] w-full rounded-2xl'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'bg-muted/60 relative overflow-hidden',
        variantClasses[variant],
        className
      )}
      style={style}
    >
      {animate && (
        <div 
          className="absolute inset-0 animate-shimmer"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// Compound components for common patterns
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <OptimizedSkeleton 
        key={i} 
        variant="text" 
        className={i === lines - 1 ? 'w-1/2' : 'w-full'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3 p-4 bg-card rounded-xl border', className)}>
    <OptimizedSkeleton variant="rectangular" height={120} className="w-full" />
    <SkeletonText lines={2} />
  </div>
);

export default OptimizedSkeleton;
