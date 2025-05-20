
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PLANS } from '@/constants/checkoutConstants';
import { Panel } from '@/types/panel';
import { sendPixPaymentWebhook, getUserInfo, PixWebhookData } from '@/utils/paymentWebhooks';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast } from 'sonner';

interface ClientInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  clientEmail?: string;
  totalPrice: number;
  panels: Array<{panel: Panel; duration: number}>;
}

const ClientInfoDialog = ({
  isOpen,
  onClose,
  clientId = "",
  clientEmail = "",
  totalPrice,
  panels
}: ClientInfoDialogProps) => {
  const [isSending, setIsSending] = useState(false);

  const handleSendWebhook = async () => {
    if (!clientId) {
      toast.error("ID do cliente não disponível");
      return;
    }

    setIsSending(true);
    
    try {
      // Get additional user information
      const userInfo = await getUserInfo(clientId);
      
      if (!userInfo) {
        throw new Error("Não foi possível obter informações do usuário");
      }

      // Format panels data for the webhook
      const selectedPanels = panels.map(item => ({
        id: item.panel.id,
        nome: item.panel.buildings?.nome || "Painel sem nome"
      }));

      // Format display period
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + 30); // Default to 30 days

      const formattedPeriod = {
        inicio: format(now, 'dd/MM/yyyy', { locale: ptBR }),
        fim: format(endDate, 'dd/MM/yyyy', { locale: ptBR })
      };

      // Create webhook payload
      const webhookData: PixWebhookData = {
        cliente_id: clientId,
        email: clientEmail || userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: "Mensal", // Default plan
        predios_selecionados: selectedPanels,
        valor_total: totalPrice.toFixed(2),
        periodo_exibicao: formattedPeriod
      };

      // Log webhook data before sending
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Enviando dados de teste para webhook`,
        { webhookData }
      );

      // Send data to webhook
      const success = await sendPixPaymentWebhook(webhookData);
      
      if (success) {
        toast.success("Dados enviados com sucesso!");
        onClose();
      } else {
        throw new Error("Falha ao enviar dados para o webhook");
      }
    } catch (error: any) {
      console.error("Erro ao enviar dados para webhook:", error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao enviar dados para webhook: ${error.message}`,
        { error: String(error) }
      );
      
      toast.error("Erro ao enviar dados: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Informações do Cliente</DialogTitle>
          <DialogDescription>
            Detalhes para processamento de pagamento
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">ID do Cliente</h3>
            <p className="text-sm text-gray-500 break-all bg-gray-50 p-2 rounded">{clientId || "Não disponível"}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Email</h3>
            <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">{clientEmail || "Não disponível"}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Valor Total</h3>
            <p className="text-sm font-semibold text-green-600 bg-gray-50 p-2 rounded">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Painéis Selecionados ({panels.length})</h3>
            <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
              {panels.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-gray-500">
                  {panels.map((item, index) => (
                    <li key={index}>
                      {item.panel.buildings?.nome || "Painel sem nome"} ({item.duration} dias)
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum painel selecionado</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Fechar
          </Button>
          <Button 
            onClick={handleSendWebhook} 
            className="bg-purple-600 hover:bg-purple-700"
            disabled={isSending}
          >
            {isSending ? 'Enviando...' : 'Enviar para Webhook'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientInfoDialog;
