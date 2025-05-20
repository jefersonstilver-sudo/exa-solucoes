
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
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
  const { user } = useUserSession();
  const [paymentMethod, setPaymentMethod] = useState<string>(
    localStorage.getItem('preferred_payment_method') || 'credit_card'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  
  // Log for debugging component load
  useEffect(() => {
    console.log("[PaymentGateway] Component loaded with orderId:", orderId);
    if (pixData) {
      console.log("[PaymentGateway] PIX data available:", pixData.status);
    }
  }, [orderId, pixData]);
  
  // Buscar detalhes do pedido ao carregar o componente
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  const fetchOrderDetails = async () => {
    try {
      console.log("[PaymentGateway] Fetching order details for ID:", orderId);
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, lista_paineis(id, building_id), buildings(*)')
        .eq('id', orderId)
        .single();
      
      if (error) {
        console.error("[PaymentGateway] Error fetching order details:", error);
        throw error;
      }
      
      console.log('[PaymentGateway] Order details loaded:', data);
      setOrderDetails(data);
      
      // Log to verify lista_paineis and buildings data
      if (data.lista_paineis) {
        console.log('[PaymentGateway] Panels in order:', data.lista_paineis.length);
      }
      
      if (data.buildings) {
        console.log('[PaymentGateway] Buildings data:', 
          Array.isArray(data.buildings) 
            ? `${data.buildings.length} buildings` 
            : 'Single building object');
      }
    } catch (err) {
      console.error('[PaymentGateway] Error loading order details:', err);
      toast.error('Não foi possível carregar detalhes do pedido');
    }
  };
  
  // Function to send webhook with user and order details
  const sendPixWebhook = async () => {
    if (!user || !orderDetails) return;
    
    try {
      setIsSendingWebhook(true);
      console.log("[PaymentGateway] Sending PIX webhook for order:", orderId);
      
      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error("[PaymentGateway] Error fetching user data:", userError);
        throw userError;
      }
      
      // Get building information for selected panels
      const panelDetails = [];
      if (orderDetails.lista_paineis && Array.isArray(orderDetails.lista_paineis)) {
        for (const panel of orderDetails.lista_paineis) {
          const { data: buildingData, error: buildingError } = await supabase
            .from('buildings')
            .select('*')
            .eq('id', panel.building_id)
            .single();
            
          if (!buildingError && buildingData) {
            panelDetails.push({
              id: panel.id,
              buildingName: buildingData.nome,
              address: buildingData.endereco
            });
          }
        }
      }
      
      // Prepare webhook payload - fixing the user_metadata access issue
      const webhookPayload = {
        user_id: user.id,
        nome: user.name || 'Cliente', // Use name from UserProfile instead of user_metadata
        email: userData?.email || user.email,
        valor_compra: totalAmount,
        paineis_escolhidos: panelDetails
      };
      
      // Send webhook
      const webhookResponse = await fetch("https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error("[PaymentGateway] Webhook failed:", errorText);
        // We continue the payment process even if webhook fails
      } else {
        console.log("[PaymentGateway] Webhook sent successfully");
      }
    } catch (err) {
      console.error("[PaymentGateway] Error sending webhook:", err);
      // Payment process continues even if webhook fails
    } finally {
      setIsSendingWebhook(false);
    }
  };
  
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
        // Before proceeding with PIX payment, trigger the webhook
        if (paymentMethod === 'pix') {
          await sendPixWebhook();
        }
      
        // Antes de prosseguir com o PIX, verificar se temos detalhes do pedido
        if (!orderDetails) {
          console.log("[PaymentGateway] Order details missing, trying to fetch...");
          await fetchOrderDetails();
          
          // Se ainda não temos detalhes, exibir erro
          if (!orderDetails) {
            console.error("[PaymentGateway] Unable to load order details");
            toast.error("Não foi possível carregar detalhes do pedido. Tente novamente.");
            setIsLoading(false);
            return;
          }
        }
        
        console.log("[PaymentGateway] Processing PIX payment...");
        // Navegar diretamente para a página de PIX
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
  
  // Botão personalizado para PIX
  const renderPixButton = () => {
    if (pixData) return null; // Se já temos dados PIX, não mostrar o botão
    
    if (paymentMethod === 'pix') {
      return (
        <Button 
          onClick={handleProceedPayment}
          disabled={isLoading || isSendingWebhook}
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white w-full py-6"
        >
          {isLoading || isSendingWebhook ? (
            <>
              Processando pagamento...
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            </>
          ) : (
            <>
              Pagar com PIX R$ {totalAmount.toFixed(2).replace('.', ',')}
            </>
          )}
        </Button>
      );
    }
    
    return null;
  };
  
  // Botão para cartão de crédito
  const renderCreditCardButton = () => {
    if (preferenceId) return null; // Se já temos preferência, não mostrar o botão
    
    if (paymentMethod === 'credit_card') {
      return (
        <Button 
          onClick={handleProceedPayment}
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-6"
        >
          {isLoading ? (
            <>
              Processando...
              <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            </>
          ) : (
            <>
              Pagar com Cartão R$ {totalAmount.toFixed(2).replace('.', ',')}
            </>
          )}
        </Button>
      );
    }
    
    return null;
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
        
        <div className="mt-8 text-center">
          {!pixData && !preferenceId && (
            <>
              {renderPixButton()}
              {renderCreditCardButton()}
            </>
          )}
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
