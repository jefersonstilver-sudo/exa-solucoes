
import { useState, useEffect } from 'react';

export interface AdvancedBreakpoints {
  xs: number;    // Extra small devices (phones)
  sm: number;    // Small devices (phones landscape)
  md: number;    // Medium devices (tablets)
  lg: number;    // Large devices (desktops)
  xl: number;    // Extra large devices
  xxl: number;   // Ultra wide screens
}

export interface ResponsiveState {
  // Device type detection
  isPhone: boolean;
  isPhoneLandscape: boolean;
  isTablet: boolean;
  isTabletLandscape: boolean;
  isDesktop: boolean;
  isUltraWide: boolean;
  
  // Screen information
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  
  // Touch capabilities
  isTouchDevice: boolean;
  isHighDPI: boolean;
  
  // Current breakpoint
  currentBreakpoint: keyof AdvancedBreakpoints;
  
  // Utility functions
  isBelow: (breakpoint: keyof AdvancedBreakpoints) => boolean;
  isAbove: (breakpoint: keyof AdvancedBreakpoints) => boolean;
  isBetween: (min: keyof AdvancedBreakpoints, max: keyof AdvancedBreakpoints) => boolean;
}

const defaultBreakpoints: AdvancedBreakpoints = {
  xs: 0,      // 0px+
  sm: 480,    // 480px+  (phones landscape)
  md: 768,    // 768px+  (tablets)
  lg: 1024,   // 1024px+ (desktops)
  xl: 1280,   // 1280px+ (large desktops)
  xxl: 1600   // 1600px+ (ultra wide)
};

export const useAdvancedResponsive = (customBreakpoints?: Partial<AdvancedBreakpoints>): ResponsiveState => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const getResponsiveState = (): ResponsiveState => {
    if (typeof window === 'undefined') {
      // Server-side rendering fallback
      return {
        isPhone: false,
        isPhoneLandscape: false,
        isTablet: false,
        isTabletLandscape: false,
        isDesktop: true,
        isUltraWide: false,
        screenWidth: 1024,
        screenHeight: 768,
        orientation: 'landscape',
        isTouchDevice: false,
        isHighDPI: false,
        currentBreakpoint: 'lg',
        isBelow: () => false,
        isAbove: () => true,
        isBetween: () => false
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isHighDPI = window.devicePixelRatio > 1.5;

    // Device type detection with refined logic
    const isPhone = width < breakpoints.md && orientation === 'portrait';
    const isPhoneLandscape = width < breakpoints.md && orientation === 'landscape';
    const isTablet = width >= breakpoints.md && width < breakpoints.lg;
    const isTabletLandscape = isTablet && orientation === 'landscape';
    const isDesktop = width >= breakpoints.lg && width < breakpoints.xxl;
    const isUltraWide = width >= breakpoints.xxl;

    // Current breakpoint detection
    let currentBreakpoint: keyof AdvancedBreakpoints = 'xs';
    if (width >= breakpoints.xxl) currentBreakpoint = 'xxl';
    else if (width >= breakpoints.xl) currentBreakpoint = 'xl';
    else if (width >= breakpoints.lg) currentBreakpoint = 'lg';
    else if (width >= breakpoints.md) currentBreakpoint = 'md';
    else if (width >= breakpoints.sm) currentBreakpoint = 'sm';

    // Utility functions
    const isBelow = (breakpoint: keyof AdvancedBreakpoints): boolean => 
      width < breakpoints[breakpoint];
    
    const isAbove = (breakpoint: keyof AdvancedBreakpoints): boolean => 
      width >= breakpoints[breakpoint];
    
    const isBetween = (min: keyof AdvancedBreakpoints, max: keyof AdvancedBreakpoints): boolean => 
      width >= breakpoints[min] && width < breakpoints[max];

    return {
      isPhone,
      isPhoneLandscape,
      isTablet,
      isTabletLandscape,
      isDesktop,
      isUltraWide,
      screenWidth: width,
      screenHeight: height,
      orientation,
      isTouchDevice,
      isHighDPI,
      currentBreakpoint,
      isBelow,
      isAbove,
      isBetween
    };
  };

  const [responsiveState, setResponsiveState] = useState<ResponsiveState>(getResponsiveState);

  useEffect(() => {
    const handleResize = () => {
      setResponsiveState(getResponsiveState());
    };

    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(() => {
        setResponsiveState(getResponsiveState());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initial check after mount
    setTimeout(() => {
      setResponsiveState(getResponsiveState());
    }, 0);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return responsiveState;
};
