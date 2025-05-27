
import React, { useState, useEffect, useMemo } from 'react';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';

export const useCheckoutState = () => {
  const [step, setStep] = useState(CHECKOUT_STEPS.REVIEW);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // CORREÇÃO: Usar useMemo para cálculo de endDate
  const endDate = useMemo(() => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + PLANS[selectedPlan].months);
    return date;
  }, [selectedPlan, startDate]);
  
  // CORREÇÃO: Remover setEndDate pois agora é computado
  return {
    step,
    setStep,
    selectedPlan,
    setSelectedPlan,
    acceptTerms,
    setAcceptTerms,
    startDate,
    setStartDate,
    endDate, // Agora é computado, não estado
    sessionUser,
    setSessionUser,
    STEPS: CHECKOUT_STEPS
  };
};
