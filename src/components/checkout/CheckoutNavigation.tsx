
import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CheckoutNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isBackToStore: boolean;
  isNextEnabled: boolean;
  isCreatingPayment: boolean;
  isNavigating: boolean;
  isPaymentStep: boolean;
  totalPrice?: number;
  paymentMethod?: string;
}

const CheckoutNavigation = ({ 
  onBack, 
  onNext, 
  isBackToStore, 
  isNextEnabled, 
  isCreatingPayment, 
  isNavigating,
  isPaymentStep,
  totalPrice = 0,
  paymentMethod = 'credit_card'
}: CheckoutNavigationProps) => {
  const { user } = useUserSession();
  
  // Function to send data to webhook for PIX payment
  const handlePayWithPix = async () => {
    if (paymentMethod !== 'pix') {
      onNext();
      return;
    }

    try {
      // Get user information
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Get cart items from localStorage
      const cartItemsStr = localStorage.getItem('indexa_cart');
      const cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];

      // Get selected plan from localStorage
      const selectedPlan = localStorage.getItem('selectedPlan') || '1';
      
      // Calculate discount if using PIX (5% off)
      const pixDiscount = 0.05;
      const discountedTotal = totalPrice * (1 - pixDiscount);

      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('clientes')
        .select('email, nome')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
      }

      // Prepare webhook data
      const webhookData = {
        cliente_id: user.id,
        email: userData?.email || user.email,
        nome: userData?.nome || user.email?.split('@')[0] || 'Cliente',
        plano_escolhido: `${selectedPlan} ${parseInt(selectedPlan) === 1 ? 'mês' : 'meses'}`,
        predios_selecionados: cartItems.map((item: any) => ({
          id: item.panel.id,
          nome: item.panel.nome || item.panel.buildings?.nome || 'Painel'
        })),
        valor_total: discountedTotal.toFixed(2),
        periodo_exibicao: 'Conforme selecionado no checkout'
      };

      // Send data to webhook
      const webhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
      
      console.log("Enviando dados para webhook:", webhookData);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        mode: 'no-cors' // Important for cross-origin webhook calls
      });

      // Log the webhook call
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Webhook chamado para iniciar pagamento PIX`,
        { webhookData }
      );

      // Continue with payment flow
      onNext();
    } catch (error) {
      console.error("Erro ao chamar webhook:", error);
      // Continue with payment even if webhook fails
      onNext();
    }
  };

  // When on payment step and using PIX, show a specific pay button
  const getNextButton = () => {
    if (isPaymentStep && paymentMethod === 'pix') {
      return (
        <Button
          onClick={handlePayWithPix}
          disabled={!isNextEnabled || isCreatingPayment || isNavigating}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-md"
        >
          {isCreatingPayment || isNavigating ? (
            <>
              <span className="mr-2">Processando...</span>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>Pagar com PIX {totalPrice ? `R$ ${(totalPrice * 0.95).toFixed(2)}` : ''}</>
          )}
        </Button>
      );
    }

    return (
      <Button
        onClick={onNext}
        disabled={!isNextEnabled || isCreatingPayment || isNavigating}
        className="bg-indexa-purple hover:bg-indigo-800 text-white px-6 py-2.5 rounded-md"
      >
        {isCreatingPayment || isNavigating ? (
          <>
            <span className="mr-2">Processando...</span>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </>
        ) : (
          <>Continuar</>
        )}
      </Button>
    );
  };

  return (
    <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
      <Button
        onClick={onBack}
        variant="ghost"
        className="text-gray-600"
      >
        {isBackToStore ? 'Voltar para loja' : 'Voltar'}
      </Button>
      
      {getNextButton()}
    </div>
  );
};

export default CheckoutNavigation;
