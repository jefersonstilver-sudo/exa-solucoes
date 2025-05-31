
import { useState, useEffect, useRef } from 'react';

export const useWhyItWorksAnimation = (itemsCount: number) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % itemsCount);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, itemsCount]);

  return {
    isVisible,
    activeStep,
    setActiveStep,
    sectionRef
  };
};
