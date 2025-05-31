
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizationConfig {
  enableAnimations: boolean;
  touchTargetSize: number;
  swipeThreshold: number;
  hapticFeedback: boolean;
  enablePullToRefresh: boolean; // Nova opção para controlar pull-to-refresh
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
    enablePullToRefresh: false, // Desabilitado por padrão para evitar conflitos
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
    let isScrolling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      setStartY(startY);
      isScrolling = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!defaultConfig.enablePullToRefresh) return; // Skip pull-to-refresh logic
      
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      setCurrentY(currentY);
      
      // Detect if user is scrolling vertically vs horizontally
      const deltaY = Math.abs(currentY - startY);
      const deltaX = Math.abs(currentX - startX);
      
      if (deltaY > deltaX && deltaY > 10) {
        isScrolling = true;
      }
      
      // Only apply pull-to-refresh if explicitly enabled and conditions are met
      if (currentY - startY > 80 && window.scrollY === 0 && handlers.onPullRefresh && !isScrolling) {
        setIsPulling(true);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Only detect horizontal swipes if not scrolling vertically
      if (!isScrolling && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > defaultConfig.swipeThreshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          vibrate();
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          vibrate();
          handlers.onSwipeLeft();
        }
      }

      // Pull to refresh - only if enabled
      if (isPulling && handlers.onPullRefresh && defaultConfig.enablePullToRefresh) {
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

    // Use passive listeners to not interfere with browser scroll
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, defaultConfig.swipeThreshold, defaultConfig.enablePullToRefresh, vibrate, isPulling]);

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
