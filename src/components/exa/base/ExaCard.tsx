import React from 'react';
import { cn } from '@/lib/utils';

interface ExaCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'gradient';
  hoverable?: boolean;
}

const ExaCard = ({ children, className, variant = 'light', hoverable = true }: ExaCardProps) => {
  const variantClasses = {
    light: 'bg-white text-exa-black border border-gray-200',
    dark: 'bg-exa-black text-white border border-gray-800',
    gradient: 'bg-gradient-to-br from-exa-purple to-exa-purple/80 text-white border-none',
  };

  return (
    <div
      className={cn(
        'rounded-3xl p-6 lg:p-8 shadow-lg transition-all duration-300',
        variantClasses[variant],
        hoverable && 'hover:shadow-2xl hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
};

export default ExaCard;
