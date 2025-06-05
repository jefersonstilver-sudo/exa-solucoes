
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEmailConfirmation = () => {
  const [isResending, setIsResending] = useState(false);

  const resendConfirmationEmail = async (email: string) => {
    try {
      setIsResending(true);
      console.log('🔄 Reenviando email de confirmação para:', email);
      
      const { data, error } = await supabase.functions.invoke('resend-confirmation-email', {
        body: { email }
      });
      
      if (error) {
        console.error('❌ Erro na function:', error);
        throw error;
      }
      
      if (data?.success) {
        toast.success(`Email de confirmação enviado para ${email}`);
        return { success: true, data };
      } else {
        throw new Error(data?.message || 'Erro desconhecido ao reenviar email');
      }
      
    } catch (error: any) {
      console.error('💥 Erro ao reenviar email:', error);
      toast.error(`Erro ao reenviar email: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsResending(false);
    }
  };

  return {
    resendConfirmationEmail,
    isResending
  };
};
