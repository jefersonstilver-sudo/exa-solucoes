
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
import { supabase } from '@/integrations/supabase/client';

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
    sessionStorage.getItem('preferred_payment_method') || 'pix'
  );
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  // Log de montagem do componente
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `PaymentGateway inicializado com Mercado Pago`,
      { 
        orderId, 
        paymentMethod,
        userId
      }
    );
    
    // Salva preferência de método de pagamento (sessionStorage)
    sessionStorage.setItem('preferred_payment_method', paymentMethod);
    
    return () => {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `PaymentGateway desmontado`,
        { orderId }
      );
    };
  }, [orderId, paymentMethod, userId]);
  
  // Voltar para o resumo do checkout
  const handleBack = () => {
    navigate('/checkout/resumo');
  };
  
  // Atualizar método de pagamento
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    sessionStorage.setItem('preferred_payment_method', method);
    
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
  
  const handleCardPayment = async () => {
    if (isProcessing) {
      console.log("⚠️ Já processando pagamento, ignorando clique duplicado");
      return;
    }
    
    console.log("💳 PaymentGateway: Criando checkout Mercado Pago Checkout Pro:", { orderId });
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      'Criando preferência Mercado Pago Checkout Pro',
      { orderId, paymentMethod: 'credit_card' }
    );
    
    try {
      setIsProcessing(true);
      toast.loading("Preparando checkout seguro...", { id: 'checkout-loading' });
      
      // Chamar edge function para criar preferência Checkout Pro
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          pedido_id: orderId,
          payment_method: 'credit_card',
          total_amount: totalAmount,
          create_preference: true
        }
      });
      
      toast.dismiss('checkout-loading');
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      console.log('✅ Resposta da edge function:', data);
      
      // Redirecionar para checkout externo do Mercado Pago
      if (data?.init_point) {
        console.log("✅ Redirecionando para Mercado Pago:", data.init_point);
        toast.success("Redirecionando para checkout...", { duration: 2000 });
        
        // Small delay to show the success message
        setTimeout(() => {
          window.location.href = data.init_point;
        }, 500);
      } else {
        console.error('❌ Dados recebidos:', data);
        throw new Error('URL de checkout não disponível');
      }
    } catch (error) {
      console.error('❌ Erro completo:', error);
      toast.dismiss('checkout-loading');
      setIsProcessing(false);
      toast.error("Erro ao iniciar checkout. Tente novamente.");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao criar checkout Mercado Pago',
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

        {/* ✅ SISTEMA UNIFICADO: Mercado Pago para PIX e Cartão */}
        {/* 💵 PIX → MercadoPago (process-payment) */}
        {/* 💳 Cartão → MercadoPago (process-card-payment) */}
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
              onPaymentInitiate={handleCardPayment}
              isLoading={isProcessing}
            />
          )}
        </div>
        
        {/* Payment Info */}
        <div className="bg-muted/50 p-4 rounded-lg border border-border">
          <h3 className="font-semibold text-foreground mb-2">Informações do Pagamento</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>PIX</strong>: Processado via ASAAS (desconto de 5%)</p>
            <p>• <strong>Cartão</strong>: Processado via ASAAS (parcelamento disponível)</p>
            <p>• Pagamentos 100% seguros e criptografados</p>
            <p>• Você receberá confirmação por email</p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
};

export default PaymentGateway;
