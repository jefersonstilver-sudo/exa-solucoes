
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface AttemptData {
  id_user: string;
  predios_selecionados: number[];
  valor_total: number;
  credencial?: string;
  predio?: string;
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
      
      // Preparar dados da tentativa
      const attemptData: AttemptData = {
        id_user: userId,
        predios_selecionados: cartItems.map(item => parseInt(item.panel.id)),
        valor_total: totalValue,
        credencial: 'checkout_web',
        predio: cartItems.map(item => item.panel.building_id).join(',')
      };

      // Verificar se já existe uma tentativa recente do mesmo usuário
      const { data: existingAttemptData, error: selectError } = await supabase
        .from('tentativas_compra' as any)
        .select('id')
        .eq('id_user', userId)
        .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // últimos 30 minutos
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing attempt:', selectError);
      }

      if (existingAttemptData && existingAttemptData.id) {
        // Atualizar tentativa existente
        const { data: updateData, error: updateError } = await supabase
          .from('tentativas_compra' as any)
          .update({
            predios_selecionados: attemptData.predios_selecionados,
            valor_total: attemptData.valor_total,
            predio: attemptData.predio
          })
          .eq('id', existingAttemptData.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updateData;
      } else {
        // Criar nova tentativa
        const { data: insertData, error: insertError } = await supabase
          .from('tentativas_compra' as any)
          .insert(attemptData)
          .select()
          .single();

        if (insertError) throw insertError;
        console.log('✅ Tentativa de compra capturada:', insertData?.id);
        return insertData;
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
        .from('tentativas_compra' as any)
        .delete()
        .eq('id_user', userId);
      
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
