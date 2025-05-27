
import React, { useState, useEffect } from 'react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PixCountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  isActive: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

const PixCountdownTimer: React.FC<PixCountdownTimerProps> = ({ 
  initialSeconds, 
  onExpire,
  isActive,
  onTimeUpdate
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  
  useEffect(() => {
    if (!isActive) {
      return;
    }
    
    // Log timer start
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.INFO,
      "Iniciando temporizador PIX",
      { duration: initialSeconds, timestamp: new Date().toISOString() }
    );
    
    const interval = setInterval(() => {
      setSeconds(prevSeconds => {
        const newSeconds = prevSeconds - 1;
        
        // Notificar o componente pai sobre o tempo restante (se disponível)
        if (onTimeUpdate) {
          onTimeUpdate(newSeconds);
        }
        
        // Log warning when there's only 60 seconds left
        if (newSeconds === 60) {
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_EVENT,
            LogLevel.WARNING,
            "Apenas 1 minuto restante no timer PIX",
            { timestamp: new Date().toISOString() }
          );
        }
        
        // Verificar se o tempo acabou
        if (newSeconds <= 0) {
          clearInterval(interval);
          
          // Log expiration
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_EVENT,
            LogLevel.WARNING,
            "Timer PIX expirado",
            { timestamp: new Date().toISOString() }
          );
          
          onExpire();
          return 0;
        }
        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds, onExpire, isActive, onTimeUpdate]);
  
  // Calcular progresso para a barra de progresso
  const progress = (seconds / initialSeconds) * 100;
  
  // Determinar a cor da barra de progresso com base no tempo restante - sempre vermelha para urgência
  const getProgressColor = () => {
    if (progress > 60) return 'bg-red-500';
    if (progress > 20) return 'bg-red-600';
    return 'bg-red-700';
  };

  // Adicionar pulsação quando tempo está baixo
  const shouldPulse = progress <= 20;

  return (
    <div className="w-full">
      <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden border border-red-200">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-1000 ease-linear ${
            shouldPulse ? 'animate-pulse' : ''
          }`} 
          style={{ width: `${progress}%` }}
        />
      </div>
      {shouldPulse && (
        <p className="text-xs text-red-700 text-center mt-1 font-medium animate-pulse">
          ⚠️ Tempo quase esgotado!
        </p>
      )}
    </div>
  );
};

export default PixCountdownTimer;
