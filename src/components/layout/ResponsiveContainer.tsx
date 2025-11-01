import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'wide' | 'narrow' | 'full';
  className?: string;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  variant = 'default',
  className
}) => {
  const variants = {
    default: 'container mx-auto px-4 sm:px-6 lg:px-8',
    wide: 'container mx-auto px-4 sm:px-6 lg:px-12 xl:px-16',
    narrow: 'container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl',
    full: 'w-full px-4 sm:px-6 lg:px-8'
  };

  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;