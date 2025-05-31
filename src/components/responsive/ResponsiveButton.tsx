
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { LucideIcon } from 'lucide-react';

interface ResponsiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidthOnMobile?: boolean;
  touchOptimized?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidthOnMobile = false,
  touchOptimized = true,
  type = 'button'
}) => {
  const { isPhone, isTablet, isTouchDevice } = useAdvancedResponsive();

  const getResponsiveSize = () => {
    if (touchOptimized && isTouchDevice) {
      // Enhanced touch targets for mobile devices
      if (isPhone) {
        switch (size) {
          case 'sm': return 'h-12 px-4 text-sm';
          case 'lg': return 'h-16 px-8 text-lg';
          case 'icon': return 'h-12 w-12';
          default: return 'h-14 px-6 text-base';
        }
      }
      
      if (isTablet) {
        switch (size) {
          case 'sm': return 'h-11 px-4 text-sm';
          case 'lg': return 'h-14 px-8 text-lg';
          case 'icon': return 'h-11 w-11';
          default: return 'h-12 px-6 text-base';
        }
      }
    }

    // Default desktop sizes
    switch (size) {
      case 'sm': return 'h-9 px-3 text-sm';
      case 'lg': return 'h-11 px-8 text-base';
      case 'icon': return 'h-10 w-10';
      default: return 'h-10 px-4 text-sm';
    }
  };

  const getIconSize = () => {
    if (isPhone) return 'w-5 h-5';
    if (isTablet) return 'w-5 h-5';
    return 'w-4 h-4';
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      disabled={disabled || loading}
      className={cn(
        getResponsiveSize(),
        fullWidthOnMobile && isPhone && 'w-full',
        touchOptimized && isTouchDevice && 'touch-manipulation',
        'transition-all duration-200 font-medium rounded-full',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-current" />
          <span>Carregando...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {Icon && iconPosition === 'left' && (
            <Icon className={cn(getIconSize(), 'flex-shrink-0')} />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon className={cn(getIconSize(), 'flex-shrink-0')} />
          )}
        </div>
      )}
    </Button>
  );
};

export default ResponsiveButton;
