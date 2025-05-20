
import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { sendPixPaymentWebhook, getUserInfo } from '@/utils/paymentWebhooks';

interface PixPaymentButtonProps {
  onClick: () => void;
  isDisabled: boolean;
  isLoading: boolean;
  totalPrice: number;
}

const PixPaymentButton = ({ 
  onClick, 
  isDisabled, 
  isLoading,
  totalPrice 
}: PixPaymentButtonProps) => {
  const { user } = useUserSession();
  
  const handlePayWithPix = async () => {
    try {
      // Get user information
      if (!user) {
        toast.error("Usuário não autenticado");
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
        return;
      }

      // Format cart items to match the expected structure
      const formattedPredios = cartItems.map((item: any) => ({
        id: item.panel?.id || '',
        nome: item.panel?.nome || item.panel?.buildings?.nome || 'Painel'
      }));

      // Prepare webhook data
      const webhookData = {
        cliente_id: user.id,
        email: userInfo.email,
        nome: userInfo.nome,
        plano_escolhido: `${selectedPlan} ${parseInt(selectedPlan) === 1 ? 'mês' : 'meses'}`,
        predios_selecionados: formattedPredios,
        valor_total: discountedTotal.toFixed(2),
        periodo_exibicao: 'Conforme selecionado no checkout'
      };

      // Send webhook and continue
      await sendPixPaymentWebhook(webhookData);
      
      // Continue with payment flow
      onClick();
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      // Continue with payment even if webhook fails
      onClick();
    }
  };
  
  return (
    <Button
      onClick={handlePayWithPix}
      disabled={isDisabled || isLoading}
      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-md"
    >
      {isLoading ? (
        <>
          <span className="mr-2">Processando...</span>
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </>
      ) : (
        <>Pagar com PIX {totalPrice ? `R$ ${(totalPrice * 0.95).toFixed(2)}` : ''}</>
      )}
    </Button>
  );
};

export default PixPaymentButton;
