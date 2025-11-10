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
    gradient: 'bg-gradient-to-br from-[#9C1E1E]/10 via-transparent to-[#180A0A]/10',
    transparent: 'bg-transparent',
  };

  return (
    <section 
      id={id}
      className={cn(
        'w-full',
        'py-8 md:py-12 lg:py-20',
        backgroundClasses[background],
        className
      )}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-[8%] max-w-[1440px]">
        {children}
      </div>
    </section>
  );
};

export default ExaSection;
