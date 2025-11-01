import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'wide' | 'narrow' | 'full' | 'section';
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main';
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  variant = 'default',
  className,
  as: Component = 'div'
}) => {
  const variants = {
    default: 'container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
    wide: 'container mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 max-w-[1440px]',
    narrow: 'container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl',
    full: 'w-full px-4 sm:px-6 lg:px-8',
    section: 'container mx-auto px-4 md:px-8 lg:px-[10%] max-w-[1440px]'
  };

  return (
    <Component className={cn(variants[variant], className)}>
      {children}
    </Component>
  );
};

export default ResponsiveContainer;