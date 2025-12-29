import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, Shield, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Login2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  phoneNumber: string;
  userEmail: string;
}

export const Login2FAModal: React.FC<Login2FAModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  phoneNumber,
  userEmail
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'error' | null>(null);

  // Enviar código ao abrir o modal
  useEffect(() => {
    if (isOpen && !codeSent) {
      sendCode();
    }
  }, [isOpen]);

  // Timer de expiração do código
  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timer]);

  // Timer de reenvio
  useEffect(() => {
    if (!isOpen || canResend) return;
    
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, resendTimer, canResend]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendCode = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-exa-verification-code', {
        body: {
          phone: `55${phoneNumber}`,
          purpose: 'login_2fa',
          email: userEmail
        }
      });

      if (error) throw error;

      setCodeSent(true);
      setTimer(300);
      setResendTimer(60);
      setCanResend(false);
      toast.success('Código enviado via WhatsApp!');
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      toast.error('Erro ao enviar código de verificação');
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCode('');
    setVerificationResult(null);
    await sendCode();
  };

  const verifyCode = async () => {
    if (code.length !== 4) return;

    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-exa-phone-code', {
        body: {
          phone: `55${phoneNumber}`,
          code: code,
          purpose: 'login_2fa'
        }
      });

      if (error) throw error;

      if (data?.verified) {
        setVerificationResult('success');
        toast.success('Verificação concluída!');
        setTimeout(() => {
          onVerified();
        }, 500);
      } else {
        setVerificationResult('error');
        toast.error('Código inválido');
        setCode('');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      setVerificationResult('error');
      toast.error('Erro ao verificar código');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verificar quando código completo
  useEffect(() => {
    if (code.length === 4 && !isVerifying) {
      verifyCode();
    }
  }, [code]);

  const maskedPhone = phoneNumber 
    ? `(**) *****-${phoneNumber.slice(-4)}`
    : '***';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificação em Duas Etapas
          </DialogTitle>
          <DialogDescription>
            Digite o código de 4 dígitos enviado para o WhatsApp {maskedPhone}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status de envio */}
          {isSending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando código...
            </div>
          )}

          {/* Input OTP */}
          {codeSent && !isSending && (
            <div className="flex flex-col items-center gap-6">
              <InputOTP
                maxLength={4}
                value={code}
                onChange={setCode}
                disabled={isVerifying || verificationResult === 'success'}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
                  <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
                  <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
                  <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
                </InputOTPGroup>
              </InputOTP>

              {/* Resultado da verificação */}
              {verificationResult === 'success' && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Código verificado!
                </div>
              )}

              {verificationResult === 'error' && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Código inválido, tente novamente
                </div>
              )}

              {isVerifying && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </div>
              )}

              {/* Timer de expiração */}
              {timer > 0 && verificationResult !== 'success' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Código expira em {formatTime(timer)}
                </div>
              )}

              {timer <= 0 && (
                <div className="text-sm text-destructive">
                  Código expirado. Solicite um novo código.
                </div>
              )}
            </div>
          )}

          {/* Botão de reenvio */}
          <div className="flex flex-col items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={!canResend || isSending || verificationResult === 'success'}
              className="text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {canResend 
                ? 'Reenviar código' 
                : `Reenviar em ${resendTimer}s`
              }
            </Button>
          </div>

          {/* Botão cancelar */}
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
            disabled={verificationResult === 'success'}
          >
            Cancelar Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
