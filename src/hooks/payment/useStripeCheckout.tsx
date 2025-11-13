import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeCheckoutResult {
  url: string;
}

export const useStripeCheckout = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (pedidoId: string): Promise<StripeCheckoutResult> => {
    setIsCreating(true);
    setError(null);

    try {
      console.log('🔵 Creating Stripe checkout session for order:', pedidoId);

      // Call edge function to create checkout session
      const { data, error: functionError } = await supabase.functions.invoke(
        'stripe-create-checkout',
        {
          body: { pedidoId },
        }
      );

      if (functionError) {
        console.error('❌ Error creating checkout session:', functionError);
        throw new Error(functionError.message || 'Failed to create checkout session');
      }

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      console.log('✅ Checkout session created:', data.url);
      toast.success('Redirecionando para pagamento seguro...');

      return { url: data.url };

    } catch (err: any) {
      console.error('❌ Error in createCheckoutSession:', err);
      const errorMessage = err.message || 'Erro ao criar sessão de pagamento';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createCheckoutSession,
    isCreating,
    error,
  };
};
