
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
  const [sessionRetries, setSessionRetries] = useState(0);

  // Verificação otimizada de sessão
  const verifySession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      return !!data.session?.user;
    } catch (err) {
      console.error('Erro crítico ao verificar sessão:', err);
      return false;
    }
  }, []);

  // Verificação explícita de autenticação ao iniciar o componente
  useEffect(() => {
    let isMounted = true;
    
    const verifyAuthStatus = async () => {
      console.log('Verificando sessão do Supabase explicitamente');
      try {
        setIsPageLoading(true);
        
        const hasSession = await verifySession();
        
        if (!isMounted) return;
        
        console.log('Verificação de sessão:', hasSession ? 'Sessão válida encontrada' : 'Nenhuma sessão encontrada');
        
        if (hasSession) {
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.INFO,
            "Sessão válida verificada na página de planos",
            { timestamp: new Date().toISOString() }
          );
        }
        
        setIsAuthVerified(true);
        setIsPageLoading(false);
        
        return hasSession;
      } catch (err) {
        console.error('Erro crítico ao verificar sessão:', err);
        
        if (!isMounted) return false;
        
        // Se ainda não atingimos o máximo de tentativas, tentar novamente
        if (sessionRetries < 2) {
          console.log(`Tentando novamente (${sessionRetries + 1}/3)...`);
          setSessionRetries(prev => prev + 1);
          return false;
        }
        
        // Se atingimos o máximo de tentativas, sinalizar como verificado para não bloquear o fluxo
        setIsAuthVerified(true);
        setIsPageLoading(false);
        return false;
      }
    };
    
    verifyAuthStatus();
    
    return () => {
      isMounted = false;
    };
  }, [forceRerender, verifySession, sessionRetries]);
  
  // Função para verificar a autenticação - versão mais eficiente
  const checkAuthentication = useCallback(async () => {
    return await verifySession();
  }, [verifySession]);

  return {
    isAuthVerified,
    isPageLoading,
    setIsPageLoading,
    forceRerender,
    setForceRerender,
    checkAuthentication
  };
};
