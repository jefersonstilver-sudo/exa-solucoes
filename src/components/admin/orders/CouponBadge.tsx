import React from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CouponBadgeProps {
  couponCode?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CouponBadge: React.FC<CouponBadgeProps> = ({ 
  couponCode, 
  size = 'md' 
}) => {
  if (!couponCode) return null;

  const sizeClasses = {
    sm: 'h-5 w-5 text-[10px]',
    md: 'h-6 w-6 text-xs',
    lg: 'h-7 w-7 text-sm'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-flex">
            <Badge 
              className={`
                ${sizeClasses[size]}
                rounded-full 
                bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600
                border-2 border-white
                flex items-center justify-center
                shadow-lg
                animate-pulse
                cursor-help
                hover:scale-110 transition-transform
              `}
            >
              <Sparkles className={`${iconSizes[size]} text-white`} />
            </Badge>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white border-amber-300"
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <div>
              <p className="font-semibold text-sm">Pedido com Cupom</p>
              <p className="text-xs opacity-90">Código: {couponCode}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
