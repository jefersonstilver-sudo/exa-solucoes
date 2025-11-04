import { useState, useEffect, useMemo } from 'react';

export interface BreakpointConfig {
  xs: number;  // 320px - Mobile pequeno
  sm: number;  // 640px - Mobile grande
  md: number;  // 768px - Tablet
  lg: number;  // 1024px - Desktop pequeno
  xl: number;  // 1280px - Desktop
  '2xl': number; // 1536px - Desktop grande
}

export interface AdvancedDeviceInfo {
  // Device types
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Screen details
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  
  // Touch capabilities
  isTouchDevice: boolean;
  
  // Current breakpoint
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  // Utilities
  isSmallScreen: boolean;
  isLargeScreen: boolean;
  isMobileLandscape: boolean;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useAdvancedResponsive = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = useMemo(
    () => ({ ...defaultBreakpoints, ...customBreakpoints }),
    [customBreakpoints]
  );

  const getDeviceInfo = (): AdvancedDeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
        orientation: 'landscape',
        isTouchDevice: false,
        breakpoint: 'lg',
        isSmallScreen: false,
        isLargeScreen: true,
        isMobileLandscape: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Determine breakpoint
    let breakpoint: AdvancedDeviceInfo['breakpoint'] = 'xs';
    if (width >= breakpoints['2xl']) breakpoint = '2xl';
    else if (width >= breakpoints.xl) breakpoint = 'xl';
    else if (width >= breakpoints.lg) breakpoint = 'lg';
    else if (width >= breakpoints.md) breakpoint = 'md';
    else if (width >= breakpoints.sm) breakpoint = 'sm';

    // Device classification
    const isMobile = width < breakpoints.md;
    const isTablet = width >= breakpoints.md && width < breakpoints.lg;
    const isDesktop = width >= breakpoints.lg;

    return {
      isMobile,
      isTablet,
      isDesktop,
      width,
      height,
      orientation,
      isTouchDevice,
      breakpoint,
      isSmallScreen: isMobile || isTablet,
      isLargeScreen: isDesktop,
      isMobileLandscape: isMobile && orientation === 'landscape',
    };
  };

  const [deviceInfo, setDeviceInfo] = useState<AdvancedDeviceInfo>(getDeviceInfo);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateDeviceInfo = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 150);
    };

    updateDeviceInfo();

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [breakpoints]);

  return {
    ...deviceInfo,
    breakpoints,
    getCurrentBreakpoint: () => deviceInfo.breakpoint,
  };
};
