
import { useState, useEffect } from 'react';
import { PlanKey } from '@/types/checkout';
import { PLANS_DATA } from '@/constants/plansConstants';

export const usePlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(3); // Default to trimestral
  
  // Load saved plan from localStorage
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
    try {
      localStorage.setItem('selectedPlan', String(selectedPlan));
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  }, [selectedPlan]);
  
  const calculatePlanPrice = (planKey: PlanKey, panelCount: number = 1) => {
    const plan = PLANS_DATA[planKey];
    if (!plan) return 0;
    
    const monthlyPrice = plan.pricePerMonth * panelCount;
    const totalMonths = plan.months;
    const subtotal = monthlyPrice * totalMonths;
    
    // Apply discount
    if (plan.discount > 0) {
      const discountAmount = (subtotal * plan.discount) / 100;
      return subtotal - discountAmount;
    }
    
    return subtotal;
  };
  
  const getPlanDetails = (planKey: PlanKey) => {
    return PLANS_DATA[planKey];
  };
  
  return {
    selectedPlan,
    setSelectedPlan,
    plans: PLANS_DATA,
    calculatePlanPrice,
    getPlanDetails
  };
};
