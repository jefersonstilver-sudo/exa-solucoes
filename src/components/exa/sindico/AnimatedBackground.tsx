import React, { useState, useEffect } from 'react';
import { Boxes } from '@/components/ui/background-boxes';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

const AnimatedBackground = ({ children }: AnimatedBackgroundProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    
    // Throttled resize listener
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 250);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-slate-900">
      {/* Animated boxes background - lightweight on mobile */}
      {!isMobile ? (
        <div className="absolute inset-0 w-full h-full z-0">
          <Boxes />
        </div>
      ) : (
        // Static gradient background for mobile (much lighter)
        <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}
      
      {/* Radial gradient overlay to soften edges */}
      <div className="absolute inset-0 w-full h-full bg-slate-900/50 z-[1] [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-[30]">
        {children}
      </div>
    </div>
  );
};

export default React.memo(AnimatedBackground);
