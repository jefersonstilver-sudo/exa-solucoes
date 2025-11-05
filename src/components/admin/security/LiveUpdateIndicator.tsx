import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, WifiOff } from 'lucide-react';

export const LiveUpdateIndicator = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setLastUpdate(new Date());
      
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isUpdating ? "default" : "outline"} 
        className={`gap-1 transition-all ${isUpdating ? 'animate-pulse' : ''}`}
      >
        <Activity className={`h-3 w-3 ${isUpdating ? 'text-green-500' : ''}`} />
        {isUpdating ? 'Atualizando...' : 'Ao Vivo'}
      </Badge>
      <span className="text-xs text-muted-foreground">
        Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
      </span>
    </div>
  );
};
