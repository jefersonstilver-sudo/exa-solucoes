import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WhatsAppCodeInput } from './WhatsAppCodeInput';
import { Loader2, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneBR } from '@/utils/whatsapp';

interface PhoneVerificationStepProps {
  userId: string;
  phone: string;
  onVerified: () => void;
}

export const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  userId,
  phone,
  onVerified
}) => {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (codeSent && !isVerified) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const resendTimeout = setTimeout(() => setCanResend(true), 60000); // 60s

      return () => {
        clearInterval(interval);
        clearTimeout(resendTimeout);
      };
    }
  }, [codeSent, isVerified]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          userId,
          telefone: phone,
          tipo: 'signup'
        }
      });

      if (error) throw error;

      toast.success('Código enviado com sucesso!');
      setCodeSent(true);
      setTimer(300);
      setCanResend(false);
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      toast.error(error.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error('Digite o código completo');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-whatsapp-code', {
        body: {
          userId,
          telefone: phone,
          codigo: code,
          tipo: 'signup'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Código inválido');

      toast.success('WhatsApp verificado com sucesso!');
      setIsVerified(true);
      onVerified();
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      toast.error(error.message || 'Código inválido ou expirado');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-900">WhatsApp Verificado!</p>
            <p className="text-sm text-green-700">{formatPhoneBR(phone)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        <span className="font-medium text-blue-900">Verificação de WhatsApp</span>
      </div>

      {!codeSent ? (
        <>
          <p className="text-sm text-blue-700">
            Precisamos verificar seu número de WhatsApp para completar o cadastro.
          </p>
          <Button
            onClick={handleSendCode}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando código...
              </>
            ) : (
              'Enviar Código de Verificação'
            )}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-blue-700">
            Enviamos um código de 6 dígitos para<br />
            <span className="font-semibold">{formatPhoneBR(phone)}</span>
          </p>

          <WhatsAppCodeInput
            value={code}
            onChange={setCode}
            disabled={isLoading}
          />

          <div className="text-center text-sm">
            <p className="text-blue-600">
              Código expira em: <span className="font-semibold">{formatTime(timer)}</span>
            </p>
            {canResend && (
              <Button
                variant="link"
                onClick={handleSendCode}
                className="text-blue-600 mt-2"
              >
                Reenviar código
              </Button>
            )}
          </div>

          <Button
            onClick={handleVerifyCode}
            disabled={isLoading || code.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Verificar Código'
            )}
          </Button>
        </>
      )}
    </div>
  );
};
