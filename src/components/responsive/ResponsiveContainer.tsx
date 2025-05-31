
import React from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  centerOnDesktop?: boolean;
  fullHeightOnMobile?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  centerOnDesktop = true,
  fullHeightOnMobile = false
}) => {
  const responsive = useAdvancedResponsive();

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-3xl';
      case 'md': return 'max-w-4xl';
      case 'lg': return 'max-w-5xl';
      case 'xl': return 'max-w-6xl';
      case 'xxl': return 'max-w-7xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-6xl';
    }
  };

  const getPaddingClass = () => {
    if (padding === 'none') return '';
    
    switch (padding) {
      case 'sm': return 'px-3 sm:px-4 md:px-6 lg:px-8';
      case 'md': return 'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12';
      case 'lg': return 'px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20';
      case 'xl': return 'px-8 sm:px-12 md:px-16 lg:px-24 xl:px-32';
      default: return 'px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12';
    }
  };

  return (
    <div
      className={cn(
        'w-full',
        getMaxWidthClass(),
        getPaddingClass(),
        centerOnDesktop && 'mx-auto',
        fullHeightOnMobile && responsive.isPhone && 'min-h-screen',
        className
      )}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
