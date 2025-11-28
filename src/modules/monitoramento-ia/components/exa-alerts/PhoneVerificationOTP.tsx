import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface PhoneVerificationOTPProps {
  telefone: string;
  directorId?: string;
  onVerified: () => void;
}

export const PhoneVerificationOTP = ({ telefone, directorId, onVerified }: PhoneVerificationOTPProps) => {
  const [step, setStep] = useState<'initial' | 'sent' | 'verifying' | 'verified' | 'error'>('initial');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === 'sent' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-exa-verification-code', {
        body: { telefone, directorId }
      });

      if (error) throw error;

      setStep('sent');
      setTimeLeft(300);
      toast({
        title: 'Código enviado!',
        description: `Código de verificação enviado para ${telefone}`,
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar código',
        description: 'Não foi possível enviar o código de verificação.',
      });
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    setStep('verifying');
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-exa-phone-code', {
        body: { telefone, codigo: code, directorId }
      });

      if (error) throw error;

      if (data?.verified) {
        setStep('verified');
        toast({
          title: 'Número verificado!',
          description: 'Número WhatsApp verificado com sucesso.',
        });
        setTimeout(() => onVerified(), 1500);
      } else {
        throw new Error('Código inválido');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        variant: 'destructive',
        title: 'Código inválido',
        description: 'O código informado está incorreto ou expirou.',
      });
      setStep('sent');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verified') {
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
        <span className="text-green-700 dark:text-green-300 font-medium">
          Número verificado com sucesso!
        </span>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
          <span className="text-red-700 dark:text-red-300 font-medium">
            Erro ao enviar código
          </span>
        </div>
        <Button onClick={() => setStep('initial')} variant="outline" className="w-full">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === 'initial' && (
        <Button 
          onClick={handleSendCode} 
          disabled={loading || !telefone}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              🔐 Enviar Código de Verificação
            </>
          )}
        </Button>
      )}

      {step === 'sent' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Digite o código de 6 dígitos enviado para:
            </p>
            <p className="font-medium">{telefone}</p>
          </div>

          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={code}
              onChange={setCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {timeLeft > 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              ⏱️ Código expira em: <span className="font-medium">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                Código expirado
              </p>
              <Button onClick={handleSendCode} variant="outline" size="sm">
                Reenviar código
              </Button>
            </div>
          )}

          <Button 
            onClick={handleVerifyCode}
            disabled={code.length !== 6 || loading || timeLeft === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              'Verificar Código'
            )}
          </Button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span>Verificando código...</span>
        </div>
      )}
    </div>
  );
};
