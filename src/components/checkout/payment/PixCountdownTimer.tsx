
import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface PixCountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  isActive?: boolean;
}

const PixCountdownTimer: React.FC<PixCountdownTimerProps> = ({
  initialSeconds,
  onExpire,
  isActive = true
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    if (!isActive) return;
    
    if (seconds <= 0) {
      setIsExpired(true);
      onExpire();
      return;
    }
    
    const timer = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [seconds, isActive, onExpire]);
  
  // Format time as mm:ss
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate percentage for circular progress
  const progressPercentage = Math.max(0, (seconds / initialSeconds) * 100);
  
  // Determine color based on remaining time
  const getColorClass = () => {
    if (seconds < 60) return 'text-red-500'; // Less than 1 minute
    if (seconds < 120) return 'text-orange-500'; // Less than 2 minutes
    return 'text-green-500'; // More than 2 minutes
  };
  
  if (isExpired) {
    return (
      <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="text-red-500 mr-2 h-5 w-5" />
        <span className="text-red-700 font-medium">QR Code expirado</span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative flex items-center justify-center">
        <CircularProgress 
          value={progressPercentage} 
          size="lg"
          className="text-gray-200" 
          indicatorClassName={getColorClass()}
        />
        <span className={`absolute ${getColorClass()} text-lg font-semibold`}>
          {formatTime(seconds)}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {seconds > 0 ? 'Tempo restante para pagamento' : 'QR Code expirado'}
      </p>
    </div>
  );
};

export default PixCountdownTimer;
