
import { useState, useEffect } from 'react';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';

export const useCheckoutState = () => {
  const [step, setStep] = useState(CHECKOUT_STEPS.REVIEW);
  const [selectedPlan, setSelectedPlan] = useState<1 | 3 | 6 | 12>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days
    return date;
  });
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Update end date when plan changes
  useEffect(() => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + PLANS[selectedPlan].months);
    setEndDate(date);
  }, [selectedPlan, startDate]);
  
  return {
    step,
    setStep,
    selectedPlan,
    setSelectedPlan,
    acceptTerms,
    setAcceptTerms,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sessionUser,
    setSessionUser,
    STEPS: CHECKOUT_STEPS
  };
};
