
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const useCheckoutAuth = (setSessionUser: (user: any) => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  
  // Verificação inicial e configuração do listener de autenticação
  useEffect(() => {
    console.log("useCheckoutAuth: Configurando verificação de autenticação");
    let mounted = true;
    setIsAuthChecking(true);
    
    const checkAuthStatus = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("useCheckoutAuth: Erro ao obter sessão", error);
          
          logCheckoutEvent(
            CheckoutEvent.AUTH_EVENT,
            LogLevel.ERROR,
            "Error getting session in checkout flow",
            { error: String(error), timestamp: new Date().toISOString() }
          );
          
          if (mounted) {
            toast({
              title: "Erro de autenticação",
              description: "Ocorreu um problema ao verificar sua sessão. Por favor, faça login novamente.",
              variant: "destructive"
            });
            navigate('/login?redirect=/checkout');
          }
          return;
        }
        
        console.log("useCheckoutAuth: Status da sessão verificado", 
          data.session ? "Usuário autenticado" : "Usuário não autenticado");
        
        if (!data.session?.user) {
          if (mounted) {
            toast({
              title: "Login necessário",
              description: "Você precisa estar logado para finalizar a compra.",
              variant: "destructive"
            });
            navigate('/login?redirect=/checkout');
          }
        } else {
          if (mounted) {
            setSessionUser(data.session.user);
            
            // Log para diagnóstico
            logCheckoutEvent(
              CheckoutEvent.AUTH_EVENT,
              LogLevel.INFO,
              "User authenticated in checkout flow",
              { 
                userId: data.session.user.id, 
                email: data.session.user.email,
                timestamp: new Date().toISOString() 
              }
            );
          }
        }
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    };
    
    // Verificação inicial
    checkAuthStatus();
    
    // Configura o listener para mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("useCheckoutAuth: Auth state mudou:", event);
      
      // Verificação de perda de sessão durante o checkout
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || !session) {
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.INFO,
          `Auth state changed in checkout: ${event}`,
          { event, hasSession: !!session, timestamp: new Date().toISOString() }
        );
      }
      
      if (event === 'SIGNED_IN') {
        if (mounted) setSessionUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setSessionUser(null);
          navigate('/login?redirect=/checkout');
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Atualizar o usuário quando o token for atualizado
        if (mounted) setSessionUser(session.user);
        
        logCheckoutEvent(
          CheckoutEvent.AUTH_EVENT,
          LogLevel.INFO,
          "Token refreshed in checkout flow",
          { 
            userId: session.user.id,
            email: session.user.email,
            timestamp: new Date().toISOString() 
          }
        );
      }
    });
    
    // Verificação periódica para garantir que a sessão não foi perdida (a cada 30 segundos)
    const refreshInterval = setInterval(async () => {
      if (mounted) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.log("useCheckoutAuth: Sessão não encontrada na verificação periódica");
            
            logCheckoutEvent(
              CheckoutEvent.AUTH_EVENT,
              LogLevel.WARNING,
              "Session check failed in periodic check",
              { timestamp: new Date().toISOString() }
            );
            
            // Só redireciona se realmente não tiver sessão
            if (mounted) {
              toast({
                title: "Sua sessão expirou",
                description: "Por favor, faça login novamente para continuar.",
                variant: "destructive"
              });
              navigate('/login?redirect=/checkout');
            }
          }
        } catch (err) {
          console.error("useCheckoutAuth: Erro na verificação periódica", err);
        }
      }
    }, 30000); // 30 segundos
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [navigate, toast, setSessionUser]);
  
  return { isAuthChecking };
};
