
import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PixPaymentTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  onRefresh: () => void;
  isActive: boolean;
  isRefreshing?: boolean;
}

const PixPaymentTimer = ({
  initialSeconds,
  onExpire,
  onRefresh,
  isActive,
  isRefreshing = false
}: PixPaymentTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);
  
  // Resetar timer quando isActive muda
  useEffect(() => {
    if (isActive) {
      setSecondsLeft(initialSeconds);
      setIsExpired(false);
    }
  }, [isActive, initialSeconds]);
  
  // Countdown timer
  useEffect(() => {
    if (!isActive || isExpired) return;
    
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          toast.warning("QR Code expirado", {
            description: "Gere um novo QR code para continuar"
          });
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, isExpired, onExpire]);
  
  // Formatar tempo
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (!isActive) return null;
  
  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {isExpired ? "QR Code expirado" : "QR Code válido por:"}
        </span>
      </div>
      
      {!isExpired ? (
        <div className={`text-2xl font-mono font-bold ${
          secondsLeft <= 60 ? 'text-red-500' : 'text-gray-700'
        }`}>
          {formatTime(secondsLeft)}
        </div>
      ) : (
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando novo QR...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar novo QR Code
            </>
          )}
        </Button>
      )}
      
      {/* Barra de progresso */}
      {!isExpired && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              secondsLeft <= 60 ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${(secondsLeft / initialSeconds) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PixPaymentTimer;
