
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GrowthIndicatorProps {
  value: number;
  label: string;
  className?: string;
}

const GrowthIndicator = ({ value, label, className }: GrowthIndicatorProps) => {
  const getIndicatorColor = () => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getIndicatorIcon = () => {
    if (value > 0) return <TrendingUp className="h-3 w-3" />;
    if (value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const formatValue = (val: number) => {
    if (val === 0) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  return (
    <div className={cn('flex items-center space-x-1 text-xs', className)}>
      <div className={cn('flex items-center space-x-1', getIndicatorColor())}>
        {getIndicatorIcon()}
        <span className="font-medium">{formatValue(value)}</span>
      </div>
      <span className="text-gray-500">{label}</span>
    </div>
  );
};

export default GrowthIndicator;
