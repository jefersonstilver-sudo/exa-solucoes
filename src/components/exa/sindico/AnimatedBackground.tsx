import React from 'react';
import { Boxes } from '@/components/ui/background-boxes';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

const AnimatedBackground = ({ children }: AnimatedBackgroundProps) => {
  return (
    <div className="relative w-full overflow-hidden bg-slate-900">
      {/* Animated boxes background */}
      <div className="absolute inset-0 w-full h-full">
        <Boxes />
      </div>
      
      {/* Radial gradient overlay to soften edges */}
      <div className="absolute inset-0 w-full h-full bg-slate-900 z-10 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;
