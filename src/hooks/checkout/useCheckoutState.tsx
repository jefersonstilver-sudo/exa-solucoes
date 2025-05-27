
import React, { useState, useEffect } from 'react';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';

export const useCheckoutState = () => {
  const [step, setStep] = useState(CHECKOUT_STEPS.REVIEW);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Padrão de 30 dias
    return date;
  });
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Atualiza a data final quando o plano muda
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
