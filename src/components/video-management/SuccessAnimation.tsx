
import React, { useEffect, useState } from 'react';
import { Sparkles, Star, Zap } from 'lucide-react';

interface SuccessAnimationProps {
  isVisible: boolean;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ isVisible }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.1
      }));
      setParticles(newParticles);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute transition-all duration-500"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transitionDelay: `${particle.delay}s`
          }}
        >
          {particle.id % 3 === 0 ? (
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
          ) : particle.id % 3 === 1 ? (
            <Sparkles className="h-3 w-3 text-blue-400 fill-current" />
          ) : (
            <Zap className="h-3 w-3 text-green-400 fill-current" />
          )}
        </div>
      ))}

      <div className="absolute inset-0 rounded-full border-2 border-green-400 opacity-30 transition-all duration-800" />
      <div className="absolute inset-0 rounded-full border border-blue-400 opacity-20 transition-all duration-1000" />
    </div>
  );
};
