import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TestTube } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { toast } from 'sonner';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { LogLevel, CheckoutEvent, logCheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';
import { useUserSession } from '@/hooks/useUserSession';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector from './PaymentMethodSelector';
import PixPaymentDetails from './PixPaymentDetails';
import CreditCardPayment from './CreditCardPayment';
import PixPaymentDebugger from './PixPaymentDebugger';

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
}

const PaymentGateway = ({
  orderId,
  totalAmount,
  preferenceId,
  pixData,
  onRefreshStatus
}: PaymentGatewayProps) => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>(
    localStorage.getItem('preferred_payment_method') || 'credit_card'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useUserSession();
  
  // Log de montagem do componente
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `PaymentGateway inicializado`,
      { 
        orderId, 
        paymentMethod,
        hasPix: !!pixData,
        hasPreference: !!preferenceId
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
  }, [orderId, paymentMethod, pixData, preferenceId]);
  
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
  
  // Prosseguir com o pagamento
  const handleProceedPayment = async () => {
    setIsLoading(true);
    
    try {
      if (paymentMethod === 'credit_card' && preferenceId) {
        toast.info("Redirecionando para o MercadoPago...");
        handleMercadoPagoRedirect(preferenceId, paymentMethod);
      } else if (paymentMethod === 'pix') {
        navigate(`/pix-payment?pedido=${orderId}`);
      } else {
        toast.error("Configuração de pagamento inválida");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("[PaymentGateway] Erro ao processar pagamento:", error);
      toast.error("Erro ao processar pagamento");
      setIsLoading(false);
    }
  };
  
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
        valorCompra: totalAmount || 0,
        paineisSelecionados: paineisList,
        timestamp: new Date().toISOString(),
        testMode: true
      };
      
      console.log("Sending webhook with test payload:", webhookPayload);
      
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
    <ClientOnly>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para checkout
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Pagamento</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Seletor de método de pagamento (coluna lateral) */}
          <div className="md:col-span-2">
            <PaymentMethodSelector 
              selectedMethod={paymentMethod}
              setSelectedMethod={handlePaymentMethodChange}
              totalAmount={totalAmount}
            />
          </div>
          
          {/* Conteúdo do pagamento (coluna principal) */}
          <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-6 border">
            {paymentMethod === 'pix' && pixData ? (
              <PixPaymentDetails
                qrCodeBase64={pixData.qrCodeBase64}
                qrCodeText={pixData.qrCode}
                status={pixData.status}
                paymentId={pixData.paymentId}
                onRefreshStatus={onRefreshStatus || (() => Promise.resolve())}
              />
            ) : paymentMethod === 'credit_card' ? (
              <CreditCardPayment
                preferenceId={preferenceId || ''}
                totalAmount={totalAmount}
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">Selecione um método de pagamento para continuar</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center flex justify-center gap-4">
          {!pixData && !preferenceId && (
            <Button 
              onClick={handleProceedPayment} 
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Processando..." : "Prosseguir com pagamento"}
            </Button>
          )}
          
          {/* Test payment button */}
          <Button 
            onClick={handleTestPayment}
            disabled={isLoading}
            size="lg"
            variant="outline"
            className="border-2 border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
          >
            PAGAR TESTE
            <TestTube className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        {/* Debugger para ambos os métodos de pagamento */}
        {orderId && (
          <PixPaymentDebugger 
            paymentData={pixData || null} 
            error={null}
            isLoading={isLoading}
            pedidoId={orderId}
            onRefresh={onRefreshStatus || (() => Promise.resolve())}
          />
        )}
      </div>
    </ClientOnly>
  );
};

export default PaymentGateway;
