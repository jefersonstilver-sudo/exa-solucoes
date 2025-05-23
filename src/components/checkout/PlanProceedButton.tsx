
import React from 'react';
import { usePlanProceed } from '@/hooks/checkout/usePlanProceed';
import PlanButtonLoading from '@/components/checkout/plan-button/PlanButtonLoading';
import LoginButton from '@/components/checkout/plan-button/LoginButton';
import ProceedButton from '@/components/checkout/plan-button/ProceedButton';

interface PlanProceedButtonProps {
  onProceed: () => void;
  disabled: boolean;
  selectedPlan?: number | null;
  planData?: any;
  totalPrice?: number;
}

const PlanProceedButton: React.FC<PlanProceedButtonProps> = ({ 
  onProceed, 
  disabled,
  selectedPlan,
  planData,
  totalPrice
}) => {
  const {
    isLoggedIn,
    isLoading,
    isSending,
    authChecked,
    handlePlanProceed,
    handleLoginRedirect
  } = usePlanProceed({
    onProceed,
    selectedPlan,
    planData,
    totalPrice
  });
  
  // Mostrar loading enquanto verificamos a autenticação
  if (isLoading) {
    return <PlanButtonLoading />;
  }
  
  // Renderizar botão diferente se não estiver autenticado
  if (!isLoggedIn && authChecked) {
    return <LoginButton onClick={handleLoginRedirect} />;
  }

  return (
    <ProceedButton 
      onClick={handlePlanProceed}
      disabled={disabled}
      isSending={isSending} 
    />
  );
};

export default PlanProceedButton;
