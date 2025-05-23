
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UsePlanProceedProps {
  onProceed: () => void;
  selectedPlan?: number | null;
  planData?: any;
  totalPrice?: number;
}

export const usePlanProceed = ({ 
  onProceed, 
  selectedPlan, 
  planData,
  totalPrice 
}: UsePlanProceedProps) => {
  const { user, isLoggedIn, isLoading } = useUserSession();
  const [isSending, setIsSending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();
  
  // Verificar autenticação quando o componente montar ou quando o status de autenticação mudar
  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
      
      // Log para diagnóstico do estado de autenticação
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT,
        LogLevel.INFO,
        `PlanProceedButton: Status de autenticação verificado`,
        { 
          isLoggedIn, 
          hasUser: !!user,
          userId: user?.id || 'não autenticado',
          timestamp: new Date().toISOString() 
        }
      );
    }
  }, [user, isLoggedIn, isLoading]);

  const handlePlanProceed = async () => {
    // Primeiro verificar se está autenticado
    if (!isLoggedIn) {
      console.error("Usuário não autenticado ao tentar proceder com o plano");
      
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT,
        LogLevel.WARNING,
        "Tentativa de proceder com plano sem autenticação",
        { timestamp: new Date().toISOString() }
      );
      
      toast.error("É necessário fazer login para continuar");
      return;
    }
    
    if (!user || !selectedPlan || !planData) {
      console.error("Dados do usuário ou plano ausentes", { 
        hasUser: !!user, 
        selectedPlan, 
        hasPlanData: !!planData 
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      console.log("Processando seleção do plano:", {
        planId: selectedPlan,
        planName: planData.name || `Plano ${selectedPlan} meses`,
        valorTotal: totalPrice || 0
      });
      
      logCheckoutEvent(
        CheckoutEvent.USER_ACTION,
        LogLevel.INFO,
        "Usuário clicou em continuar com plano selecionado",
        { 
          planId: selectedPlan,
          userId: user.id,
          timestamp: new Date().toISOString() 
        }
      );
      
      toast.success("Plano registrado com sucesso!");
      
      // Continue with the original function
      onProceed();
    } catch (error) {
      console.error("Exceção ao processar seleção do plano:", error);
      toast.error("Falha na comunicação. Por favor, tente novamente.");
      setIsSending(false);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.ERROR,
        "Erro ao processar seleção do plano",
        { error: String(error), timestamp: new Date().toISOString() }
      );
    }
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login?redirect=/selecionar-plano';
  };

  return {
    user,
    isLoggedIn,
    isLoading,
    isSending,
    authChecked,
    handlePlanProceed,
    handleLoginRedirect
  };
};
