import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ExaSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'light' | 'dark' | 'gradient' | 'transparent';
  paddingSize?: 'sm' | 'md' | 'lg';
  lazyLoad?: boolean;
  containerVariant?: 'default' | 'wide' | 'narrow' | 'full';
}

const ExaSection = ({ 
  children, 
  className, 
  id, 
  background = 'transparent',
  paddingSize = 'md',
  lazyLoad = false,
  containerVariant = 'default'
}: ExaSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);

  const backgroundClasses = {
    light: 'bg-white',
    dark: 'bg-exa-black',
    gradient: 'bg-gradient-to-br from-[#9C1E1E]/10 via-transparent to-[#180A0A]/10',
    transparent: 'bg-transparent',
  };

  const paddingClasses = {
    sm: 'py-8 md:py-12 lg:py-16',
    md: 'py-12 md:py-16 lg:py-24',
    lg: 'py-16 md:py-24 lg:py-32',
  };

  const containerClasses = {
    default: 'container mx-auto px-4 md:px-8 lg:px-[10%] max-w-[1440px]',
    wide: 'container mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 max-w-[1600px]',
    narrow: 'container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl',
    full: 'w-full px-4 md:px-8',
  };

  useEffect(() => {
    if (!lazyLoad || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.05,
        rootMargin: '50px'
      }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [lazyLoad]);

  return (
    <section 
      ref={sectionRef}
      id={id}
      className={cn(
        'w-full',
        paddingClasses[paddingSize],
        backgroundClasses[background],
        className
      )}
    >
      <div className={containerClasses[containerVariant]}>
        {isVisible ? children : (
          <div className="min-h-[200px] animate-pulse bg-gray-200/20 rounded-lg" />
        )}
      </div>
    </section>
  );
};

export default ExaSection;
