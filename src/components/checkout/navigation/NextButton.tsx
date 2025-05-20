
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface NextButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading?: boolean;
  isPaymentStep?: boolean;
  totalPrice?: number;
  paymentMethod?: string;
  orderId?: string;
}

const NextButton: React.FC<NextButtonProps> = ({ 
  onClick, 
  isDisabled, 
  isLoading = false,
  isPaymentStep = false,
  totalPrice = 0,
  paymentMethod,
  orderId
}) => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  
  let buttonText = "Continuar";
  
  if (isPaymentStep) {
    if (paymentMethod === 'pix') {
      buttonText = "Pagar com PIX";
    } else if (paymentMethod === 'credit_card') {
      buttonText = "Pagar com Cartão";
    } else {
      buttonText = "Prosseguir com pagamento";
    }
  }
  
  // Test payment handler
  const handleTestPayment = async () => {
    toast.success("Modo de pagamento de teste ativado");
    
    try {
      // Get cart items from localStorage
      const cartStorageKey = 'indexa_cart';
      const cartItemsJSON = localStorage.getItem(cartStorageKey);
      const cartItems = cartItemsJSON ? JSON.parse(cartItemsJSON) : [];
      
      // Get building names for the selected panels
      let paineisList = [];
      if (cartItems && cartItems.length > 0) {
        // Fetch building information for each panel
        const panelIds = cartItems.map(item => item.panel.id);
        const { data: buildingsData } = await supabase
          .from('buildings')
          .select('id, nome')
          .in('id', panelIds);
          
        if (buildingsData) {
          paineisList = buildingsData.map(building => building.nome);
        } else {
          paineisList = cartItems.map((item, index) => `Painel ${index + 1}`);
        }
      }
      
      // Prepare webhook payload with user and plan data
      const webhookPayload = {
        userId: user?.id,
        fullName: user?.name || 'Não fornecido',
        userEmail: user?.email,
        valorCompra: totalPrice || 0,
        paineisSelecionados: paineisList,
        timestamp: new Date().toISOString(),
        testMode: true
      };
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Sending test payment webhook`,
        webhookPayload
      );
      
      // Send webhook to the specified URL
      const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (response.ok) {
        console.log("Test webhook sent successfully");
        // Simulate payment success and redirect
        toast.success("Pagamento de teste processado! Redirecionando...");
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${orderId}`);
        }, 1500);
      } else {
        console.error("Error sending webhook:", response.status);
        toast.error("Erro ao enviar dados de teste");
      }
    } catch (error) {
      console.error("Error in test payment:", error);
      toast.error("Erro ao processar pagamento de teste");
    }
  };

  return (
    <div className="flex gap-4">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={onClick}
          disabled={isDisabled}
          size="lg"
          className={`px-8 py-6 ${isPaymentStep ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processando...
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </motion.div>
      
      {isPaymentStep && orderId && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Button 
            onClick={handleTestPayment}
            disabled={isDisabled}
            size="lg"
            variant="outline"
            className="px-8 py-6 border-2 border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
          >
            PAGAR TESTE
            <TestTube className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NextButton;
