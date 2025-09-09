import { useState, useEffect, useRef, useCallback } from 'react';

export const useFastIntersectionObserver = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  
  const heroRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const fallbackTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Fast visibility update - no debounce for immediate response
  const updateVisibility = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute('data-section');
        if (sectionId) {
          setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
          // Clear fallback timeout since we detected intersection
          if (fallbackTimeoutRef.current[sectionId]) {
            clearTimeout(fallbackTimeoutRef.current[sectionId]);
          }
        }
        if (entry.target === heroRef.current) {
          setIsVisible(true);
        }
      }
    });
  }, []);

  // Fallback mechanism - show elements after timeout even without intersection
  const setupFallback = useCallback((sectionId: string) => {
    fallbackTimeoutRef.current[sectionId] = setTimeout(() => {
      setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
    }, 1500); // Show after 1.5s regardless of intersection
  }, []);

  useEffect(() => {
    // Much more aggressive intersection observer for faster detection
    const observer = new IntersectionObserver(
      updateVisibility,
      { 
        threshold: 0.01, // Very low threshold for early detection
        rootMargin: '100px 0px -20px 0px' // Start loading well before element is visible
      }
    );

    // Hero fallback
    setTimeout(() => setIsVisible(true), 800);

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    Object.entries(sectionsRef.current).forEach(([sectionId, section]) => {
      if (section) {
        observer.observe(section);
        setupFallback(sectionId);
      }
    });

    return () => {
      observer.disconnect();
      Object.values(fallbackTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [updateVisibility, setupFallback]);

  return {
    isVisible,
    visibleSections,
    heroRef,
    sectionsRef
  };
};