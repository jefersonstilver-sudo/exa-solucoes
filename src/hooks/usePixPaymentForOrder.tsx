
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePixPaymentForOrder = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCodeBase64?: string;
    qrCodeText?: string;
    paymentLink?: string;
    pix_url?: string;
    pix_base64?: string;
  } | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const generatePixForOrder = async (orderId: string) => {
    setIsProcessing(true);
    setCurrentOrderId(orderId);
    
    try {
      // Buscar dados do pedido
      const { data: order, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .eq('status', 'pendente')
        .single();

      if (error || !order) {
        throw new Error('Pedido não encontrado ou não está pendente');
      }

      // Buscar dados do usuário separadamente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', order.client_id)
        .single();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
      }

      // Buscar dados dos prédios
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, nome')
        .in('id', order.lista_predios || []);

      if (buildingsError) {
        console.error('Erro ao buscar prédios:', buildingsError);
      }

      // Preparar dados para webhook PIX
      const webhookData = {
        cliente_id: order.client_id,
        pedido_id: order.id,
        transaction_id: order.transaction_id || '',
        email: userData?.email || '',
        nome: userData?.email?.split('@')[0] || 'Cliente',
        plano_escolhido: `${order.plano_meses} ${order.plano_meses === 1 ? 'mês' : 'meses'}`,
        periodo_meses: order.plano_meses,
        predios_selecionados: (buildings || []).map(building => ({
          id: String(building.id),
          nome: building.nome || 'Prédio'
        })),
        valor_total: String(order.valor_total),
        periodo_exibicao: {
          inicio: order.data_inicio || new Date().toISOString().split('T')[0],
          fim: order.data_fim || new Date().toISOString().split('T')[0]
        }
      };

      // Enviar para webhook PIX
      const pixResult = await sendPixPaymentWebhook(webhookData);

      if (!pixResult.success) {
        throw new Error(pixResult.error || "Erro ao processar PIX");
      }

      // Armazenar dados PIX
      setPixData(pixResult);
      setIsOpen(true);

      return true;

    } catch (error: any) {
      toast.error(`Erro ao gerar PIX: ${error.message}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentConfirmed = () => {
    setIsOpen(false);
    setPixData(null);
    setCurrentOrderId(null);
    toast.success("Redirecionando para seus pedidos...");
    navigate('/anunciante/pedidos');
  };

  const closePixDialog = () => {
    setIsOpen(false);
    setPixData(null);
    setCurrentOrderId(null);
  };

  return {
    isOpen,
    isProcessing,
    pixData,
    currentOrderId,
    generatePixForOrder,
    handlePaymentConfirmed,
    closePixDialog
  };
};
