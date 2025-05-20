
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TestTube } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
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
  
  // Test payment handler
  const handleTestPayment = async () => {
    toast.success("Modo de pagamento de teste ativado");
    
    try {
      // Buscar dados do pedido
      if (!pedidoId) return;
      
      const { data: orderData } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
          
      if (!orderData) return;
      
      // Preparar payload do webhook
      const webhookPayload = {
        userId: user?.id,
        fullName: user?.name || 'Não fornecido',
        userEmail: user?.email,
        valorCompra: orderData.valor_total || 0,
        paineisSelecionados: orderData.lista_paineis || [],
        timestamp: new Date().toISOString(),
        testMode: true
      };
      
      console.log("Sending test payment webhook:", webhookPayload);
      
      // Enviar webhook
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
          navigate(`/pedido-confirmado?id=${pedidoId}`);
        }, 1500);
      } else {
        console.error("Error sending test webhook:", response.status);
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
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Após realizar o pagamento, você será redirecionado automaticamente para a página de confirmação.
          </p>
          
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
