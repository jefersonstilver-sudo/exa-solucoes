
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
  // Function to handle the webhook call when paying with PIX
  const handlePayWithPix = async () => {
    try {
      // Get order details
      if (!pedidoId) {
        toast.error("ID do pedido não encontrado");
        return;
      }

      // Get the order details from Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select(`
          *,
          clientes:client_id (id, email, nome)
        `)
        .eq('id', pedidoId)
        .single();

      if (orderError) {
        console.error("Erro ao buscar detalhes do pedido:", orderError);
        toast.error("Erro ao processar pagamento");
        return;
      }

      if (!orderData) {
        toast.error("Pedido não encontrado");
        return;
      }

      // Get the list of buildings (panels) selected
      const selectedBuildings = Array.isArray(orderData.lista_paineis) 
        ? orderData.lista_paineis 
        : [];

      // Get the selected plan duration
      const selectedPlan = orderData.duracao || 30; // Default to 30 days if not set

      // Get client info
      const clientInfo = orderData.clientes || {};

      // Prepare data for the webhook
      const webhookData = {
        cliente_id: orderData.client_id,
        email: clientInfo.email,
        nome: clientInfo.nome,
        plano_escolhido: `${Math.round(selectedPlan / 30)} meses`, // Convert days to months
        predios_selecionados: selectedBuildings,
        valor_total: paymentData.status === 'pending' ? orderData.valor_total : 0,
        periodo_exibicao: {
          inicio: orderData.data_inicio,
          fim: orderData.data_fim
        }
      };

      // Send data to webhook
      const webhookUrl = "https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19";
      
      console.log("Enviando dados para webhook:", webhookData);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
        mode: 'no-cors' // Important for cross-origin webhook calls
      });

      // Log the webhook call
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Webhook chamado para PIX payment`,
        { pedidoId, webhookData }
      );

      toast.success("Pagamento em processamento!");
      
      // Refresh payment status
      await onRefreshStatus();
    } catch (error) {
      console.error("Erro ao chamar webhook:", error);
      toast.error("Erro ao processar pagamento");
    }
  };

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
            qrCodeBase64={paymentData.qrCodeBase64}
            qrCodeText={paymentData.qrCode}
            status={paymentData.status}
            paymentId={paymentData.paymentId}
            onRefreshStatus={onRefreshStatus}
          />
          
          {/* Pay with PIX button */}
          <div className="mt-6">
            <Button
              onClick={handlePayWithPix}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-md flex items-center justify-center"
            >
              <span className="mr-2">Pagar com PIX {paymentData.qrCode ? `R$ ${(parseFloat(paymentData.amount || '0') || 0).toFixed(2)}` : ''}</span>
              <CheckCircle className="h-5 w-5" />
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
