import { useState, useEffect } from 'react';

interface ProgressiveLoadingConfig {
  initialDelay?: number;
  staggerDelay?: number;
  mobileFastMode?: boolean;
}

export const useProgressiveLoading = (
  itemCount: number, 
  config: ProgressiveLoadingConfig = {}
) => {
  const { 
    initialDelay = 0, 
    staggerDelay = 100, 
    mobileFastMode = true 
  } = config;

  const [loadedItems, setLoadedItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const [isAllLoaded, setIsAllLoaded] = useState(false);

  // Detect mobile for faster animations
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldUseFastMode = mobileFastMode && isMobile;

  useEffect(() => {
    if (shouldUseFastMode) {
      // On mobile, load everything immediately for better UX
      const allLoaded = new Array(itemCount).fill(true);
      setLoadedItems(allLoaded);
      setIsAllLoaded(true);
      return;
    }

    // Progressive loading for desktop
    const timeouts: NodeJS.Timeout[] = [];
    
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setLoadedItems(prev => {
          const newState = [...prev];
          newState[i] = true;
          return newState;
        });

        // Check if all items are loaded
        if (i === itemCount - 1) {
          setTimeout(() => setIsAllLoaded(true), 100);
        }
      }, initialDelay + (i * staggerDelay));
      
      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [itemCount, initialDelay, staggerDelay, shouldUseFastMode]);

  const getItemDelay = (index: number) => {
    if (shouldUseFastMode) return 0;
    return initialDelay + (index * staggerDelay);
  };

  const isItemLoaded = (index: number) => {
    return loadedItems[index] || false;
  };

  return {
    loadedItems,
    isAllLoaded,
    isItemLoaded,
    getItemDelay,
    shouldUseFastMode
  };
};