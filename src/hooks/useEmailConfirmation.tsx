
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEmailConfirmation = () => {
  const [isResending, setIsResending] = useState(false);

  const resendConfirmationEmail = async (email: string) => {
    if (!email) {
      toast.error('Email é obrigatório');
      return { success: false, error: 'Email é obrigatório' };
    }

    try {
      setIsResending(true);
      console.log('🔄 [HOOK] Reenviando email via função unificada para:', email);
      
      const { data, error } = await supabase.functions.invoke('unified-email-service', {
        body: { 
          action: 'resend',
          email 
        }
      });
      
      if (error) {
        console.error('❌ [HOOK] Erro na função unificada:', error);
        throw error;
      }
      
      if (data?.success) {
        console.log('✅ [HOOK] Email reenviado com sucesso via função unificada');
        toast.success(`Email de confirmação enviado para ${email}`);
        return { success: true, data };
      } else {
        throw new Error(data?.message || data?.error || 'Erro desconhecido ao reenviar email');
      }
      
    } catch (error: any) {
      console.error('💥 [HOOK] Erro ao reenviar email:', error);
      
      let errorMessage = 'Erro ao reenviar email';
      
      if (error.message?.includes('RESEND_API_KEY')) {
        errorMessage = 'Serviço de email não configurado';
      } else if (error.message?.includes('rate limit') || error.message?.includes('Muitas tentativas')) {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Erro ao reenviar email: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setIsResending(false);
    }
  };

  return {
    resendConfirmationEmail,
    isResending
  };
};
