import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { WhatsAppCodeInput } from '@/components/auth/WhatsAppCodeInput';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const TwoFactorVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get('userId');
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutos
  const [canResend, setCanResend] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    // Buscar telefone do usuário
    const fetchUserPhone = async () => {
      if (!userId) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('telefone')
        .eq('id', userId)
        .single();

      if (data?.telefone) {
        setUserPhone(data.telefone);
      } else {
        toast.error('Erro ao carregar dados do usuário');
        navigate('/login');
      }
    };

    fetchUserPhone();
  }, [userId, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const resendTimeout = setTimeout(() => setCanResend(true), 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(resendTimeout);
    };
  }, []);

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
          telefone: userPhone,
          codigo: code,
          tipo: '2fa_login'
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Código inválido');

      toast.success('Login autorizado!');
      
      // Buscar role para redirecionar corretamente
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      const role = roleData?.role || 'client';
      
      if (role === 'super_admin') {
        navigate('/super_admin');
      } else if (['admin', 'admin_marketing', 'admin_financeiro'].includes(role)) {
        navigate('/admin');
      } else {
        navigate('/');
      }
      
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      toast.error(error.message || 'Código inválido ou expirado');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: {
          userId,
          telefone: userPhone,
          tipo: '2fa_login'
        }
      });

      if (error) throw error;

      toast.success('Novo código enviado!');
      setTimer(300);
      setCanResend(false);
      setCode('');
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
      toast.error('Erro ao reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B1E1E] via-[#5C2A2A] to-[#9C1E1E] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo EXA */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block"
          >
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
              <Shield className="h-10 w-10 text-[#9C1E1E]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Autenticação de Dois Fatores</h1>
            <p className="text-white/80">EXA Publicidade Inteligente</p>
          </motion.div>
        </div>

        {/* Card de Verificação */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 mx-auto bg-[#9C1E1E]/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-[#9C1E1E]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Digite o Código</h2>
            <p className="text-sm text-gray-600">
              Enviamos um código de verificação para<br />
              <span className="font-semibold text-[#9C1E1E]">{maskPhone(userPhone)}</span>
            </p>
          </div>

          <div className="space-y-6">
            <WhatsAppCodeInput
              value={code}
              onChange={setCode}
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
                  disabled={isLoading}
                >
                  Reenviar código
                </Button>
              )}
            </div>

            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] h-12 text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Confirmar e Entrar'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="w-full text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Login
            </Button>
          </div>
        </motion.div>

        {/* Informação de Segurança */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center text-white/60 text-sm"
        >
          <p>🔒 Sua segurança é nossa prioridade</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TwoFactorVerificationPage;
