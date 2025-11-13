import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CardData {
  token: string;
  payment_method_id: string;
  installments: number;
  document_type?: string;
  document_number?: string;
}

interface UseCardPaymentResult {
  processCardPayment: (pedidoId: string, cardData: CardData) => Promise<{
    success: boolean;
    paymentId?: string;
    status?: string;
    approved?: boolean;
    error?: string;
  }>;
  isProcessing: boolean;
  error: string | null;
}

export const useCardPayment = (): UseCardPaymentResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCardPayment = async (pedidoId: string, cardData: CardData) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('💳 [CARD-PAYMENT] Processando pagamento com cartão (TESTE)...', { pedidoId });

      // Call edge function to process card payment
      const { data, error: functionError } = await supabase.functions.invoke(
        'process-card-payment',
        {
          body: { pedidoId, cardData },
        }
      );

      if (functionError) {
        console.error('❌ [CARD-PAYMENT] Erro na function:', functionError);
        throw new Error(functionError.message || 'Erro ao processar pagamento com cartão');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao processar pagamento com cartão');
      }

      console.log('✅ [CARD-PAYMENT] Pagamento processado:', data);

      const { paymentId, status, approved } = data;

      if (approved) {
        toast.success('Pagamento aprovado com sucesso!');
      } else {
        toast.warning(`Pagamento ${status}. Aguarde confirmação.`);
      }

      return {
        success: true,
        paymentId,
        status,
        approved,
      };

    } catch (err: any) {
      console.error('❌ [CARD-PAYMENT] Erro:', err);
      const errorMessage = err.message || 'Erro ao processar pagamento com cartão';
      setError(errorMessage);
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processCardPayment,
    isProcessing,
    error,
  };
};
