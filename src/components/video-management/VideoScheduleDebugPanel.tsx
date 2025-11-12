import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Calendar, Activity } from 'lucide-react';
import { videoScheduleService } from '@/services/videoScheduleService';
import { toast } from 'sonner';

interface VideoScheduleDebugPanelProps {
  orderId: string;
}

export const VideoScheduleDebugPanel: React.FC<VideoScheduleDebugPanelProps> = ({ orderId }) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    
    try {
      toast.info('Iniciando sincronização manual...');
      
      const result = await videoScheduleService.forceSyncVideoSchedules(orderId);
      
      setLastSync(new Date());
      
      if (result.success) {
        toast.success(`Sincronização concluída! ${result.trocas_realizadas} trocas realizadas`);
      } else {
        toast.warning('Sincronização concluída com avisos');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar vídeos');
    } finally {
      setSyncing(false);
    }
  };

  const getDayName = (dayNum: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayNum];
  };

  return (
    <Card className="p-4 bg-muted/30 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Debug de Agendamento
          </h3>
          
          <Button
            onClick={handleManualSync}
            disabled={syncing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Horário Atual</p>
              <p className="font-mono font-semibold">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Dia da Semana</p>
              <p className="font-semibold">
                {getDayName(currentTime.getDay())}
              </p>
            </div>
          </div>
        </div>

        {lastSync && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Última sincronização:</span>
              <Badge variant="outline" className="font-mono">
                {lastSync.toLocaleTimeString('pt-BR')}
              </Badge>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <p>💡 A sincronização automática ocorre a cada minuto via edge function</p>
        </div>
      </div>
    </Card>
  );
};
