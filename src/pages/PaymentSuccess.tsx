import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const fetchOrderFromSession = async () => {
      if (!sessionId) {
        console.error('❌ Sem session_id');
        toast.error('Erro: Sessão não encontrada');
        setTimeout(() => navigate('/anunciante/pedidos'), 2000);
        return;
      }

      try {
        console.log('🔍 Buscando pedido para session:', sessionId);
        
        // Buscar pedido pelo payment_external_id (Stripe session_id)
        const { data, error } = await supabase
          .from('pedidos')
          .select('id')
          .eq('payment_external_id', sessionId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          console.log('✅ Pedido encontrado:', data.id);
          setPedidoId(data.id);
          
          // Tocar som de sucesso
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyAzPLZiTYIGGe77eeeTRALUKvj8LZjHAU5kdXzzHkrBSR3yPDckD8KFWO08+qoVBMKRp/g8r9rIQUsgszy2Ik2CBhnvO3nn0wQC1Cr4/C1Yh0FO5PU8sx5LQYleMjw3ZA/ChVitPPqqVQTCkef4PK/ayEFLILM8tmJNQgYZ7zt559NEAtRquPwtmIcBTyS1fLLeSsFJXjJ8NyQPwoWYrPz6qlUEwpHn+Dyv2shBSyCzPLZiTUIGGe87eefTRALUarj8LViHAU8ktXyy3krBSR4yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsrz24k1CBhnu+3mnkwQC1Cq4/C2Yh0FO5LV8st5KwUkeMnw3JA/ChVhs/PqqVQTCkeg3/K/ayEFLIHL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyQQAoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDckEAKFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3JBAChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyPPwoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDcjz8KFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3I8/ChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyPPwoVYbPz6qlUEwpHn+Dyv2shBSyCy/LYiDUIGGe77eaeTBALT6rj8LViHAU9ktTyy3krBSR3yfDcjz8KFWGz8+qpVBMKR5/g8r9rIQUsgsvy2Ig1CBhnu+3mnkwQC0+q4/C1YhwFPZLU8st5KwUkd8nw3I8/ChVhs/PqqVQTCkef4PK/ayEFLILL8tiINQgYZ7vt5p5MEAtPquPwtWIcBT2S1PLLeSsFJHfJ8NyPPw==');
          audio.play().catch(e => console.log('Som não pôde ser reproduzido', e));
        } else {
          console.warn('⚠️ Pedido não encontrado, redirecionando');
          toast.info('Pedido não encontrado, redirecionando...');
          setTimeout(() => navigate('/anunciante/pedidos'), 2000);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar pedido:', error);
        toast.error('Erro ao buscar pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderFromSession();
  }, [sessionId, navigate]);

  // Countdown e redirecionamento automático
  useEffect(() => {
    if (!pedidoId || loading) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(`/anunciante/pedidos/${pedidoId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-[#3C1361] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Processando seu pagamento...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-16">
      <AnimatePresence mode="wait">
        {pedidoId && (
          <motion.div
            key="success-animation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-lg w-full relative"
          >
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "-100%", opacity: [0, 1, 0] }}
                  transition={{
                    duration: 3,
                    delay: i * 0.3,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="absolute"
                  style={{
                    left: `${15 + i * 15}%`,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-[#3C1361]" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl p-12 text-center relative overflow-hidden"
            >
              {/* Success pulse effect */}
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-0 bg-green-400 rounded-full"
              />

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                className="relative z-10 mx-auto w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <CheckCircle className="w-20 h-20 text-white" strokeWidth={2.5} />
                </motion.div>
              </motion.div>

              {/* Success text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 space-y-3"
              >
                <h1 className="text-4xl font-bold text-gray-900">
                  Pagamento Confirmado!
                </h1>
                <p className="text-gray-600 text-lg">
                  Seu pedido foi processado com sucesso
                </p>
              </motion.div>

              {/* Countdown */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 inline-flex items-center justify-center bg-gradient-to-r from-[#3C1361] to-purple-600 text-white px-8 py-4 rounded-2xl shadow-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-3"
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
                <span className="font-semibold text-lg">
                  Redirecionando em {countdown}s
                </span>
              </motion.div>

              {/* Info text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-sm text-gray-500"
              >
                Você será redirecionado para a página do seu pedido
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentSuccess;
