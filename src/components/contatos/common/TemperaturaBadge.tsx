import React from 'react';
import { cn } from '@/lib/utils';
import { TEMPERATURA_CONFIG, TemperaturaContato } from '@/types/contatos';

interface TemperaturaBadgeProps {
  temperatura?: TemperaturaContato;
  size?: 'sm' | 'md';
  className?: string;
}

export const TemperaturaBadge: React.FC<TemperaturaBadgeProps> = ({
  temperatura,
  size = 'md',
  className
}) => {
  if (!temperatura) return null;

  const config = TEMPERATURA_CONFIG[temperatura];
  
  const emoji = {
    quente: '🟢',
    morno: '🟡',
    frio: '🔴'
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        config.bgColor,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <span>{emoji[temperatura]}</span>
      {config.label}
    </span>
  );
};

export default TemperaturaBadge;
