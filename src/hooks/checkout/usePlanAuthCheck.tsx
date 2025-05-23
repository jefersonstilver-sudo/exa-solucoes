
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const usePlanAuthCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [forceRerender, setForceRerender] = useState(0);

  // Verificação explícita de autenticação ao iniciar o componente
  useEffect(() => {
    const verifySession = async () => {
      console.log('Verificando sessão do Supabase explicitamente');
      try {
        setIsPageLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro na verificação explícita de sessão:', error);
          setIsAuthVerified(true); // Mesmo com erro, consideramos verificado
          setIsPageLoading(false);
          return false;
        }
        
        const hasValidSession = !!data.session?.user;
        console.log('Verificação de sessão:', hasValidSession ? 'Sessão válida encontrada' : 'Nenhuma sessão encontrada');
        
        if (hasValidSession) {
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "Sessão válida verificada na página de planos",
            { 
              userId: data.session.user.id,
              email: data.session.user.email,
              timestamp: new Date().toISOString() 
            }
          );
        }
        
        setIsAuthVerified(true);
        
        return hasValidSession;
      } catch (err) {
        console.error('Erro crítico ao verificar sessão:', err);
        setIsAuthVerified(true);
        setIsPageLoading(false);
        return false;
      }
    };
    
    verifySession();
  }, [forceRerender]);
  
  // Função para verificar a autenticação
  const checkAuthentication = useCallback(async () => {
    try {
      console.log("PlanSelection: Verificando autenticação diretamente com Supabase...");
      
      // Verificação explícita da sessão
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("PlanSelection: Erro ao verificar sessão", error);
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.ERROR,
          "Erro ao verificar sessão na página de planos",
          { error: String(error), timestamp: Date.now() }
        );
        return false;
      }
      
      if (!data.session) {
        console.log("PlanSelection: Usuário não autenticado, mostrando notificação de login");
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.INFO,
          "Usuário não autenticado na página de planos",
          { timestamp: Date.now() }
        );
        return false;
      } 
      
      console.log("PlanSelection: Sessão encontrada no Supabase:", data.session.user.email);
      return true;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      logCheckoutEvent(
        CheckoutEvent.AUTH_EVENT,
        LogLevel.ERROR,
        "Erro crítico ao verificar autenticação na página de planos",
        { error: String(error), timestamp: Date.now() }
      );
      return false;
    }
  }, []);

  return {
    isAuthVerified,
    isPageLoading,
    setIsPageLoading,
    forceRerender,
    setForceRerender,
    checkAuthentication
  };
};
