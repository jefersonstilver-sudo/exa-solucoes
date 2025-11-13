
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
  
  // ✅ SISTEMA DUAL: PIX via MercadoPago | Cartão via Stripe
  const handlePixPayment = async () => {
    console.log("💵 PaymentGateway: Navegando para página PIX (MercadoPago):", { orderId });
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      'Redirecionando para pagamento PIX via MercadoPago',
      { orderId, paymentMethod: 'pix' }
    );
    
    // ✅ ROTA CORRETA: /pix-payment com query param
    navigate(`/pix-payment?pedido=${orderId}`);
  };
  
  const handleStripePayment = async () => {
    console.log("💳 PaymentGateway: Iniciando pagamento com cartão via Stripe:", { orderId });
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      'Iniciando pagamento com cartão via Stripe',
      { orderId, paymentMethod: 'credit_card' }
    );
    
    try {
      const { url } = await createCheckoutSession(orderId);
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        'Redirecionando para Stripe Checkout',
        { orderId, stripeUrl: url }
      );
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('❌ Erro ao processar pagamento Stripe:', error);
      toast.error("Erro ao processar pagamento com cartão");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao criar sessão Stripe',
        { orderId, error: error instanceof Error ? error.message : String(error) }
      );
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

        {/* ✅ SISTEMA DUAL DE PAGAMENTOS */}
        {/* 💵 PIX → MercadoPago (process-payment) */}
        {/* 💳 Cartão → Stripe (stripe-create-checkout) */}
        <div className="space-y-4">
          {paymentMethod === 'pix' ? (
            <PixPaymentButton
              totalAmount={totalAmount}
              onPaymentInitiate={handlePixPayment}
              disabled={false}
            />
          ) : (
            <CreditCardPayment
              totalAmount={totalAmount}
              onPaymentInitiate={handleStripePayment}
              isLoading={isCreating}
            />
          )}
        </div>
        
        {/* Payment Info */}
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-2">Informações do Pagamento</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>PIX</strong>: Processado via MercadoPago (desconto de 5%)</p>
            <p>• <strong>Cartão</strong>: Processado via Stripe (parcelamento disponível)</p>
            <p>• Pagamentos 100% seguros e criptografados</p>
            <p>• Você receberá confirmação por email</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
};

export default PaymentGateway;
