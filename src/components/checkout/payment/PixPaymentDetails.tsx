
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import QRCodeDisplay from './QRCodeDisplay';
import PixCodeCopyField from './PixCodeCopyField';
import PaymentStatusBadge from './PaymentStatusBadge';
import RefreshStatusButton from './RefreshStatusButton';
import { getUserInfo, sendPixPaymentWebhook } from '@/utils/paymentWebhooks';

interface PixPaymentDetailsProps {
  qrCodeBase64: string;
  qrCodeText: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
  userId?: string; // Add userId prop
}

const PixPaymentDetails = ({
  qrCodeBase64,
  qrCodeText,
  status,
  paymentId,
  onRefreshStatus,
  userId
}: PixPaymentDetailsProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Trigger webhook call for payment
  const handleTriggerPayment = async () => {
    try {
      if (!userId) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      setIsRefreshing(true);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Botão 'Pagar com PIX' clicado na página de detalhes do PIX",
        { 
          timestamp: new Date().toISOString(), 
          paymentId,
          hasQRCode: !!qrCodeText,
          userId
        }
      );
      
      // Get user information
      const userInfo = await getUserInfo(userId);
      
      if (!userInfo) {
        toast.error("Erro ao buscar dados do usuário");
        setIsRefreshing(false);
        return;
      }
      
      // Format data for webhook
      const webhookData = {
        cliente_id: userId,
        email: userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: "Conforme selecionado",
        predios_selecionados: [],
        valor_total: "0.00",
        periodo_exibicao: "Conforme selecionado"
      };
      
      // Send webhook
      const webhookSent = await sendPixPaymentWebhook(webhookData);
      
      if (webhookSent) {
        toast.success("Requisição de pagamento PIX enviada!");
        
        // Refresh payment status after webhook call
        await onRefreshStatus();
      } else {
        toast.error("Erro ao processar pagamento PIX");
      }
    } catch (error) {
      console.error("[PixPaymentDetails] Erro ao processar PIX:", error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle refresh status
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
      toast.success("Status atualizado");
    } catch (error) {
      console.error("[PixPaymentDetails] Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
        <p className="text-sm text-gray-500">
          Escaneie o QR code ou copie o código PIX para pagar
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <PaymentStatusBadge status={status} />
      </div>
      
      {qrCodeBase64 && (
        <div className="flex flex-col items-center">
          <QRCodeDisplay base64Image={qrCodeBase64} />
        </div>
      )}
      
      {qrCodeText && (
        <div className="mt-4">
          <PixCodeCopyField code={qrCodeText} />
        </div>
      )}
      
      {/* Refresh status button */}
      <RefreshStatusButton
        onClick={handleRefreshStatus}
        isRefreshing={isRefreshing}
        className="mt-4"
      />
      
      {/* Trigger payment webhook */}
      <div className="mt-6">
        <Button
          onClick={handleTriggerPayment}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processando PIX...
            </>
          ) : (
            <>Confirmar Pagamento PIX</>
          )}
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 text-center mt-4">
        <p>ID do Pagamento: {paymentId}</p>
      </div>
    </div>
  );
};

export default PixPaymentDetails;
