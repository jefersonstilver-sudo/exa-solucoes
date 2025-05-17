
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useUserSession();
  
  // Enviar webhook quando o componente é montado
  useEffect(() => {
    const sendWebhook = async () => {
      if (!pedidoId) return;
      
      try {
        // Buscar dados do pedido
        const { data: orderData } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();
          
        if (!orderData) return;
        
        // Buscar dados do plano (simulado, já que não temos uma tabela de planos)
        const planoNome = `Plano ${orderData.plano_meses} meses`;
        
        // Preparar payload do webhook
        const webhookPayload = {
          userId: user?.id,
          userEmail: user?.email,
          planoEscolhido: orderData.plano_meses,
          periodoDias: orderData.data_inicio && orderData.data_fim ? 
            Math.ceil((new Date(orderData.data_fim).getTime() - new Date(orderData.data_inicio).getTime()) / (1000 * 3600 * 24)) : 
            orderData.plano_meses * 30,
          planoNome: planoNome,
          valorTotal: orderData.valor_total,
          paymentId: paymentData.paymentId,
          timestamp: new Date().toISOString()
        };
        
        // Enviar webhook
        const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/ad8c7812-22a7-4334-a6ea-4de38f0abbe9', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });
        
        if (response.ok) {
          console.log("Webhook enviado com sucesso:", webhookPayload);
        } else {
          console.error("Erro ao enviar webhook:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Erro ao enviar webhook:", error);
      }
    };
    
    sendWebhook();
  }, [pedidoId, user]);
  
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
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Após realizar o pagamento, você será redirecionado automaticamente para a página de confirmação.</p>
        </div>
        
        {/* Debugger component - agora visível por padrão */}
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
