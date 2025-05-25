
import { useState, useEffect } from 'react';

export const useResponsiveLayout = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Mobile: < 768px
      // Tablet: 768px - 1023px
      // Desktop: >= 1024px
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    // Set initial values
    updateScreenSize();

    // Add event listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    // Utility functions
    isSmallScreen: isMobile || isTablet,
    isLargeScreen: isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};
