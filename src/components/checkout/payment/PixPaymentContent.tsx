
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { toast } from 'sonner';

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
  // Function to send webhook when PIX payment is initiated
  const sendPaymentWebhook = useCallback(async () => {
    try {
      // Get user info from localStorage or session
      const userInfo = localStorage.getItem('userInfo');
      const user = userInfo ? JSON.parse(userInfo) : {};
      const userId = user.id || 'anonymous';
      const userEmail = user.email || 'no-email';
      
      // Get plan info from localStorage
      const selectedPlan = localStorage.getItem('selectedPlan');
      const planDuration = selectedPlan || '1'; // Default to 1 month if not available
      
      // Get total amount from paymentData or calculate
      const totalAmount = paymentData?.valorTotal || 0;
      const planName = `Plano ${planDuration} ${parseInt(planDuration) === 1 ? 'mês' : 'meses'}`;
      
      // Prepare webhook payload
      const webhookData = {
        userId,
        email: userEmail,
        planSelected: parseInt(planDuration),
        planPeriod: `${planDuration} ${parseInt(planDuration) === 1 ? 'mês' : 'meses'}`,
        planName,
        totalAmount,
        paymentMethod: 'pix',
        timestamp: new Date().toISOString(),
        pedidoId
      };
      
      console.log("Sending webhook with data:", webhookData);
      
      // Send webhook
      const response = await fetch('https://stilver.app.n8n.cloud/webhook-test/ad8c7812-22a7-4334-a6ea-4de38f0abbe9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });
      
      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }
      
      console.log("Webhook sent successfully:", await response.text());
      toast.success("Informações de pagamento enviadas com sucesso");
      
    } catch (error) {
      console.error("Error sending payment webhook:", error);
      toast.error("Erro ao enviar informações de pagamento");
    }
  }, [paymentData, pedidoId]);

  // Send webhook when component mounts
  React.useEffect(() => {
    if (paymentData && pedidoId) {
      sendPaymentWebhook();
    }
  }, [paymentData, pedidoId, sendPaymentWebhook]);

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
