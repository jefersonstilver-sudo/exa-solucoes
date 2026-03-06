import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WhatsAppCodeInput } from './WhatsAppCodeInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, RefreshCw, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPhoneBR } from '@/utils/whatsapp';

interface PhoneVerificationInlineProps {
  phone: string;
  onVerified: (sessionId: string) => void;
  disabled?: boolean;
}

export const PhoneVerificationInline: React.FC<PhoneVerificationInlineProps> = ({
  phone,
  onVerified,
  disabled = false
}) => {
  const [verificationStarted, setVerificationStarted] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  // Reset state when phone number changes
  useEffect(() => {
    setVerificationStarted(false);
    setPhoneVerified(false);
    setCode('');
    setSessionId('');
    setTimer(300);
    setCanResend(false);
  }, [phone]);

  // Timer countdown
  useEffect(() => {
    if (!verificationStarted || phoneVerified || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [verificationStarted, phoneVerified, timer]);

  // Auto-verificar quando código completo
  useEffect(() => {
    if (code.length === 6 && !isVerifying) {
      handleVerifyCode();
    }
  }, [code]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskPhone = (phoneNumber: string) => {
    return formatPhoneBR(phoneNumber);
  };

  const handleStartVerification = async () => {
    if (disabled) return;
    
    setIsSending(true);
    const newSessionId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    try {
      const { data, error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          telefone: phone,
          tipo: 'signup',
          sessionId: newSessionId
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar código');

      setVerificationStarted(true);
      setTimer(300);
      setCanResend(false);
      
      toast({
        title: "Código enviado",
        description: `Enviamos um código de 6 dígitos para ${maskPhone(phone)}`
      });
    } catch (error: any) {
      console.error('[INLINE-VERIFY] Erro ao enviar código:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar código",
        description: error.message || "Tente novamente"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-whatsapp-code', {
        body: {
          telefone: phone,
          codigo: code,
          tipo: 'signup',
          sessionId: sessionId
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Código inválido');

      setPhoneVerified(true);
      onVerified(sessionId);
      
      toast({
        title: "WhatsApp verificado",
        description: "Número confirmado com sucesso"
      });
    } catch (error: any) {
      console.error('[INLINE-VERIFY] Erro ao verificar código:', error);
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: error.message || "Verifique e tente novamente"
      });
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setCode('');
    setCanResend(false);
    await handleStartVerification();
  };

  // Botão inicial
  if (!verificationStarted && !phoneVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2"
      >
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleStartVerification();
          }}
          disabled={isSending || disabled}
          className="w-full sm:w-auto h-10 bg-[#9C1E1E] hover:bg-[#B40D1A] text-white font-medium rounded-lg"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando código...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Verificar WhatsApp
            </>
          )}
        </Button>
        <p className="text-xs text-stone-400 mt-1.5">
          Enviaremos um código de verificação para este número
        </p>
      </motion.div>
    );
  }

  // Badge verificado
  if (phoneVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-2 p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-lg flex items-center gap-2.5"
      >
        <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-800">WhatsApp verificado</p>
          <p className="text-xs text-stone-500">{maskPhone(phone)}</p>
        </div>
      </motion.div>
    );
  }

  // Input de código
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3"
      >
        <div className="flex items-start gap-2.5">
          <Shield className="h-4.5 w-4.5 text-stone-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-800">Código enviado</p>
            <p className="text-xs text-stone-500">
              Digite o código de 6 dígitos enviado para <span className="font-medium text-stone-700">{maskPhone(phone)}</span>
            </p>
          </div>
        </div>

        <WhatsAppCodeInput
          value={code}
          onChange={setCode}
          disabled={isVerifying || phoneVerified}
        />

        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium flex items-center gap-1 ${timer < 60 ? 'text-[#C7141A]' : 'text-stone-500'}`}>
            <Clock className="h-3 w-3" />
            Expira em {formatTime(timer)}
          </span>
          {canResend && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleResendCode}
              disabled={isSending}
              className="text-[#9C1E1E] hover:text-[#B40D1A] h-auto p-0 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reenviar código
            </Button>
          )}
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-stone-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#9C1E1E]" />
            <span>Verificando...</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
