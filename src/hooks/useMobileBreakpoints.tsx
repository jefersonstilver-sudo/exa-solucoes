
import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  xl: number;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXl: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  xl: 1920
};

export const useMobileBreakpoints = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isXl: false,
        isTouchDevice: false,
        screenWidth: 1920,
        screenHeight: 1080,
        orientation: 'landscape'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
      isDesktop: width >= breakpoints.desktop && width < breakpoints.xl,
      isXl: width >= breakpoints.xl,
      isTouchDevice,
      screenWidth: width,
      screenHeight: height,
      orientation: width > height ? 'landscape' : 'portrait'
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setDeviceInfo({
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
        isDesktop: width >= breakpoints.desktop && width < breakpoints.xl,
        isXl: width >= breakpoints.xl,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoints.mobile, breakpoints.desktop, breakpoints.xl]);

  return {
    ...deviceInfo,
    breakpoints,
    getCurrentBreakpoint: () => {
      const { screenWidth } = deviceInfo;
      if (screenWidth < breakpoints.mobile) return 'mobile';
      if (screenWidth < breakpoints.desktop) return 'tablet';
      if (screenWidth < breakpoints.xl) return 'desktop';
      return 'xl';
    }
  };
};
