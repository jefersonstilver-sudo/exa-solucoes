import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import { toast } from 'sonner';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { LogLevel, CheckoutEvent, logCheckoutEvent } from '@/services/checkoutDebugService';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';
import PaymentMethodSelector from './PaymentMethodSelector';
import PixPaymentDetails from './PixPaymentDetails';
import CreditCardPayment from './CreditCardPayment';
import PixPaymentDebugger from './PixPaymentDebugger';
import { sendPixPaymentWebhook, getUserInfo } from '@/utils/paymentWebhooks';

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
    localStorage.getItem('preferred_payment_method') || 'credit_card'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Log de montagem do componente
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `PaymentGateway inicializado - WEBHOOK URL CORRIGIDA`,
      { 
        orderId, 
        paymentMethod,
        hasPix: !!pixData,
        hasPreference: !!preferenceId,
        hasUserId: !!userId,
        webhookUrl: "https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19"
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
  }, [orderId, paymentMethod, pixData, preferenceId, userId]);
  
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
    
    // Validate user authentication first
    if (paymentMethod === 'pix' && !userId) {
      toast.error("Usuário não autenticado");
      setIsLoading(false);
      navigate('/login?redirect=/checkout');
      return;
    }
    
    try {
      if (paymentMethod === 'credit_card' && preferenceId) {
        toast.info("Redirecionando para o MercadoPago...");
        handleMercadoPagoRedirect(preferenceId, paymentMethod);
      } else if (paymentMethod === 'pix') {
        console.log("🎯 PaymentGateway: Iniciando fluxo PIX com WEBHOOK CORRIGIDO");
        
        // If we're in PIX payment flow, send the webhook and then navigate
        if (userId) {
          // Get user information
          const userInfo = await getUserInfo(userId);
          
          if (!userInfo) {
            toast.error("Erro ao buscar dados do usuário");
            setIsLoading(false);
            return;
          }
          
          // Get cart items from localStorage
          const cartItemsStr = localStorage.getItem('indexa_cart');
          const cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];
          
          // Format cart items for the webhook
          const formattedPredios = cartItems.map((item: any) => ({
            id: item.panel?.id || '',
            nome: item.panel?.nome || item.panel?.buildings?.nome || 'Painel'
          }));
          
          // Get selected plan or default to 1 month
          const selectedPlan = localStorage.getItem('selectedPlan') || '1';
          
          // Prepare webhook data
          const webhookData = {
            cliente_id: userId,
            email: userInfo.email,
            nome: userInfo.nome,
            plano_escolhido: "Mensal",
            periodo_meses: parseInt(selectedPlan),
            predios_selecionados: formattedPredios,
            valor_total: totalAmount.toFixed(2),
            periodo_exibicao: {
              inicio: new Date().toLocaleDateString('pt-BR'),
              fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('pt-BR')
            }
          };
          
          console.log("🎯 PaymentGateway: Enviando dados para webhook CORRIGIDO:", webhookData);
          
          // Send webhook and handle response
          const response = await sendPixPaymentWebhook(webhookData);
          
          if (response.success) {
            // Show success and navigate to PIX payment page
            toast.success("PIX gerado com sucesso!");
          } else {
            toast.error("Erro ao gerar PIX");
          }
        }
        
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
                userId={userId}
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
            <Button 
              onClick={handleProceedPayment} 
              disabled={isLoading}
              size="lg"
              className={paymentMethod === 'pix' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
            >
              {isLoading ? "Processando..." : paymentMethod === 'pix' ? 
                `Pagar com PIX ${totalAmount ? `R$ ${(totalAmount * 0.95).toFixed(2)}` : ''}` : 
                "Prosseguir com pagamento"}
            </Button>
          )}
        </div>
        
        {/* Debugger para ambos os métodos de pagamento */}
        {orderId && (
          <PixPaymentDebugger 
            paymentData={pixData ? {
              ...pixData,
              pedidoId: orderId,
              valorTotal: totalAmount
            } : null} 
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
