
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { toast } from 'sonner';
import { LogLevel, CheckoutEvent, logCheckoutEvent } from '@/services/checkoutDebugService';
import PaymentMethodSelector from './PaymentMethodSelector';
import CreditCardPayment from './CreditCardPayment';
import PixPaymentButton from '../navigation/PixPaymentButton';
import { useStripeCheckout } from '@/hooks/payment/useStripeCheckout';

interface PaymentGatewayProps {
  orderId: string;
  totalAmount: number;
  preferenceId?: string;
  pixData?: {
    qrCodeBase64: string;
    qrCode: string;
    paymentId: string;
    status: string;
  };
  onRefreshStatus?: () => Promise<void>;
  userId?: string;
}

const PaymentGateway = ({
  orderId,
  totalAmount,
  preferenceId,
  pixData,
  onRefreshStatus,
  userId
}: PaymentGatewayProps) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>(
    localStorage.getItem('preferred_payment_method') || 'pix'
  );
  const { createCheckoutSession, isCreating } = useStripeCheckout();
  
  // Log de montagem do componente
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `PaymentGateway inicializado com Stripe`,
      { 
        orderId, 
        paymentMethod,
        userId
      }
    );
    
    // Salva preferência de método de pagamento
    localStorage.setItem('preferred_payment_method', paymentMethod);
    
    return () => {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `PaymentGateway desmontado`,
        { orderId }
      );
    };
  }, [orderId, paymentMethod, userId]);
  
  // Voltar para o checkout
  const handleBack = () => {
    navigate('/checkout');
  };
  
  // Atualizar método de pagamento
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    localStorage.setItem('preferred_payment_method', method);
    
    // Log para eventos
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Método de pagamento alterado para: ${method}`,
      { orderId, method }
    );
  };
  
  // Handle payment for both PIX and Credit Card via Stripe
  const handlePayment = async () => {
    console.log("🎯 PaymentGateway: Iniciando pagamento via Stripe:", { orderId, paymentMethod });
    
    try {
      const { url } = await createCheckoutSession(orderId);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error("Erro ao processar pagamento");
    }
  };
  
  return (
    <ClientOnly>
      <div className="flex flex-col space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="self-start"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Payment Method Selector */}
        <PaymentMethodSelector
          selectedMethod={paymentMethod}
          onMethodChange={handlePaymentMethodChange}
          totalAmount={totalAmount}
        />

        {/* Payment Button - Same for both PIX and Credit Card */}
        <div className="space-y-4">
          {paymentMethod === 'pix' ? (
            <PixPaymentButton
              totalAmount={totalAmount}
              onPaymentInitiate={handlePayment}
              disabled={isCreating}
            />
          ) : (
            <CreditCardPayment
              totalAmount={totalAmount}
              onPaymentInitiate={handlePayment}
              isLoading={isCreating}
            />
          )}
        </div>
        
        {/* Payment Info */}
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-2">Informações do Pagamento</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Seu pagamento será processado de forma segura via Stripe</p>
            <p>• PIX: Desconto de 5% aplicado automaticamente</p>
            <p>• Cartão: Parcelamento disponível</p>
            <p>• Você receberá confirmação por email</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
};

export default PaymentGateway;
