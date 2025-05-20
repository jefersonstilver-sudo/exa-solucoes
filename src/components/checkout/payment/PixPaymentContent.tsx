
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { sendPixPaymentWebhook, getUserInfo } from '@/utils/paymentWebhooks';

interface PixPaymentContentProps {
  paymentData: PixPaymentData;
  onBack: () => void;
  onRefreshStatus: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  pedidoId: string | null;
}

const PixPaymentContent = ({ 
  paymentData, 
  onBack, 
  onRefreshStatus,
  isLoading = false,
  error = null,
  pedidoId
}: PixPaymentContentProps) => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const [processando, setProcessando] = useState(false);
  
  // Check authentication on mount
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      toast.error("Usuário não autenticado");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);

  // Function to handle the webhook call when paying with PIX
  const handlePayWithPix = async () => {
    try {
      // Verify user is authenticated
      if (!isLoggedIn || !user) {
        toast.error("Usuário não autenticado");
        navigate('/login?redirect=/checkout');
        return;
      }
      
      // Set processing state
      setProcessando(true);
      
      console.log("[PixPaymentContent] Botão 'Pagar com PIX' clicado na página de pagamento");
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Botão 'Pagar com PIX' clicado na página de pagamento PIX",
        { 
          timestamp: new Date().toISOString(), 
          pedidoId,
          paymentId: paymentData.paymentId,
          hasQRCode: !!paymentData.qrCode,
          userId: user.id
        }
      );
      
      // Get order details
      if (!pedidoId) {
        toast.error("ID do pedido não encontrado");
        setProcessando(false);
        return;
      }

      // Get the order details from Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select(`
          *,
          client_id
        `)
        .eq('id', pedidoId)
        .single();

      if (orderError) {
        console.error("[PixPaymentContent] Erro ao buscar detalhes do pedido:", orderError);
        toast.error("Erro ao processar pagamento");
        setProcessando(false);
        return;
      }

      if (!orderData) {
        toast.error("Pedido não encontrado");
        setProcessando(false);
        return;
      }

      // Verify this user is authorized for this order
      if (orderData.client_id !== user.id) {
        toast.error("Você não tem permissão para acessar este pedido");
        setProcessando(false);
        return;
      }

      // Get the list of buildings (panels) selected
      const selectedBuildings = Array.isArray(orderData.lista_paineis) 
        ? orderData.lista_paineis.map((painel: any) => ({
            id: painel.id || painel,
            nome: painel.nome || painel.buildings?.nome || 'Painel'
          }))
        : [];

      // Get the selected plan duration
      const selectedPlan = orderData.duracao || 30; // Default to 30 days if not set

      // Get client info
      const userInfo = await getUserInfo(orderData.client_id);
      
      if (!userInfo) {
        toast.error("Erro ao buscar dados do usuário");
        setProcessando(false);
        return;
      }

      console.log("[PixPaymentContent] Dados formatados para webhook:", {
        selectedBuildings,
        selectedPlan: Math.round(selectedPlan / 30),
        valor: paymentData.qrCode ? orderData.valor_total.toString() : '0.00',
        userId: user.id
      });

      // Prepare data for the webhook
      const webhookData = {
        cliente_id: orderData.client_id,
        email: userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: `${Math.round(selectedPlan / 30)} meses`, // Convert days to months
        predios_selecionados: selectedBuildings,
        valor_total: paymentData.qrCode ? orderData.valor_total.toString() : '0.00',
        periodo_exibicao: {
          inicio: orderData.data_inicio,
          fim: orderData.data_fim
        }
      };

      // Send webhook with enhanced logging
      const webhookSent = await sendPixPaymentWebhook(webhookData);
      
      console.log("[PixPaymentContent] Resultado do envio do webhook:", webhookSent);
      
      if (webhookSent) {
        toast.success("Pagamento em processamento!");
      }
      
      // Refresh payment status
      await onRefreshStatus();
    } catch (error) {
      console.error("[PixPaymentContent] Erro ao chamar webhook:", error);
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro ao processar PIX na página de pagamento PIX",
        { error: String(error), pedidoId }
      );
      
      toast.error("Erro ao processar pagamento");
    } finally {
      setProcessando(false);
    }
  };

  // Don't render content if user is not authenticated
  if (isSessionLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return null; // Will be redirected by the effect above
  }

  return (
    <ClientOnly>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para checkout
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Pagamento via PIX</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <PixPaymentDetails
            qrCodeBase64={paymentData.qrCodeBase64 || ''}
            qrCodeText={paymentData.qrCode || ''} 
            status={paymentData.status}
            paymentId={paymentData.paymentId || ''}
            onRefreshStatus={onRefreshStatus}
            userId={user?.id}
          />
          
          {/* Pay with PIX button - Now with improved visibility and logging */}
          <div className="mt-6">
            <Button
              onClick={handlePayWithPix}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-md flex items-center justify-center"
              data-testid="pay-with-pix-button"
              disabled={processando}
            >
              {processando ? (
                <>
                  <span className="mr-2">Processando...</span>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  <span className="mr-2">Pagar com PIX {paymentData.valorTotal ? `R$ ${(paymentData.valorTotal * 0.95).toFixed(2)}` : ''}</span>
                  <CheckCircle className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Após realizar o pagamento, você será redirecionado automaticamente para a página de confirmação.</p>
        </div>
        
        {/* Debugger component */}
        <PixPaymentDebugger 
          paymentData={paymentData}
          error={error}
          isLoading={isLoading}
          pedidoId={pedidoId}
          onRefresh={onRefreshStatus}
        />
      </div>
    </ClientOnly>
  );
};

export default PixPaymentContent;
