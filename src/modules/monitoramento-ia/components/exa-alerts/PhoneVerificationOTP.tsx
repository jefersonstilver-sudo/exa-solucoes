import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhoneVerificationOTPProps {
  telefone: string;
  directorId?: string;
  onVerified: () => void;
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export const PhoneVerificationOTP = ({ telefone, directorId, onVerified }: PhoneVerificationOTPProps) => {
  const [step, setStep] = useState<'initial' | 'sent' | 'verifying' | 'verified' | 'error'>('initial');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  const [buttonState, setButtonState] = useState<ButtonState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(0);

  useEffect(() => {
    if (step === 'sent' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (isBlocked && blockTime > 0) {
      const timer = setInterval(() => {
        setBlockTime((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (isBlocked) return;
    
    setButtonState('loading');
    try {
      const { data, error } = await supabase.functions.invoke('send-exa-verification-code', {
        body: { telefone, directorId }
      });

      if (error) {
        // Check if rate limited
        if (error.message?.includes('bloqueado') || error.message?.includes('tentativas')) {
          setIsBlocked(true);
          const match = error.message.match(/(\d+)\s+minuto/);
          if (match) {
            setBlockTime(parseInt(match[1]) * 60);
          } else {
            setBlockTime(300); // 5 minutes default
          }
          setErrorMessage(error.message);
          setButtonState('error');
          toast({
            variant: 'destructive',
            title: '⚠️ Muitas tentativas',
            description: error.message,
          });
          return;
        }
        throw error;
      }

      setButtonState('success');
      setStep('sent');
      setTimeLeft(300);
      
      setTimeout(() => {
        setButtonState('idle');
      }, 2000);
      
      toast({
        title: '✅ Código enviado!',
        description: `Código de verificação enviado para ${telefone}`,
      });
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      setButtonState('error');
      setErrorMessage(error.message || 'Não foi possível enviar o código');
      
      setTimeout(() => {
        setButtonState('idle');
        setStep('error');
      }, 2000);
      
      toast({
        variant: 'destructive',
        title: '❌ Erro ao enviar código',
        description: error.message || 'Não foi possível enviar o código de verificação.',
      });
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) return;

    setButtonState('loading');
    setStep('verifying');
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-exa-phone-code', {
        body: { telefone, codigo: code, directorId }
      });

      if (error) throw error;

      if (data?.verified) {
        setButtonState('success');
        setStep('verified');
        toast({
          title: '✅ Número verificado!',
          description: 'Número WhatsApp verificado com sucesso.',
        });
        setTimeout(() => onVerified(), 1500);
      } else {
        throw new Error('Código inválido');
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setButtonState('error');
      setErrorMessage('Código incorreto ou expirado');
      
      toast({
        variant: 'destructive',
        title: '❌ Código inválido',
        description: 'O código informado está incorreto ou expirou.',
      });
      
      setTimeout(() => {
        setButtonState('idle');
        setStep('sent');
        setCode('');
      }, 1500);
    }
  };

  // Verified State
  if (step === 'verified') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl border-2 border-green-200 dark:border-green-800"
      >
        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
        <span className="text-green-700 dark:text-green-300 font-semibold text-lg">
          Número verificado com sucesso!
        </span>
      </motion.div>
    );
  }

  // Error State
  if (step === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="flex items-start p-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-red-700 dark:text-red-300 font-semibold block">
              Erro ao enviar código
            </span>
            <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">
              {errorMessage || 'Tente novamente'}
            </span>
          </div>
        </div>
        <Button 
          onClick={() => {
            setStep('initial');
            setErrorMessage('');
          }} 
          variant="outline" 
          className="w-full"
        >
          Tentar novamente
        </Button>
      </motion.div>
    );
  }

  const getButtonContent = () => {
    switch (buttonState) {
      case 'loading':
        return (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {step === 'initial' ? 'Enviando...' : 'Verificando...'}
          </div>
        );
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Sucesso!
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            animate={{ x: [-10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Erro
          </motion.div>
        );
      default:
        return step === 'initial' ? (
          <>
            🔐 Enviar Código de Verificação
          </>
        ) : (
          'Verificar Código'
        );
    }
  };

  const getButtonClassName = () => {
    const base = "w-full transition-all duration-300 font-semibold rounded-xl h-12";
    switch (buttonState) {
      case 'success':
        return `${base} bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white`;
      case 'error':
        return `${base} bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white`;
      default:
        return `${base} bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700`;
    }
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {isBlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border-2 border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  ⚠️ Muitas tentativas detectadas
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Aguarde {formatTime(blockTime)} para tentar novamente
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 'initial' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="font-bold text-lg mb-1">Verificação de Segurança</h3>
            <p className="text-sm text-muted-foreground">
              Confirme seu número WhatsApp
            </p>
          </div>
          
          <Button 
            onClick={handleSendCode} 
            disabled={buttonState === 'loading' || !telefone || isBlocked}
            className={getButtonClassName()}
          >
            {getButtonContent()}
          </Button>
        </motion.div>
      )}

      {(step === 'sent' || step === 'verifying') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 backdrop-blur-xl rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-800 shadow-lg space-y-5"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Digite o código de 6 dígitos enviado para:
            </p>
            <p className="font-bold text-lg">{telefone}</p>
          </div>

          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={code}
              onChange={setCode}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-12 h-14 text-xl font-bold rounded-xl border-2 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          {timeLeft > 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              ⏱️ Código expira em: <span className="font-bold text-blue-600 dark:text-blue-400">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                ⚠️ Código expirado
              </p>
              <Button onClick={handleSendCode} variant="outline" size="sm" className="rounded-lg">
                Reenviar código
              </Button>
            </div>
          )}

          <Button 
            onClick={handleVerifyCode}
            disabled={code.length !== 6 || buttonState === 'loading' || timeLeft === 0}
            className={getButtonClassName()}
          >
            {getButtonContent()}
          </Button>
        </motion.div>
      )}
    </div>
  );
};