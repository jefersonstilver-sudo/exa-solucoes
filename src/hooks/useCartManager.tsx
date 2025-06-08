
import { useState, useEffect } from 'react';
import { useSimpleCart } from './useSimpleCart';
import { PlanKey } from '@/types/checkout';

export const useCartManager = () => {
  const simpleCart = useSimpleCart();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);

  // Load saved plan from localStorage on mount
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as PlanKey);
        }
      }
    } catch (error) {
      console.error('Error loading saved plan:', error);
    }
  }, []);

  // Save plan to localStorage when it changes
  useEffect(() => {
    if (selectedPlan) {
      try {
        localStorage.setItem('selectedPlan', selectedPlan.toString());
      } catch (error) {
        console.error('Error saving plan:', error);
      }
    }
  }, [selectedPlan]);

  return {
    ...simpleCart,
    selectedPlan,
    setSelectedPlan
  };
};
