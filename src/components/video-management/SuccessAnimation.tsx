
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
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5
      }));
      setParticles(newParticles);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Partículas animadas */}
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
            scale: [0, 1.2, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
            y: [-20, -40, -60]
          }}
          transition={{
            duration: 1.5,
            delay: particle.delay,
            ease: "easeOut"
          }}
        >
          {particle.id % 3 === 0 ? (
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
          ) : particle.id % 3 === 1 ? (
            <Sparkles className="h-4 w-4 text-blue-400 fill-current" />
          ) : (
            <Zap className="h-4 w-4 text-green-400 fill-current" />
          )}
        </motion.div>
      ))}

      {/* Ondas de celebração */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-green-400 opacity-50"
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-30"
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
      />
    </div>
  );
};
