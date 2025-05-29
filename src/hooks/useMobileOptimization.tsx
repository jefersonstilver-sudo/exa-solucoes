
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizationConfig {
  enableAnimations: boolean;
  touchTargetSize: number;
  swipeThreshold: number;
  hapticFeedback: boolean;
}

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPullRefresh?: () => void;
}

export const useMobileOptimization = (config?: Partial<MobileOptimizationConfig>) => {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const defaultConfig: MobileOptimizationConfig = {
    enableAnimations: true,
    touchTargetSize: 44,
    swipeThreshold: 50,
    hapticFeedback: true,
    ...config
  };

  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if (defaultConfig.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [defaultConfig.hapticFeedback]);

  const setupSwipeHandlers = useCallback((element: HTMLElement, handlers: GestureHandlers) => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setStartY(startY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      setCurrentY(currentY);
      
      // Pull to refresh logic
      if (currentY - startY > 50 && window.scrollY === 0 && handlers.onPullRefresh) {
        setIsPulling(true);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > defaultConfig.swipeThreshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          vibrate();
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          vibrate();
          handlers.onSwipeLeft();
        }
      }

      // Pull to refresh
      if (isPulling && handlers.onPullRefresh) {
        setIsRefreshing(true);
        handlers.onPullRefresh();
        setTimeout(() => {
          setIsRefreshing(false);
          setIsPulling(false);
        }, 1000);
      } else {
        setIsPulling(false);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, defaultConfig.swipeThreshold, vibrate, isPulling]);

  return {
    isMobile,
    config: defaultConfig,
    vibrate,
    setupSwipeHandlers,
    isRefreshing,
    isPulling,
    pullDistance: Math.max(0, currentY - startY)
  };
};
