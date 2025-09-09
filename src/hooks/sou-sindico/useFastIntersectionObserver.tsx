import { useState, useEffect, useRef, useCallback } from 'react';

export const useFastIntersectionObserver = () => {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  const heroRef = useRef<HTMLElement>(null);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768;
    setIsMobile(checkMobile());
    
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fast debounced visibility update
  const debouncedUpdateVisibility = useCallback((entries: IntersectionObserverEntry[]) => {
    const updates: Record<string, boolean> = {};
    
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute('data-section');
        if (sectionId) {
          updates[sectionId] = true;
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      setVisibleSections(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Create single observer with optimized settings
  useEffect(() => {
    // On mobile, make everything visible immediately for fast loading
    if (isMobile) {
      const timeout = setTimeout(() => {
        setVisibleSections({
          hero: true,
          about: true,
          benefits: true,
          'how-it-works': true,
          checklist: true,
          form: true
        });
      }, 100);
      return () => clearTimeout(timeout);
    }

    // Desktop: use optimized intersection observer
    observerRef.current = new IntersectionObserver(
      debouncedUpdateVisibility,
      { 
        threshold: 0.05, // Very low threshold for faster trigger
        rootMargin: '100px 0px -20px 0px' // Large top margin, small bottom margin
      }
    );

    // Fallback: make all sections visible after 800ms
    fallbackTimeoutRef.current = setTimeout(() => {
      setVisibleSections({
        hero: true,
        about: true,
        benefits: true,
        'how-it-works': true,
        checklist: true,
        form: true
      });
    }, 800);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, [debouncedUpdateVisibility, isMobile]);

  // Register section ref callback
  const getSectionRef = useCallback((sectionId: string) => {
    return (el: HTMLElement | null) => {
      sectionsRef.current[sectionId] = el;
      if (el && observerRef.current && !isMobile) {
        observerRef.current.observe(el);
      }
    };
  }, [isMobile]);

  // Register hero ref callback  
  const getHeroRef = useCallback(() => {
    return (el: HTMLElement | null) => {
      heroRef.current = el;
      if (el && observerRef.current && !isMobile) {
        observerRef.current.observe(el);
      }
      // Hero is immediately visible
      setVisibleSections(prev => ({ ...prev, hero: true }));
    };
  }, [isMobile]);

  return {
    visibleSections,
    getSectionRef,
    getHeroRef,
    isMobile
  };
};