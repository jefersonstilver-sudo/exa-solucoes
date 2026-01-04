import React from 'react';
import { cn } from '@/lib/utils';
import { CATEGORIAS_CONFIG, CategoriaContato } from '@/types/contatos';

interface CategoriaBadgeProps {
  categoria: CategoriaContato;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const CategoriaBadge: React.FC<CategoriaBadgeProps> = ({
  categoria,
  size = 'md',
  showIcon = false,
  className
}) => {
  const config = CATEGORIAS_CONFIG[categoria];
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap text-white',
        config.bgColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-white/80" />}
      {config.label}
    </span>
  );
};

export default CategoriaBadge;
