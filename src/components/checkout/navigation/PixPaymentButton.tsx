
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
      // Set loading state
      setIsLoading(true);
      
      // Enhanced logging
      console.log("[PixPaymentButton] Botão 'Pagar com PIX' clicado");
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Botão 'Pagar com PIX' clicado na página de checkout",
        { timestamp: new Date().toISOString(), totalPrice }
      );
      
      // Get user information
      if (!user) {
        toast.error("Usuário não autenticado");
        setIsLoading(false);
        return;
      }

      // Get cart items from localStorage
      const cartItemsStr = localStorage.getItem('indexa_cart');
      const cartItems = cartItemsStr ? JSON.parse(cartItemsStr) : [];

      // Get selected plan from localStorage
      const selectedPlan = localStorage.getItem('selectedPlan') || '1';
      
      // Calculate discount if using PIX (5% off)
      const pixDiscount = 0.05;
      const discountedTotal = totalPrice * (1 - pixDiscount);

      // Get user details
      const userInfo = await getUserInfo(user.id);
      
      if (!userInfo) {
        toast.error("Erro ao buscar dados do usuário");
        setIsLoading(false);
        return;
      }

      // Format cart items to match the expected structure
      const formattedPredios = cartItems.map((item: any) => ({
        id: item.panel?.id || '',
        nome: item.panel?.nome || item.panel?.buildings?.nome || 'Painel'
      }));

      console.log("[PixPaymentButton] Dados formatados para webhook:", {
        cartItems: formattedPredios,
        selectedPlan,
        discountedTotal
      });

      // Get current date and end date (30 days from now)
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 30);

      const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };

      // Prepare webhook data
      const webhookData: PixWebhookData = {
        cliente_id: user.id,
        email: userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: `${selectedPlan} ${parseInt(selectedPlan) === 1 ? 'mês' : 'meses'}`,
        predios_selecionados: formattedPredios,
        valor_total: discountedTotal.toFixed(2),
        periodo_exibicao: {
          inicio: formatDate(now),
          fim: formatDate(endDate)
        }
      };

      // Send webhook and get response with QR code data
      const response = await sendPixPaymentWebhook(webhookData);
      
      console.log("[PixPaymentButton] Resposta do webhook:", response);
      
      if (response.success) {
        // Store the PIX data and show the QR code dialog
        setPixData(response);
        setQrCodeDialogOpen(true);
      } else {
        toast.error("Erro ao processar pagamento PIX");
      }
    } catch (error) {
      console.error("[PixPaymentButton] Erro ao processar pagamento:", error);
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Erro ao processar PIX na página de checkout",
        { error: String(error) }
      );
      
      toast.error("Erro ao processar pagamento PIX");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button
        onClick={handlePayWithPix}
        disabled={isDisabled || isLoading || externalIsLoading}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-md"
      >
        {isLoading || externalIsLoading ? (
          <>
            <span className="mr-2">Processando...</span>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </>
        ) : (
          <>Pagar com PIX {totalPrice ? `R$ ${(totalPrice * 0.95).toFixed(2)}` : ''}</>
        )}
      </Button>

      {pixData && (
        <PixQrCodeDialog
          isOpen={qrCodeDialogOpen}
          onClose={() => {
            setQrCodeDialogOpen(false);
            // Call the original onClick after closing the dialog to continue with checkout process
            onClick();
          }}
          qrCodeBase64={pixData.qrCodeBase64}
          qrCodeText={pixData.qrCodeText}
          paymentLink={pixData.paymentLink}
        />
      )}
    </>
  );
};

export default PixPaymentButton;
