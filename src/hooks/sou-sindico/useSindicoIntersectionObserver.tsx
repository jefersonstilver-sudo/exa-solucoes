
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSindicoIntersectionObserver = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  
  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  // Debounce function to reduce rapid updates
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Debounced visibility update
  const debouncedUpdateVisibility = useCallback(
    debounce((entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId) {
            setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
          }
          if (entry.target === heroRef.current) {
            setIsVisible(true);
          }
        }
      });
    }, 150), // 150ms debounce
    []
  );

  useEffect(() => {
    // Reduced threshold for less sensitivity and better performance
    const observer = new IntersectionObserver(
      debouncedUpdateVisibility,
      { 
        threshold: 0.1, // Reduced from 0.2 to 0.1
        rootMargin: '50px 0px -50px 0px' // Added margin for better control
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    Object.values(sectionsRef.current).forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [debouncedUpdateVisibility]);

  return {
    isVisible,
    visibleSections,
    heroRef,
    sectionsRef
  };
};
