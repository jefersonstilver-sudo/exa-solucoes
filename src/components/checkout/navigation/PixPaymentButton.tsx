
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { sendPixPaymentWebhook, getUserInfo, PixWebhookData, PixWebhookResponse } from '@/utils/paymentWebhooks';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';

interface PixPaymentButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  totalPrice: number;
}

const PixPaymentButton = ({ 
  onClick, 
  isDisabled, 
  isLoading: externalIsLoading,
  totalPrice 
}: PixPaymentButtonProps) => {
  const { user } = useUserSession();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<PixWebhookResponse | null>(null);
  
  const handlePayWithPix = async () => {
    try {
      setIsLoading(true);
      
      console.log("🎯 [PixPaymentButton] SISTEMA ORIGINAL RESTAURADO - Iniciando PIX");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Botão PIX clicado - sistema original restaurado",
        { totalPrice, timestamp: new Date().toISOString() }
      );
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Buscar dados do usuário
      const userInfo = await getUserInfo(user.id);
      
      if (!userInfo) {
        toast.error("Erro ao buscar dados do usuário");
        return;
      }

      // Buscar itens do carrinho
      const cartItemsStr = localStorage.getItem('indexa_unified_cart');
      const cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];
      
      if (cartItems.length === 0) {
        toast.error("Carrinho vazio");
        return;
      }

      // Plano selecionado
      const selectedPlan = localStorage.getItem('selectedPlan') || '1';
      
      // Calcular desconto PIX (5% off)
      const discountedTotal = totalPrice * 0.95;

      // Formatar prédios para o webhook
      const formattedPredios = cartItems.map((item: any) => ({
        id: item.panel?.id || '',
        nome: item.panel?.buildings?.nome || 'Painel'
      }));

      // Datas do período
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 30);

      const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      // Dados para o webhook N8N
      const webhookData: PixWebhookData = {
        cliente_id: user.id,
        email: userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: `${selectedPlan} ${parseInt(selectedPlan) === 1 ? 'mês' : 'meses'}`,
        periodo_meses: parseInt(selectedPlan),
        predios_selecionados: formattedPredios,
        valor_total: discountedTotal.toFixed(2),
        periodo_exibicao: {
          inicio: formatDate(now),
          fim: formatDate(endDate)
        }
      };

      console.log("📡 [PixPaymentButton] Enviando para webhook N8N:", webhookData);

      // SISTEMA ORIGINAL: Chamar apenas o webhook N8N real
      const response = await sendPixPaymentWebhook(webhookData);
      
      console.log("✅ [PixPaymentButton] Resposta do webhook N8N:", response);
      
      if (response.success && (response.qrCodeBase64 || response.pix_base64)) {
        // Armazenar dados PIX e abrir popup
        setPixData(response);
        setQrCodeDialogOpen(true);
        
        toast.success("QR Code PIX gerado com sucesso!");
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_EVENT,
          LogLevel.SUCCESS,
          "QR Code PIX gerado com sucesso via webhook N8N",
          { hasQrCode: !!(response.qrCodeBase64 || response.pix_base64) }
        );
      } else {
        throw new Error(response.error || "Erro ao gerar QR Code PIX");
      }
      
    } catch (error: any) {
      console.error("❌ [PixPaymentButton] Erro:", error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro ao processar PIX via webhook N8N",
        { error: error.message }
      );
      
      toast.error(`Erro ao processar pagamento PIX: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        onClick={handlePayWithPix}
        disabled={isDisabled || isLoading || externalIsLoading}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        {isLoading || externalIsLoading ? (
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Gerando QR Code PIX...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>💳 Pagar com PIX</span>
            <span className="bg-emerald-600 px-2 py-1 rounded text-sm">
              R$ {(totalPrice * 0.95).toFixed(2)}
            </span>
            <span className="text-emerald-200 text-sm">(5% desconto)</span>
          </div>
        )}
      </Button>

      {/* Popup do QR Code PIX */}
      {pixData && (
        <PixQrCodeDialog
          isOpen={qrCodeDialogOpen}
          onClose={() => {
            setQrCodeDialogOpen(false);
            // Chamar onClick após fechar o popup para continuar fluxo
            onClick();
          }}
          qrCodeBase64={pixData.qrCodeBase64}
          qrCodeText={pixData.qrCodeText}
          paymentLink={pixData.paymentLink}
          pix_url={pixData.pix_url}
          pix_base64={pixData.pix_base64}
        />
      )}
    </>
  );
};

export default PixPaymentButton;
