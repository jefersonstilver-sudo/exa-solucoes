import React from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppleMobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const AppleMobileHeader = ({ 
  title, 
  subtitle, 
  onMenuClick, 
  actions,
  className 
}: AppleMobileHeaderProps) => (
  <div className={cn(
    "sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100",
    "lg:hidden",
    className
  )}>
    <div className="flex items-center justify-between px-4 py-3 safe-area-top">
      {onMenuClick && (
        <button 
          onClick={onMenuClick} 
          className="p-2 -ml-2 touch-manipulation hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-[hsl(var(--apple-gray-900))]" />
        </button>
      )}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-[hsl(var(--apple-gray-900))]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[hsl(var(--apple-gray-500))] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
      {!actions && onMenuClick && <div className="w-10" />}
    </div>
  </div>
);
