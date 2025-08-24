
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSindicoIntersectionObserver = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  
  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});

  // Optimized visibility update - no debouncing for better responsiveness
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
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
  }, []);

  useEffect(() => {
    // Optimized observer with higher threshold for better performance
    const observer = new IntersectionObserver(
      handleIntersection,
      { 
        threshold: 0.15,
        rootMargin: '100px 0px -100px 0px'
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    Object.values(sectionsRef.current).forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [handleIntersection]);

  return {
    isVisible,
    visibleSections,
    heroRef,
    sectionsRef
  };
};
