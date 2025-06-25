
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
  initialSeconds = 300, // 5 minutos por padrão
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
          toast.warning("⏰ Tempo de pagamento expirado", {
            description: "O pedido foi cancelado automaticamente"
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
    <div className="flex flex-col items-center space-y-3 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2">
        <Clock className="h-5 w-5 text-blue-600" />
        <span className="text-sm text-blue-700 font-medium">
          {isExpired ? "⏰ Tempo expirado" : "⏰ Tempo restante:"}
        </span>
      </div>
      
      {!isExpired ? (
        <div className={`text-3xl font-mono font-bold ${
          secondsLeft <= 60 ? 'text-red-500 animate-pulse' : 
          secondsLeft <= 120 ? 'text-orange-500' : 'text-blue-700'
        }`}>
          {formatTime(secondsLeft)}
        </div>
      ) : (
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando novo QR...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              🔄 Gerar Novo QR Code
            </>
          )}
        </Button>
      )}
      
      {/* Barra de progresso visual */}
      {!isExpired && (
        <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              secondsLeft <= 60 ? 'bg-red-500' : 
              secondsLeft <= 120 ? 'bg-orange-500' : 
              'bg-gradient-to-r from-blue-500 to-green-500'
            }`}
            style={{
              width: `${(secondsLeft / initialSeconds) * 100}%`
            }}
          />
        </div>
      )}
      
      {secondsLeft <= 60 && !isExpired && (
        <p className="text-xs text-red-700 text-center font-medium animate-pulse">
          ⚠️ Últimos momentos para pagamento!
        </p>
      )}
    </div>
  );
};

export default PixPaymentTimer;
