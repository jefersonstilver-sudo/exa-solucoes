import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/ui/phone-input';
import { WhatsAppCodeInput } from '@/components/auth/WhatsAppCodeInput';
import { Loader2, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneBR } from '@/utils/whatsapp';

interface WhatsAppVerificationModalProps {
  open: boolean;
  onClose: () => void;
  currentPhone: string;
  userId: string;
  onSuccess: (newPhone: string) => void;
}

type Step = 1 | 2 | 3 | 4;

export const WhatsAppVerificationModal: React.FC<WhatsAppVerificationModalProps> = ({
  open,
  onClose,
  currentPhone,
  userId,
  onSuccess
}) => {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [codeCurrentPhone, setCodeCurrentPhone] = useState('');
  const [codeNewPhone, setCodeNewPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === 2 || step === 4) {
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
  }, [step]);

  useEffect(() => {
    if (!open) {
      // Reset ao fechar
      setStep(1);
      setCodeCurrentPhone('');
      setCodeNewPhone('');
      setNewPhone('');
      setTimer(300);
      setCanResend(false);
    }
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(**) *****-${cleaned.slice(-4)}`;
    }
    return phone;
  };

  const handleSendCodeCurrentPhone = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          userId,
          telefone: currentPhone,
          tipo: 'phone_change'
        }
      });

      if (error) throw error;

      toast.success('Código enviado com sucesso!');
      setStep(2);
      setTimer(300);
      setCanResend(false);
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      toast.error(error.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCurrentPhone = async () => {
    if (codeCurrentPhone.length !== 6) {
      toast.error('Digite o código completo');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-whatsapp-code', {
        body: {
          userId,
          telefone: currentPhone,
          codigo: codeCurrentPhone,
          tipo: 'phone_change'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Código inválido');

      toast.success('Código verificado!');
      setStep(3);
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      toast.error(error.message || 'Código inválido ou expirado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCodeNewPhone = async () => {
    if (!newPhone || newPhone.replace(/\D/g, '').length < 10) {
      toast.error('Digite um número de WhatsApp válido');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          userId,
          telefone: newPhone,
          tipo: 'new_phone'
        }
      });

      if (error) throw error;

      toast.success('Código enviado para o novo número!');
      setStep(4);
      setTimer(300);
      setCanResend(false);
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
      toast.error(error.message || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyNewPhone = async () => {
    if (codeNewPhone.length !== 6) {
      toast.error('Digite o código completo');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-user-whatsapp-code', {
        body: {
          userId,
          telefone: newPhone,
          codigo: codeNewPhone,
          tipo: 'new_phone',
          novoTelefone: newPhone
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Código inválido');

      toast.success('WhatsApp atualizado com sucesso!');
      onSuccess(newPhone);
      onClose();
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      toast.error(error.message || 'Código inválido ou expirado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    if (step === 2) {
      await handleSendCodeCurrentPhone();
    } else if (step === 4) {
      await handleSendCodeNewPhone();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-[#9C1E1E]" />
            Alterar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Etapa 1: Confirmação */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-[#9C1E1E]/10 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-[#9C1E1E]" />
                </div>
                <h3 className="font-semibold text-lg">Verificação de Segurança</h3>
                <p className="text-sm text-gray-600">
                  Para sua segurança, enviaremos um código de verificação para o seu WhatsApp atual:
                </p>
                <p className="text-lg font-semibold text-[#9C1E1E]">
                  {maskPhone(currentPhone)}
                </p>
              </div>

              <Button
                onClick={handleSendCodeCurrentPhone}
                disabled={isLoading}
                className="w-full bg-[#9C1E1E] hover:bg-[#7A1818]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Código'
                )}
              </Button>
            </motion.div>
          )}

          {/* Etapa 2: Código do número atual */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-lg">Digite o Código</h3>
                <p className="text-sm text-gray-600">
                  Enviamos um código de 6 dígitos para<br />
                  <span className="font-semibold">{maskPhone(currentPhone)}</span>
                </p>
              </div>

              <WhatsAppCodeInput
                value={codeCurrentPhone}
                onChange={setCodeCurrentPhone}
                disabled={isLoading}
              />

              <div className="text-center text-sm">
                <p className="text-gray-500">
                  Código expira em: <span className="font-semibold text-[#9C1E1E]">{formatTime(timer)}</span>
                </p>
                {canResend && (
                  <Button
                    variant="link"
                    onClick={handleResend}
                    className="text-[#9C1E1E] mt-2"
                  >
                    Reenviar código
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleVerifyCurrentPhone}
                  disabled={isLoading || codeCurrentPhone.length !== 6}
                  className="flex-1 bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verificar'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Etapa 3: Novo número */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Número Verificado!</h3>
                <p className="text-sm text-gray-600">
                  Agora digite seu novo número de WhatsApp:
                </p>
              </div>

              <PhoneInput
                value={newPhone}
                onChange={(formatted) => setNewPhone(formatted)}
                defaultCountry="BR"
                required
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSendCodeNewPhone}
                  disabled={isLoading || !newPhone}
                  className="flex-1 bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Verificar Novo Número'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Etapa 4: Código do novo número */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-lg">Confirme o Novo Número</h3>
                <p className="text-sm text-gray-600">
                  Enviamos um código para<br />
                  <span className="font-semibold">{formatPhoneBR(newPhone)}</span>
                </p>
              </div>

              <WhatsAppCodeInput
                value={codeNewPhone}
                onChange={setCodeNewPhone}
                disabled={isLoading}
              />

              <div className="text-center text-sm">
                <p className="text-gray-500">
                  Código expira em: <span className="font-semibold text-[#9C1E1E]">{formatTime(timer)}</span>
                </p>
                {canResend && (
                  <Button
                    variant="link"
                    onClick={handleResend}
                    className="text-[#9C1E1E] mt-2"
                  >
                    Reenviar código
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleVerifyNewPhone}
                  disabled={isLoading || codeNewPhone.length !== 6}
                  className="flex-1 bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Confirmar Alteração'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
