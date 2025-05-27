
import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { motion } from 'framer-motion';

interface CheckoutContainerProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  step?: number;
  title?: string;
}

const CheckoutContainer = ({ 
  children, 
  requireAuth = true, 
  step = 0,
  title = "Checkout"
}: CheckoutContainerProps) => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  
  // CORREÇÃO CRÍTICA: Todos os hooks SEMPRE executam na mesma ordem
  // Usar useMemo para calcular estados sem afetar ordem de hooks
  const authState = useMemo(() => {
    return {
      shouldRedirect: requireAuth && !isSessionLoading && !isLoggedIn,
      shouldShowLoading: requireAuth && isSessionLoading,
      shouldShowContent: !requireAuth || (!isSessionLoading && isLoggedIn)
    };
  }, [requireAuth, isSessionLoading, isLoggedIn]);

  // ÚNICO useEffect para todas as verificações de autenticação
  useEffect(() => {
    // Log de acesso bem-sucedido
    if (isLoggedIn && user) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `MEGA CHECKOUT: Usuário autenticado acessando step ${step}`,
        { 
          userId: user.id, 
          step, 
          title,
          timestamp: new Date().toISOString() 
        }
      );
    }

    // Verificação de redirecionamento
    if (authState.shouldRedirect) {
      console.error("[CheckoutContainer] MEGA CHECKOUT: Usuário não autenticado");
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.ERROR,
        "Usuário não autenticado tentando acessar checkout",
        { step, timestamp: new Date().toISOString() }
      );
      
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, user, step, title, authState.shouldRedirect, navigate]);

  // CORREÇÃO: Renderização baseada em estado computado, não em condições que afetam hooks
  if (authState.shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm border p-8 text-center"
        >
          <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </motion.div>
      </div>
    );
  }
  
  if (authState.shouldRedirect) {
    return null; // Will be redirected by the effect above
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50"
    >
      {children}
    </motion.div>
  );
};

export default CheckoutContainer;
