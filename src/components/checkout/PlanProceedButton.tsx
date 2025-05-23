
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
  const { user, isLoggedIn, isLoading } = useUserSession();
  const [isSending, setIsSending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
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
  
  const handleClick = async () => {
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
  
  // Mostrar loading enquanto verificamos a autenticação
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex justify-center"
      >
        <Button 
          size="lg" 
          className="px-8 py-6"
          disabled={true}
        >
          <span className="mr-2">Verificando autenticação</span>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        </Button>
      </motion.div>
    );
  }
  
  // Renderizar botão diferente se não estiver autenticado
  if (!isLoggedIn && authChecked) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex justify-center"
      >
        <Button 
          size="lg" 
          className="px-8 py-6 bg-amber-500 hover:bg-amber-600"
          onClick={() => window.location.href = '/login?redirect=/selecionar-plano'}
        >
          Faça login para continuar
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10 flex justify-center"
    >
      <Button 
        size="lg" 
        className="px-8 py-6 bg-indexa-purple hover:bg-indexa-purple/90"
        onClick={handleClick}
        disabled={disabled || isSending}
      >
        {isSending ? (
          <>
            Registrando plano...
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          </>
        ) : (
          <>
            Continuar com o plano selecionado
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default PlanProceedButton;
