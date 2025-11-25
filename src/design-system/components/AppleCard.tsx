import React from 'react';
import { cn } from '@/lib/utils';

interface AppleCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'solid' | 'metric';
  hover?: boolean;
}

export const AppleCard = ({ 
  children, 
  variant = 'default',
  hover = true,
  className 
}: AppleCardProps) => {
  const variants = {
    default: 'bg-white/90 backdrop-blur-xl border border-white/40',
    glass: 'bg-white/70 backdrop-blur-2xl border border-white/30',
    solid: 'bg-white border border-gray-100',
    metric: 'bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-xl border border-white/50',
  };

  return (
    <div className={cn(
      'rounded-2xl p-6',
      'shadow-[var(--shadow-glass)]',
      'transition-all ease-[var(--ease-apple)]',
      'duration-[var(--duration-normal)]',
      variants[variant],
      hover && 'hover:scale-[1.01] hover:shadow-[var(--shadow-xl)]',
      className
    )}>
      {children}
    </div>
  );
};
