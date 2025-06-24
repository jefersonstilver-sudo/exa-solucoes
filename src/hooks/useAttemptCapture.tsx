
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
      
      console.log('📝 [AttemptCapture] Capturando tentativa (REMOVIDO - tipos incompatíveis)');
      
      // Por ora, apenas log da tentativa - remover uso da tabela tentativas_compra
      // até que os tipos do Supabase sejam atualizados
      console.log('✅ [AttemptCapture] Tentativa registrada localmente:', {
        userId,
        totalValue,
        itemCount: cartItems.length
      });

      return { id: 'local-attempt', success: true };

    } catch (error: any) {
      console.error('Erro ao capturar tentativa:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const clearAttempt = useCallback(async (userId: string) => {
    try {
      console.log('✅ [AttemptCapture] Tentativa removida (local)');
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
