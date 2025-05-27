
import React, { useState, useEffect } from 'react';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PixCountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  isActive: boolean;
  paymentStatus?: string;
  createdAt?: string;
  onTimeUpdate?: (seconds: number) => void;
}

const PixCountdownTimer: React.FC<PixCountdownTimerProps> = ({ 
  initialSeconds, 
  onExpire,
  isActive,
  paymentStatus = 'pending',
  createdAt,
  onTimeUpdate
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  
  // Calcular tempo real baseado no timestamp de criação
  const calculateRealTimeLeft = () => {
    if (!createdAt) return initialSeconds;
    
    const created = new Date(createdAt);
    const now = new Date();
    const elapsedMs = now.getTime() - created.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    
    return Math.max(0, initialSeconds - elapsedSeconds);
  };
  
  useEffect(() => {
    // CORREÇÃO: Timer só funciona para pagamentos pendentes
    if (!isActive || paymentStatus !== 'pending') {
      return;
    }
    
    // Calcular tempo real restante
    const realTimeLeft = calculateRealTimeLeft();
    setSeconds(realTimeLeft);
    
    // Se já expirou, chamar onExpire imediatamente
    if (realTimeLeft <= 0) {
      onExpire();
      return;
    }
    
    // Log timer start
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.INFO,
      "Iniciando temporizador PIX com tempo real",
      { 
        duration: initialSeconds, 
        realTimeLeft,
        createdAt,
        timestamp: new Date().toISOString() 
      }
    );
    
    const interval = setInterval(() => {
      setSeconds(prevSeconds => {
        const newSeconds = prevSeconds - 1;
        
        // Notificar o componente pai sobre o tempo restante
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
  }, [initialSeconds, onExpire, isActive, paymentStatus, createdAt, onTimeUpdate]);
  
  // CORREÇÃO: Não mostrar timer para pagamentos aprovados
  if (paymentStatus === 'approved') {
    return null;
  }
  
  // Calcular progresso para a barra de progresso
  const progress = (seconds / initialSeconds) * 100;
  
  // CORREÇÃO: Cores do timer - verde → amarelo → vermelho
  const getProgressColor = () => {
    if (progress > 66) return 'bg-green-500'; // Verde: mais de 66%
    if (progress > 33) return 'bg-yellow-500'; // Amarelo: 33-66%
    return 'bg-red-500'; // Vermelho: menos de 33%
  };

  // Adicionar pulsação quando tempo está baixo
  const shouldPulse = progress <= 20;

  // Formatar tempo em MM:SS
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Tempo restante:</span>
        <span className={`font-mono font-bold ${
          progress <= 20 ? 'text-red-600' : 
          progress <= 50 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {formatTime(seconds)}
        </span>
      </div>
      
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
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
