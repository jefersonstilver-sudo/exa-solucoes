
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import { useState, useEffect, useCallback, useMemo } from 'react';

interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXl: boolean;
  orientation: 'portrait' | 'landscape';
  pixelRatio: number;
  isTouchDevice: boolean;
  hasHover: boolean;
  prefersReducedMotion: boolean;
  connectionType: string;
}

interface ResponsiveConfig {
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  desktopBreakpoint: number;
  xlBreakpoint: number;
  debounceMs: number;
}

const defaultConfig: ResponsiveConfig = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  xlBreakpoint: 1920,
  debounceMs: 100,
};

export const useOptimizedResponsive = (config: Partial<ResponsiveConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  
  const getInitialState = useCallback((): ResponsiveState => {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isXl: true,
        orientation: 'landscape',
        pixelRatio: 1,
        isTouchDevice: false,
        hasHover: true,
        prefersReducedMotion: false,
        connectionType: '4g',
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < finalConfig.mobileBreakpoint,
      isTablet: width >= finalConfig.mobileBreakpoint && width < finalConfig.desktopBreakpoint,
      isDesktop: width >= finalConfig.desktopBreakpoint && width < finalConfig.xlBreakpoint,
      isXl: width >= finalConfig.xlBreakpoint,
      orientation: width > height ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio || 1,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasHover: window.matchMedia('(hover: hover)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      connectionType: (navigator as any)?.connection?.effectiveType || 'unknown',
    };
  }, [finalConfig]);

  const [state, setState] = useState<ResponsiveState>(getInitialState);

  // Debounced resize handler para performance
  const debouncedUpdateState = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(getInitialState());
      }, finalConfig.debounceMs);
    };
  }, [getInitialState, finalConfig.debounceMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueries = [
      window.matchMedia('(hover: hover)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];

    const handleMediaChange = () => {
      setState(getInitialState());
    };

    // Event listeners otimizados
    window.addEventListener('resize', debouncedUpdateState, { passive: true });
    window.addEventListener('orientationchange', debouncedUpdateState, { passive: true });
    
    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleMediaChange);
    });

    return () => {
      window.removeEventListener('resize', debouncedUpdateState);
      window.removeEventListener('orientationchange', debouncedUpdateState);
      
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleMediaChange);
      });
    };
  }, [debouncedUpdateState, getInitialState]);

  // Helpers otimizados
  const helpers = useMemo(() => ({
    // Breakpoint helpers
    isSmallScreen: state.isMobile || state.isTablet,
    isLargeScreen: state.isDesktop || state.isXl,
    
    // Responsive values
    getResponsiveValue: <T>(values: {
      mobile?: T;
      tablet?: T;
      desktop?: T;
      xl?: T;
      default: T;
    }): T => {
      if (state.isMobile && values.mobile !== undefined) return values.mobile;
      if (state.isTablet && values.tablet !== undefined) return values.tablet;
      if (state.isDesktop && values.desktop !== undefined) return values.desktop;
      if (state.isXl && values.xl !== undefined) return values.xl;
      return values.default;
    },

    // Current breakpoint
    getCurrentBreakpoint: (): 'mobile' | 'tablet' | 'desktop' | 'xl' => {
      if (state.isMobile) return 'mobile';
      if (state.isTablet) return 'tablet';
      if (state.isDesktop) return 'desktop';
      return 'xl';
    },

    // Performance helpers
    shouldUseReducedAnimations: state.prefersReducedMotion || state.isMobile,
    shouldLazyLoad: state.isMobile || state.connectionType === 'slow-2g' || state.connectionType === '2g',
    shouldPreload: !state.isMobile && state.connectionType !== 'slow-2g' && state.connectionType !== '2g',
    
    // Touch helpers
    touchTargetSize: state.isTouchDevice ? 44 : 32, // Tamanho mínimo para touch
    
    // Layout helpers
    containerPadding: state.isMobile ? '1rem' : state.isTablet ? '1.5rem' : '2rem',
    maxWidth: state.isMobile ? '100%' : state.isTablet ? '768px' : state.isDesktop ? '1024px' : '1280px',
  }), [state]);

  return {
    ...state,
    ...helpers,
    config: finalConfig,
  };
};

export default useOptimizedResponsive;
