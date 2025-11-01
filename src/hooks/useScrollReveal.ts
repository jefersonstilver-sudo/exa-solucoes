import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  reducedMotion?: boolean;
}

export const useScrollReveal = (
  thresholdOrOptions: number | UseScrollRevealOptions = 0.1
) => {
  const options: UseScrollRevealOptions = typeof thresholdOrOptions === 'number' 
    ? { threshold: thresholdOrOptions }
    : thresholdOrOptions;

  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    reducedMotion = false
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Se reducedMotion está ativo, mostra imediatamente
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, reducedMotion]);

  return { ref, isVisible };
};
