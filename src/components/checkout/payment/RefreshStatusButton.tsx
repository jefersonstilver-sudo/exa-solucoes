
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface RefreshStatusButtonProps {
  status?: string;
  onClick: () => Promise<void>; // Changed parameter name for consistency
  isRefreshing?: boolean; // Added isRefreshing as an optional prop
  className?: string; // Added className as an optional prop
}

const RefreshStatusButton = ({ 
  status = 'pending', 
  onClick, 
  isRefreshing: externalIsRefreshing,
  className = ''
}: RefreshStatusButtonProps) => {
  const [internalIsRefreshing, setInternalIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Use external state if provided, otherwise use internal state
  const isRefreshing = externalIsRefreshing !== undefined ? externalIsRefreshing : internalIsRefreshing;

  // Handle refresh status
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    if (externalIsRefreshing === undefined) {
      setInternalIsRefreshing(true);
    }
    
    try {
      await onClick();
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error refreshing payment status:", error);
    } finally {
      if (externalIsRefreshing === undefined) {
        setInternalIsRefreshing(false);
      }
    }
  };
  
  // Calculate time until next refresh is allowed
  useEffect(() => {
    const interval = setInterval(() => {
      const secondsElapsed = Math.floor((new Date().getTime() - lastRefresh.getTime()) / 1000);
      const newTimeLeft = Math.max(0, 60 - secondsElapsed);
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastRefresh]);

  return (
    <div className={`w-full max-w-md ${className}`}>
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing || timeLeft > 0 || status === 'approved'}
        variant="outline"
        className="w-full"
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 
            Atualizando...
          </>
        ) : timeLeft > 0 && status !== 'approved' ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" /> 
            Atualizar status ({timeLeft}s)
          </>
        ) : status === 'approved' ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> 
            Pagamento confirmado
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" /> 
            Atualizar status
          </>
        )}
      </Button>
      
      {(status === 'pending' || status === 'in_process') && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Após realizar o pagamento, clique em "Atualizar status" para verificar a confirmação.
        </p>
      )}
    </div>
  );
};

export default RefreshStatusButton;
