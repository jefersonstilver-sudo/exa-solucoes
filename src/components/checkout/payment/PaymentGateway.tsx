
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
  
  // Log for debugging webhook execution
  useEffect(() => {
    console.log("PaymentGateway component loaded with orderId:", orderId);
    if (pixData) {
      console.log("PIX data available:", pixData.status);
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
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, lista_paineis(id, building_id), buildings(*)')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      
      console.log('Detalhes do pedido carregados:', data);
      setOrderDetails(data);
    } catch (err) {
      console.error('Erro ao carregar detalhes do pedido:', err);
      toast.error('Não foi possível carregar detalhes do pedido');
    }
  };
  
  // Função para enviar webhook com informações do plano e prédios
  const sendWebhook = async () => {
    if (!user || !orderDetails) {
      console.error("Webhook não enviado: dados do usuário ou pedido ausentes", { 
        hasUser: !!user, 
        hasOrderDetails: !!orderDetails
      });
      toast.error("Dados incompletos para finalizar o pedido");
      return false;
    }
    
    setIsSendingWebhook(true);
    try {
      // Extrair informações dos prédios selecionados
      const selectedBuildings = orderDetails.lista_paineis 
        ? orderDetails.lista_paineis.map((painel: any) => {
            // Encontrar o prédio correspondente
            const building = orderDetails.buildings ? orderDetails.buildings.find((b: any) => b.id === painel.building_id) : null;
            return {
              id: painel.id,
              code: painel.code,
              buildingId: painel.building_id,
              buildingName: building ? building.name || building.nome : 'Não especificado',
              address: building ? building.address || building.endereco : 'Não especificado'
            };
          })
        : [];
      
      // Calcular período em dias
      const planoMeses = orderDetails.duracao / 30; // Convertendo dias para meses aproximados
      
      // Preparar payload do webhook com todos os parâmetros anteriores e adicionando informações dos prédios
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
      
      console.log("Enviando webhook com payload:", webhookPayload);
      
      // URL correta do webhook
      const webhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
      
      // Enviar webhook para a URL especificada
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        console.log("Webhook enviado com sucesso:", await response.text());
        toast.success("Plano registrado com sucesso!");
        return true;
      } else {
        console.error("Erro ao enviar webhook. Status:", response.status, "Resposta:", await response.text());
        toast.error("Erro ao registrar plano. Por favor, tente novamente.");
        return false;
      }
    } catch (error) {
      console.error("Exceção ao enviar webhook:", error);
      toast.error("Falha na comunicação. Por favor, tente novamente.");
      return false;
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
        // Enviar webhook antes de prosseguir com o pagamento PIX
        const webhookSuccess = await sendWebhook();
        
        if (webhookSuccess) {
          navigate(`/pix-payment?pedido=${orderId}`);
        } else {
          setIsLoading(false);
        }
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
