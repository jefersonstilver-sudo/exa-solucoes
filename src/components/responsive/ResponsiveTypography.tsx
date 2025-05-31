
import React from 'react';
import { cn } from '@/lib/utils';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface ResponsiveTypographyProps {
  children: React.ReactNode;
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'button';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'white' | 'gray' | 'inherit';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  align?: 'left' | 'center' | 'right';
  responsive?: boolean;
}

const ResponsiveTypography: React.FC<ResponsiveTypographyProps> = ({
  children,
  variant,
  className,
  color = 'inherit',
  weight = 'normal',
  align = 'left',
  responsive = true
}) => {
  const { isPhone, isTablet } = useAdvancedResponsive();

  const getVariantClasses = () => {
    if (!responsive) {
      // Static classes without responsive scaling
      switch (variant) {
        case 'h1': return 'text-4xl md:text-6xl font-bold';
        case 'h2': return 'text-3xl md:text-5xl font-bold';
        case 'h3': return 'text-2xl md:text-4xl font-semibold';
        case 'h4': return 'text-xl md:text-3xl font-semibold';
        case 'h5': return 'text-lg md:text-2xl font-medium';
        case 'h6': return 'text-base md:text-xl font-medium';
        case 'body': return 'text-base md:text-lg';
        case 'caption': return 'text-sm md:text-base';
        case 'button': return 'text-sm md:text-base font-medium';
        default: return 'text-base';
      }
    }

    // Responsive classes with enhanced mobile optimization
    switch (variant) {
      case 'h1':
        if (isPhone) return 'text-2xl xs:text-3xl font-bold leading-tight';
        if (isTablet) return 'text-4xl md:text-5xl font-bold leading-tight';
        return 'text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight';
      
      case 'h2':
        if (isPhone) return 'text-xl xs:text-2xl font-bold leading-tight';
        if (isTablet) return 'text-3xl md:text-4xl font-bold leading-tight';
        return 'text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight';
      
      case 'h3':
        if (isPhone) return 'text-lg xs:text-xl font-semibold leading-tight';
        if (isTablet) return 'text-2xl md:text-3xl font-semibold leading-tight';
        return 'text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight';
      
      case 'h4':
        if (isPhone) return 'text-base xs:text-lg font-semibold leading-snug';
        if (isTablet) return 'text-xl md:text-2xl font-semibold leading-snug';
        return 'text-2xl lg:text-3xl xl:text-4xl font-semibold leading-snug';
      
      case 'h5':
        if (isPhone) return 'text-sm xs:text-base font-medium leading-snug';
        if (isTablet) return 'text-lg md:text-xl font-medium leading-snug';
        return 'text-xl lg:text-2xl xl:text-3xl font-medium leading-snug';
      
      case 'h6':
        if (isPhone) return 'text-sm font-medium leading-normal';
        if (isTablet) return 'text-base md:text-lg font-medium leading-normal';
        return 'text-lg lg:text-xl xl:text-2xl font-medium leading-normal';
      
      case 'body':
        if (isPhone) return 'text-sm xs:text-base leading-relaxed';
        if (isTablet) return 'text-base md:text-lg leading-relaxed';
        return 'text-lg lg:text-xl leading-relaxed';
      
      case 'caption':
        if (isPhone) return 'text-xs xs:text-sm leading-normal';
        if (isTablet) return 'text-sm md:text-base leading-normal';
        return 'text-base lg:text-lg leading-normal';
      
      case 'button':
        if (isPhone) return 'text-sm font-medium leading-none';
        if (isTablet) return 'text-base font-medium leading-none';
        return 'text-lg font-medium leading-none';
      
      default:
        return 'text-base leading-normal';
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'primary': return 'text-indexa-purple';
      case 'secondary': return 'text-gray-600';
      case 'accent': return 'text-indexa-mint';
      case 'white': return 'text-white';
      case 'gray': return 'text-gray-400';
      case 'inherit': return '';
      default: return '';
    }
  };

  const getWeightClass = () => {
    switch (weight) {
      case 'light': return 'font-light';
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      case 'extrabold': return 'font-extrabold';
      default: return '';
    }
  };

  const getAlignClass = () => {
    switch (align) {
      case 'left': return 'text-left';
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const Tag = variant.startsWith('h') ? (variant as keyof JSX.IntrinsicElements) : 'p';

  return (
    <Tag
      className={cn(
        getVariantClasses(),
        getColorClass(),
        getWeightClass(),
        getAlignClass(),
        className
      )}
    >
      {children}
    </Tag>
  );
};

export default ResponsiveTypography;
