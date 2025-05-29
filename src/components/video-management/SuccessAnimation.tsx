
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, Zap } from 'lucide-react';

interface SuccessAnimationProps {
  isVisible: boolean;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ isVisible }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Reduzido de 8 para 4 partículas para melhor performance
      const newParticles = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.2 // Reduzido delay máximo
      }));
      setParticles(newParticles);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Partículas animadas otimizadas */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
            y: [-10, -30, -50] // Movimento reduzido
          }}
          transition={{
            duration: 1, // Reduzido de 1.5s para 1s
            delay: particle.delay,
            ease: "easeOut"
          }}
        >
          {particle.id % 3 === 0 ? (
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
          ) : particle.id % 3 === 1 ? (
            <Sparkles className="h-3 w-3 text-blue-400 fill-current" />
          ) : (
            <Zap className="h-3 w-3 text-green-400 fill-current" />
          )}
        </motion.div>
      ))}

      {/* Ondas de celebração simplificadas */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-green-400 opacity-30"
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border border-blue-400 opacity-20"
        initial={{ scale: 0, opacity: 0.4 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
      />
    </div>
  );
};
