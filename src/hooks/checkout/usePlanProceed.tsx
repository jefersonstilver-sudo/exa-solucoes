
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Verificar autenticação somente quando o status de autenticação estiver pronto
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

  // Verificação de sessão otimizada usando memoização
  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return !!data.session;
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      return false;
    }
  }, []);

  const handlePlanProceed = async () => {
    // Garantir que não estamos já processando um envio
    if (isSending) return;
    
    // Verificação rápida da sessão antes de continuar
    const hasValidSession = await verifySession();
    if (!hasValidSession) {
      toast.error("Sua sessão expirou. Faça login novamente.");
      handleLoginRedirect();
      return;
    }
    
    // Validar dados necessários
    if (!user || !selectedPlan || !planData) {
      console.error("Dados incompletos:", { 
        hasUser: !!user, 
        selectedPlan, 
        hasPlanData: !!planData 
      });
      toast.error("Erro ao processar plano. Tente novamente.");
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
      
      // Salvar no localStorage para persistência
      try {
        localStorage.setItem('selectedPlan', String(selectedPlan));
      } catch (e) {
        console.warn("Não foi possível salvar o plano no localStorage:", e);
      }
      
      toast.success("Plano registrado com sucesso!");
      
      // Continue with the original function
      onProceed();
    } catch (error) {
      console.error("Exceção ao processar seleção do plano:", error);
      toast.error("Falha na comunicação. Por favor, tente novamente.");
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.ERROR,
        "Erro ao processar seleção do plano",
        { error: String(error), timestamp: new Date().toISOString() }
      );
    } finally {
      setIsSending(false);
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
