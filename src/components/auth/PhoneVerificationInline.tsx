import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WhatsAppCodeInput } from './WhatsAppCodeInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, RefreshCw } from 'lucide-react';
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
  const [timer, setTimer] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

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
    const formatted = formatPhoneBR(phoneNumber);
    return formatted;
  };

  const handleStartVerification = async () => {
    console.log('🔵 [INLINE-VERIFY] Botão clicado!', { phone, disabled, isSending });
    
    if (disabled) {
      console.log('⚠️ [INLINE-VERIFY] Botão desabilitado - abortando');
      return;
    }
    
    setIsSending(true);
    const newSessionId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    try {
      console.log('📱 [INLINE-VERIFY] Enviando código para:', phone);
      
      const { data, error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          telefone: phone,
          tipo: 'signup',
          sessionId: newSessionId
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao enviar código');
      }

      setVerificationStarted(true);
      setTimer(300);
      setCanResend(false);
      
      toast({
        title: "Código enviado!",
        description: `Enviamos um código de 6 dígitos para ${maskPhone(phone)}`
      });
    } catch (error: any) {
      console.error('❌ [INLINE-VERIFY] Erro ao enviar código:', error);
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
      console.log('🔍 [INLINE-VERIFY] Verificando código...');
      
      const { data, error } = await supabase.functions.invoke('verify-user-whatsapp-code', {
        body: {
          telefone: phone,
          codigo: code,
          tipo: 'signup',
          sessionId: sessionId
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Código inválido');
      }

      setPhoneVerified(true);
      onVerified(sessionId);
      
      toast({
        title: "WhatsApp verificado!",
        description: "✓ Número confirmado com sucesso"
      });
    } catch (error: any) {
      console.error('❌ [INLINE-VERIFY] Erro ao verificar código:', error);
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

  // Log para debug
  console.log('🔍 [INLINE-VERIFY] Estado atual:', {
    phone,
    disabled,
    isSending,
    verificationStarted,
    phoneVerified
  });

  // Se ainda não começou a verificação, mostrar botão
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
            console.log('🟢 [INLINE-VERIFY] onClick disparado diretamente');
            handleStartVerification();
          }}
          disabled={isSending || disabled}
          className="w-full sm:w-auto h-10 bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando código...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verificar WhatsApp
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Clique para enviar um código de verificação
        </p>
      </motion.div>
    );
  }

  // Se verificado, mostrar badge verde
  if (phoneVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
      >
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">WhatsApp verificado</p>
          <p className="text-xs text-green-600">{maskPhone(phone)}</p>
        </div>
      </motion.div>
    );
  }

  // Mostrar input de código
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3"
      >
        <div className="flex items-start gap-2">
          <div className="text-2xl">📱</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Código enviado!</p>
            <p className="text-xs text-blue-700">
              Digite o código de 6 dígitos enviado para <strong>{maskPhone(phone)}</strong>
            </p>
          </div>
        </div>

        <WhatsAppCodeInput
          value={code}
          onChange={setCode}
          disabled={isVerifying || phoneVerified}
        />

        <div className="flex items-center justify-between text-xs">
          <span className={`font-medium ${timer < 60 ? 'text-red-600' : 'text-blue-600'}`}>
            ⏱️ Expira em: {formatTime(timer)}
          </span>
          {canResend && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleResendCode}
              disabled={isSending}
              className="text-blue-600 h-auto p-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reenviar código
            </Button>
          )}
        </div>

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando...</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
