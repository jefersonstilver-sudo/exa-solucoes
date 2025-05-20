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
  const [isSendingWebhook, setIsSendingWebhook] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [webhookSent, setWebhookSent] = useState<boolean>(false);
  
  // Log for debugging webhook execution
  useEffect(() => {
    console.log("[PaymentGateway] Component loaded with orderId:", orderId);
    if (pixData) {
      console.log("[PaymentGateway] PIX data available:", pixData.status);
    }
    
    // Log info about the webhook state
    console.log("[PaymentGateway] Initial webhook state:", {
      webhookSent,
      isSendingWebhook,
      retryCount
    });
  }, [orderId, pixData, webhookSent, isSendingWebhook, retryCount]);
  
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
  
  // Função para enviar webhook com informações do plano e prédios
  const sendWebhook = async () => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Tentando enviar webhook PIX`,
      { orderId, paymentMethod, timestamp: new Date().toISOString() }
    );
    
    if (!user || !orderDetails) {
      console.error("[PaymentGateway] Webhook não enviado: dados do usuário ou pedido ausentes", { 
        hasUser: !!user, 
        hasOrderDetails: !!orderDetails,
        userId: user?.id,
        orderDetailsId: orderDetails?.id
      });
      
      toast.error("Dados incompletos para finalizar o pedido");
      return false;
    }
    
    setIsSendingWebhook(true);
    try {
      console.log("[PaymentGateway] Preparing webhook payload with order:", orderDetails);
      
      // Verificar se temos lista_paineis no orderDetails
      if (!orderDetails.lista_paineis) {
        console.error("[PaymentGateway] Missing lista_paineis in order details");
        await fetchOrderDetails(); // Tentar buscar novamente os dados
        
        if (!orderDetails.lista_paineis) {
          toast.error("Dados de painéis não encontrados. Tente novamente.");
          setIsSendingWebhook(false);
          return false;
        }
      }
      
      // Extrair informações dos prédios selecionados
      const selectedBuildings = [];
      
      // Verificar se lista_paineis é um array
      if (Array.isArray(orderDetails.lista_paineis)) {
        console.log("[PaymentGateway] Processing panel list:", orderDetails.lista_paineis.length);
        
        for (const painel of orderDetails.lista_paineis) {
          try {
            console.log("[PaymentGateway] Processing panel:", painel);
            
            // Buscar informações do prédio diretamente do banco
            const { data: buildingData, error } = await supabase
              .from('buildings')
              .select('*')
              .eq('id', painel.building_id)
              .single();
              
            if (error) {
              console.error("[PaymentGateway] Error fetching building data:", error);
              continue;
            }
            
            console.log("[PaymentGateway] Found building data:", buildingData);
            
            selectedBuildings.push({
              id: painel.id,
              code: painel.code,
              buildingId: painel.building_id,
              buildingName: buildingData?.nome || 'Não especificado',
              address: buildingData?.endereco || 'Não especificado'
            });
          } catch (err) {
            console.error("[PaymentGateway] Error processing building data:", err);
          }
        }
      } else {
        console.error("[PaymentGateway] lista_paineis is not an array:", orderDetails.lista_paineis);
      }
      
      console.log("[PaymentGateway] Processed buildings:", selectedBuildings);
      
      // Calcular período em dias
      const planoMeses = orderDetails.duracao / 30; // Convertendo dias para meses aproximados
      
      // Preparar payload do webhook com todos os parâmetros
      const webhookPayload = {
        userId: user.id,
        fullName: user.name || 'Not provided',
        userEmail: user.email,
        planoEscolhido: planoMeses,
        periodoDias: orderDetails.duracao,
        planoNome: `Plano ${planoMeses} meses`,
        valorTotal: totalAmount || 0,
        prediosSelecionados: selectedBuildings,
        paymentMethod: paymentMethod,
        orderId: orderId,
        timestamp: new Date().toISOString()
      };
      
      console.log("[PaymentGateway] Sending webhook with payload:", webhookPayload);
      
      // URL do webhook
      const webhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
      
      // Enviar webhook para a URL especificada com timeout de 15 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Source': 'stilver-app',
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log("[PaymentGateway] Webhook sent successfully:", responseText);
        toast.success("Plano registrado com sucesso!");
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.INFO,
          `Webhook PIX enviado com sucesso`,
          { orderId, responseStatus: response.status }
        );
        setWebhookSent(true);
        setRetryCount(0);
        return true;
      } else {
        console.error("[PaymentGateway] Error sending webhook. Status:", response.status, "Response:", await response.text());
        toast.error("Erro ao registrar plano. Nova tentativa em curso...");
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          `Erro no envio do webhook PIX`,
          { orderId, status: response.status }
        );
        
        // Se não for bem sucedido e tivermos menos de 3 tentativas, tentar novamente após 2 segundos
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => sendWebhook(), 2000);
          return false;
        } else {
          toast.error("Erro ao registrar plano após várias tentativas. Continuando com o pagamento.");
          return true; // Continuar mesmo após falhas
        }
      }
    } catch (error) {
      console.error("[PaymentGateway] Exception when sending webhook:", error);
      toast.error("Falha na comunicação. Tentando novamente...");
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Exceção no envio do webhook PIX: ${error}`,
        { orderId, error: String(error) }
      );
      
      // Se tivermos menos de 3 tentativas, tentar novamente após 2 segundos
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => sendWebhook(), 2000);
        return false;
      } else {
        toast.error("Erro de comunicação após várias tentativas. Continuando com o pagamento.");
        return true; // Continuar mesmo após falhas
      }
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
        
        console.log("[PaymentGateway] Processing PIX payment, sending webhook...");
        
        // Enviar webhook antes de prosseguir com o pagamento PIX
        // CRITICAL: Esta é a parte importante que garante que o webhook seja enviado
        const webhookResult = await sendWebhook();
        
        // Log webhook result
        console.log("[PaymentGateway] Webhook result:", webhookResult);
        
        // Sempre navegar para a página de PIX, mesmo se o webhook falhar
        // O webhook pode ser reenviado posteriormente se necessário
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
          {isSendingWebhook || isLoading ? (
            <>
              {isSendingWebhook ? "Enviando dados..." : "Processando pagamento..."}
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
