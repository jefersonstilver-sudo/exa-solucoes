
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import React from 'react';
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'image' | 'button' | 'avatar' | 'hero';
  lines?: number;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'text',
  lines = 1,
  animate = true
}) => {
  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700',
    animate && 'animate-pulse',
    className
  );

  const variants = {
    text: 'h-4 rounded',
    card: 'h-48 rounded-lg',
    image: 'aspect-video rounded-lg',
    button: 'h-10 rounded-md',
    avatar: 'w-10 h-10 rounded-full',
    hero: 'h-96 rounded-xl'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variants.text,
              index === lines - 1 && 'w-3/4' // Última linha menor
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, variants[variant])} />
  );
};

// Skeleton específicos para componentes
export const HeroSkeleton = () => (
  <div className="space-y-4 p-4">
    <SkeletonLoader variant="hero" />
    <SkeletonLoader variant="text" lines={3} />
    <SkeletonLoader variant="button" className="w-48" />
  </div>
);

export const CardSkeleton = () => (
  <div className="space-y-3 p-4">
    <SkeletonLoader variant="image" />
    <SkeletonLoader variant="text" lines={2} />
    <SkeletonLoader variant="button" className="w-32" />
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4 p-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="space-y-2">
        <SkeletonLoader variant="text" className="w-24" />
        <SkeletonLoader variant="button" className="w-full" />
      </div>
    ))}
    <SkeletonLoader variant="button" className="w-full h-12" />
  </div>
);

export default SkeletonLoader;
