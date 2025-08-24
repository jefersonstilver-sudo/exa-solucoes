
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface PaymentSuccessAnimationProps {
  onContinue: () => void;
  autoRedirectTimeout?: number;
}

const PaymentSuccessAnimation: React.FC<PaymentSuccessAnimationProps> = ({ 
  onContinue, 
  autoRedirectTimeout = 3000 
}) => {
  const [redirectCounter, setRedirectCounter] = useState(Math.ceil(autoRedirectTimeout / 1000));
  
  useEffect(() => {
    // Configure countdown timer for redirection
    if (autoRedirectTimeout > 0) {
      const interval = setInterval(() => {
        setRedirectCounter(prev => {
          const newValue = prev - 1;
          if (newValue <= 0) {
            clearInterval(interval);
            onContinue();
          }
          return newValue;
        });
      }, 1000);
      
      // Set timeout for redirection
      const timeout = setTimeout(() => {
        onContinue();
      }, autoRedirectTimeout);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [autoRedirectTimeout, onContinue]);
  
  // Animation variants for the elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.3
      }
    }
  };
  
  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 10,
        duration: 0.5
      }
    }
  };
  
  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-6 px-4 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="relative mb-6"
        variants={iconVariants}
      >
        {/* Background circle with gradient animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{ filter: "blur(10px)" }}
        />
        
        {/* Success icon */}
        <CheckCircle className="relative h-20 w-20 text-white" strokeWidth={2} />
      </motion.div>
      
      <motion.h2 
        className="text-xl font-bold mb-2 text-green-600"
        variants={textVariants}
      >
        Pagamento Confirmado!
      </motion.h2>
      
      <motion.p
        className="text-gray-600 mb-6"
        variants={textVariants}
      >
        Seu pagamento foi processado com sucesso.
      </motion.p>
      
      <motion.div
        className="text-sm text-gray-500"
        variants={textVariants}
      >
        Redirecionando em {redirectCounter} {redirectCounter === 1 ? 'segundo' : 'segundos'}...
      </motion.div>
    </motion.div>
  );
};

export default PaymentSuccessAnimation;
