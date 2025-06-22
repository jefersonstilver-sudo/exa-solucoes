
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface AttemptData {
  client_id: string;
  lista_paineis: string[];
  valor_total: number;
  status: string;
  plano_meses: number;
  termos_aceitos: boolean;
  email?: string;
}

export const useAttemptCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureAttempt = useCallback(async (
    userId: string,
    cartItems: CartItem[],
    totalValue: number
  ) => {
    if (!userId || cartItems.length === 0) {
      return null;
    }

    try {
      setIsCapturing(true);
      
      // Preparar dados da tentativa como pedido com status 'tentativa'
      const attemptData: AttemptData = {
        client_id: userId,
        lista_paineis: cartItems.map(item => item.panel.id),
        valor_total: totalValue,
        status: 'tentativa',
        plano_meses: 1,
        termos_aceitos: false
      };

      // Verificar se já existe uma tentativa recente do mesmo usuário
      const { data: existingAttempt } = await supabase
        .from('pedidos')
        .select('id')
        .eq('client_id', userId)
        .eq('status', 'tentativa')
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // últimos 30 minutos
        .single();

      if (existingAttempt) {
        // Atualizar tentativa existente
        const { data, error } = await supabase
          .from('pedidos')
          .update({
            lista_paineis: attemptData.lista_paineis,
            valor_total: attemptData.valor_total
          })
          .eq('id', existingAttempt.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova tentativa
        const { data, error } = await supabase
          .from('pedidos')
          .insert(attemptData)
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Tentativa de compra capturada:', data.id);
        return data;
      }
    } catch (error: any) {
      console.error('Erro ao capturar tentativa:', error);
      // Não mostrar erro para o usuário, é uma funcionalidade de background
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const clearAttempt = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('pedidos')
        .delete()
        .eq('client_id', userId)
        .eq('status', 'tentativa');
      
      console.log('✅ Tentativa removida após conversão');
    } catch (error) {
      console.error('Erro ao limpar tentativa:', error);
    }
  }, []);

  return {
    captureAttempt,
    clearAttempt,
    isCapturing
  };
};
