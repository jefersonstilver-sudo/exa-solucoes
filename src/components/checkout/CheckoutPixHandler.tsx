
import React from 'react';
import { toast } from 'sonner';

interface CheckoutPixHandlerProps {
  user: any;
  totalAmount: number;
  setIsProcessingPayment: (processing: boolean) => void;
  setPixData: (data: any) => void;
  setShowPixDialog: (show: boolean) => void;
}

export const useCheckoutPixHandler = ({
  user,
  totalAmount,
  setIsProcessingPayment,
  setPixData,
  setShowPixDialog
}: CheckoutPixHandlerProps) => {
  
  const sendPixWebhook = async () => {
    if (!user) {
      toast.error("Dados do usuário não encontrados");
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      // Get selected plan from localStorage or default
      const selectedPlan = localStorage.getItem('selectedPlan') || '1';
      const planNames = {
        '1': '1 mês',
        '3': '3 meses', 
        '6': '6 meses',
        '12': '12 meses'
      };

      // Get cart items (prédios/painéis escolhidos)
      const cartItems = JSON.parse(localStorage.getItem('panelCart') || '[]');
      const prediosEscolhidos = cartItems.map((item: any) => ({
        painel_id: item.panel?.id || '',
        painel_codigo: item.panel?.code || '',
        predio_nome: item.panel?.buildings?.nome || '',
        predio_endereco: item.panel?.buildings?.endereco || '',
        predio_bairro: item.panel?.buildings?.bairro || '',
        predio_cidade: item.panel?.buildings?.cidade || '',
        duracao_dias: item.duration || 30,
        preco: item.panel?.buildings?.basePrice || item.price || 250
      }));

      const webhookData = {
        usuario_id: user.id,
        nome_usuario: user.email?.split('@')[0] || 'Cliente',
        email_usuario: user.email || '',
        plano_escolhido: planNames[selectedPlan as keyof typeof planNames] || '1 mês',
        periodo_meses: parseInt(selectedPlan),
        valor_total: (totalAmount * 0.95).toFixed(2), // 5% discount for PIX
        predios_escolhidos: prediosEscolhidos,
        quantidade_paineis: prediosEscolhidos.length
      };

      console.log('[PIX Webhook] Enviando dados:', webhookData);

      const response = await fetch('https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('[PIX Webhook] Resposta recebida:', responseData);
        
        // Verificar se recebemos pix_url e pix_base64
        if (responseData.pix_url && responseData.pix_base64) {
          setPixData({
            pix_url: responseData.pix_url,
            pix_base64: responseData.pix_base64
          });
          setShowPixDialog(true);
          toast.success("QR Code PIX gerado com sucesso!");
        } else {
          console.warn('[PIX Webhook] Resposta sem dados PIX esperados:', responseData);
          toast.success("Dados enviados com sucesso! Processando pagamento PIX...");
          
          setTimeout(() => {
            toast.info("Em breve você será redirecionado para o PIX");
          }, 1500);
        }
      } else {
        throw new Error(`Erro no webhook: ${response.status}`);
      }
    } catch (error) {
      console.error('[PIX Webhook] Erro ao enviar webhook:', error);
      toast.error("Erro ao processar pagamento PIX. Tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return { sendPixWebhook };
};
