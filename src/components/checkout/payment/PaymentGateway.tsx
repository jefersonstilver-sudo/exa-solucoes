
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
  userId: propUserId
}: PaymentGatewayProps) => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  const [paymentMethod, setPaymentMethod] = useState<string>(
    localStorage.getItem('preferred_payment_method') || 'credit_card'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Use user from session if propUserId is not provided
  const userId = propUserId || user?.id;
  
  // Log de montagem do componente
  useEffect(() => {
    console.log('PaymentGateway mounted with:', {
      orderId,
      userId,
      isLoggedIn,
      user: user ? { id: user.id, email: user.email } : null
    });
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `PaymentGateway inicializado`,
      { 
        orderId, 
        paymentMethod,
        hasPix: !!pixData,
        hasPreference: !!preferenceId,
        hasUserId: !!userId,
        isLoggedIn,
        userEmail: user?.email
      }
    );
    
    // Verificar autenticação no mount
    if (!isLoggedIn || !user) {
      console.error('PaymentGateway: Usuário não autenticado');
      toast.error("Você precisa estar logado para acessar o pagamento");
      navigate('/login?redirect=/checkout');
      return;
    }
    
    // Salva preferência de método de pagamento
    localStorage.setItem('preferred_payment_method', paymentMethod);
  }, [orderId, paymentMethod, pixData, preferenceId, userId, isLoggedIn, user, navigate]);
  
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
    console.log('handleProceedPayment called:', {
      paymentMethod,
      isLoggedIn,
      userId,
      user: user ? { id: user.id, email: user.email } : null
    });
    
    setIsLoading(true);
    
    // Validate user authentication first
    if (!isLoggedIn || !user || !userId) {
      console.error('handleProceedPayment: Usuário não autenticado', {
        isLoggedIn,
        hasUser: !!user,
        hasUserId: !!userId
      });
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
        console.log('Processing PIX payment for user:', userId);
        
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
        
        // Prepare webhook data
        const webhookData = {
          cliente_id: userId,
          email: userInfo.email,
          nome: userInfo.nome,
          plano_escolhido: "Mensal",
          predios_selecionados: formattedPredios,
          valor_total: totalAmount.toFixed(2),
          periodo_exibicao: {
            inicio: new Date().toLocaleDateString('pt-BR'),
            fim: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('pt-BR')
          }
        };
        
        console.log('Sending PIX webhook with data:', webhookData);
        
        // Send webhook and handle response
        const response = await sendPixPaymentWebhook(webhookData);
        
        if (response.success) {
          // Show success and navigate to PIX payment page
          toast.success("PIX gerado com sucesso!");
          navigate(`/pix-payment?pedido=${orderId}`);
        } else {
          toast.error("Erro ao gerar PIX");
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
  
  // Don't render if user is not authenticated
  if (!isLoggedIn || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => navigate('/login?redirect=/checkout')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }
  
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
                pedidoId={orderId}
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
