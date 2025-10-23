import React from 'react';
import { cn } from '@/lib/utils';

interface ExaSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'light' | 'dark' | 'gradient' | 'transparent';
}

const ExaSection = ({ children, className, id, background = 'transparent' }: ExaSectionProps) => {
  const backgroundClasses = {
    light: 'bg-white',
    dark: 'bg-exa-black',
    gradient: 'bg-gradient-to-br from-exa-purple/10 via-transparent to-exa-blue/10',
    transparent: 'bg-transparent',
  };

  return (
    <section 
      id={id}
      className={cn(
        'w-full py-12 md:py-16 lg:py-24',
        backgroundClasses[background],
        className
      )}
    >
      <div className="container mx-auto px-4 md:px-8 lg:px-[10%] max-w-[1440px]">
        {children}
      </div>
    </section>
  );
};

export default ExaSection;
