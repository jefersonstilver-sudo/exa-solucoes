import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface PaymentApprovedOverlayProps {
  onContinue: () => void;
  autoRedirectTimeout?: number;
}

const PaymentApprovedOverlay: React.FC<PaymentApprovedOverlayProps> = ({
  onContinue,
  autoRedirectTimeout = 3000
}) => {
  const [countdown, setCountdown] = useState(Math.ceil(autoRedirectTimeout / 1000));

  useEffect(() => {
    // Play success sound
    const audio = new Audio('/lovable-uploads/success-sound.mp3');
    audio.volume = 0.3;
    audio.play().catch(console.error);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto redirect
    const redirectTimer = setTimeout(() => {
      onContinue();
    }, autoRedirectTimeout);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [onContinue, autoRedirectTimeout]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 25,
            duration: 0.6
          }}
          className="relative flex flex-col items-center max-w-md mx-4 text-center"
        >
          {/* Success Icon with Glow Effect */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2
            }}
            className="relative mb-8"
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
              style={{ width: '120px', height: '120px', left: '-10px', top: '-10px' }}
            />
            
            {/* Icon container */}
            <div className="relative bg-primary/10 rounded-full p-6 backdrop-blur-sm border border-primary/20">
              <CheckCircle className="h-16 w-16 text-primary" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4 mb-8 px-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Pagamento Confirmado!
            </h1>
            <div className="space-y-2">
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
                Estamos preparando seu espaço publicitário
              </p>
              <p className="text-sm sm:text-base text-muted-foreground/80 max-w-md mx-auto">
                Seu vídeo entrará no ar em breve
              </p>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="w-full max-w-xs mb-6"
          >
            <div className="relative h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: autoRedirectTimeout / 1000,
                  ease: "linear"
                }}
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
              />
            </div>
          </motion.div>

          {/* Countdown */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs sm:text-sm text-muted-foreground"
          >
            Redirecionando para Meus Pedidos em {countdown}s...
          </motion.p>

          {/* Decorative particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: [0, (Math.random() - 0.5) * 200],
                y: [0, (Math.random() - 0.5) * 200]
              }}
              transition={{
                duration: 2,
                delay: 0.3 + i * 0.1,
                ease: "easeOut"
              }}
              className="absolute w-2 h-2 rounded-full bg-primary/40"
              style={{
                top: '50%',
                left: '50%'
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentApprovedOverlay;
