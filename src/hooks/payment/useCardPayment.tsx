import { useState } from 'react';
interface CardData { token: string; payment_method_id: string; installments: number; document_type?: string; document_number?: string }
export const useCardPayment = () => {
  const [error, setError] = useState<string | null>(null);
  const processCardPayment = async (_pedidoId: string, _cardData: CardData): Promise<{ success: boolean; paymentId?: string; status?: string; approved?: boolean; error?: string }> => {
    const message = 'Cartão indisponível. Utilize Pix Asaas.';
    setError(message);
    return { success: false, error: message };
  };
  return { processCardPayment, isProcessing: false, error };
};
