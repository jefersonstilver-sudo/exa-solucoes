
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessAnimationPremiumProps {
  onComplete?: () => void;
  redirectDelay?: number;
}

const PaymentSuccessAnimationPremium = ({ 
  onComplete, 
  redirectDelay = 3000 
}: PaymentSuccessAnimationPremiumProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect timer
    const redirectTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      } else {
        navigate('/anunciante/pedidos');
      }
    }, redirectDelay);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [redirectDelay, onComplete, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20 
        }}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
      >
        {/* Confetti Background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
              initial={{
                x: Math.random() * 400,
                y: -20,
                opacity: 0,
                scale: 0
              }}
              animate={{
                y: 500,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
            />
          ))}
        </div>

        {/* Success Icon with Pulse Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 15,
            delay: 0.2 
          }}
          className="relative mb-6"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
          >
            <CheckCircle className="h-12 w-12 text-white" strokeWidth={3} />
          </motion.div>
          
          {/* Sparkles around the icon */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 45}deg) translateY(-60px)`
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1, 0],
                y: [-20, -40, -20]
              }}
              transition={{
                duration: 2,
                delay: 0.5 + (i * 0.1),
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </motion.div>
          ))}
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            🎉 Pagamento Aprovado!
          </h2>
          
          <p className="text-gray-600 text-lg">
            Seu pagamento PIX foi processado com sucesso!
          </p>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.6 }}
            className="h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto"
          />
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200"
        >
          <p className="text-green-700 font-medium">
            Redirecionando para seus pedidos em...
          </p>
          <motion.div
            key={countdown}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold text-green-600 mt-2"
          >
            {countdown}
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: redirectDelay / 1000,
              ease: "linear"
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentSuccessAnimationPremium;
