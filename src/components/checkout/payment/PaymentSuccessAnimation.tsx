
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentSuccessAnimationProps {
  onContinue: () => void;
  autoRedirectTimeout?: number;
}

const PaymentSuccessAnimation: React.FC<PaymentSuccessAnimationProps> = ({ 
  onContinue,
  autoRedirectTimeout = 3000
}) => {
  useEffect(() => {
    // Auto redirect after specified timeout
    const timer = setTimeout(() => {
      onContinue();
    }, autoRedirectTimeout);
    
    return () => clearTimeout(timer);
  }, [onContinue, autoRedirectTimeout]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.2
        }}
        className="relative mb-4"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute -inset-2 rounded-full bg-green-200 blur-md"
        />
        <CheckCircle className="relative h-16 w-16 text-green-500" strokeWidth={2.5} />
      </motion.div>
      
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-green-800 mb-2"
      >
        PIX Recebido!
      </motion.h2>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-green-700 mb-6 max-w-xs"
      >
        Seu pagamento foi confirmado. Redirecionando para upload do vídeo...
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button 
          onClick={onContinue}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
        >
          Continuar para Upload
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PaymentSuccessAnimation;
