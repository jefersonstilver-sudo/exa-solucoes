import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimelineOcorrencia {
  inicio: string;
  fim: string | null;
  duracao_segundos: number;
}

interface TimelineSegment {
  status: 'online' | 'offline';
  inicio: string;
  fim: string | null;
  startPercent: number;
  widthPercent: number;
  duracao: string;
}

interface UptimeTimelineRealTimeProps {
  ocorrencias: TimelineOcorrencia[];
}

const useCurrentTimePosition = () => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      setPosition((minutes / 1440) * 100); // 1440 = minutos em 24h
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, []);

  return position;
};

const formatDuracao = (segundos: number): string => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const secs = segundos % 60;

  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  } else if (minutos > 0) {
    return `${minutos}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const parseTimeToMinutes = (timeStr: string): number => {
  const date = new Date(timeStr);
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
};

const buildSegments = (ocorrencias: TimelineOcorrencia[]): TimelineSegment[] => {
  const segments: TimelineSegment[] = [];
  const sortedOcorrencias = [...ocorrencias].sort((a, b) => 
    new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  let lastEnd = startOfDay.toISOString();

  // Processar cada queda e os períodos online entre elas
  sortedOcorrencias.forEach((ocorrencia, index) => {
    // Se há um gap entre a última queda e esta, é um período online
    if (new Date(ocorrencia.inicio).getTime() > new Date(lastEnd).getTime()) {
      const onlineStart = parseTimeToMinutes(lastEnd);
      const onlineEnd = parseTimeToMinutes(ocorrencia.inicio);
      const onlineDuration = (onlineEnd - onlineStart) * 60; // converter para segundos
      
      segments.push({
        status: 'online',
        inicio: lastEnd,
        fim: ocorrencia.inicio,
        startPercent: (onlineStart / 1440) * 100,
        widthPercent: ((onlineEnd - onlineStart) / 1440) * 100,
        duracao: formatDuracao(Math.floor(onlineDuration))
      });
    }

    // Adicionar o período offline
    const offlineStart = parseTimeToMinutes(ocorrencia.inicio);
    const offlineEnd = ocorrencia.fim ? parseTimeToMinutes(ocorrencia.fim) : parseTimeToMinutes(now.toISOString());
    
    segments.push({
      status: 'offline',
      inicio: ocorrencia.inicio,
      fim: ocorrencia.fim,
      startPercent: (offlineStart / 1440) * 100,
      widthPercent: ((offlineEnd - offlineStart) / 1440) * 100,
      duracao: formatDuracao(ocorrencia.duracao_segundos)
    });

    lastEnd = ocorrencia.fim || now.toISOString();
  });

  // Se há tempo restante até o fim do dia (ou agora), é online
  const lastEndMinutes = parseTimeToMinutes(lastEnd);
  const nowMinutes = parseTimeToMinutes(now.toISOString());
  if (nowMinutes > lastEndMinutes) {
    const remainingDuration = (nowMinutes - lastEndMinutes) * 60;
    segments.push({
      status: 'online',
      inicio: lastEnd,
      fim: null,
      startPercent: (lastEndMinutes / 1440) * 100,
      widthPercent: ((nowMinutes - lastEndMinutes) / 1440) * 100,
      duracao: formatDuracao(Math.floor(remainingDuration))
    });
  }

  return segments;
};

const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return 'Agora';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const UptimeTimelineRealTime = ({ ocorrencias }: UptimeTimelineRealTimeProps) => {
  const currentTimePosition = useCurrentTimePosition();
  const segments = buildSegments(ocorrencias);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="mb-3">
        {/* Timeline Container */}
        <div className="relative h-3 bg-muted/20 rounded-lg overflow-hidden">
          {segments.length === 0 ? (
            // Se não há quedas, timeline toda verde
            <div className="absolute h-full w-full bg-green-500 rounded-lg" />
          ) : (
            // Segmentos Online/Offline
            segments.map((segment, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "absolute h-full transition-opacity hover:opacity-80 cursor-pointer",
                      segment.status === 'online' ? 'bg-green-500' : 'bg-destructive'
                    )}
                    style={{
                      left: `${segment.startPercent}%`,
                      width: `${segment.widthPercent}%`,
                      borderRadius: 
                        idx === 0 && idx === segments.length - 1 ? '8px' :
                        idx === 0 ? '8px 0 0 8px' : 
                        idx === segments.length - 1 ? '0 8px 8px 0' : '0'
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-background/95 backdrop-blur-sm border-border">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">
                      Status: <span className={segment.status === 'online' ? 'text-green-500' : 'text-destructive'}>
                        {segment.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </p>
                    <p>Início: {formatTime(segment.inicio)}</p>
                    <p>Fim: {formatTime(segment.fim)}</p>
                    <p>Duração: {segment.duracao}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))
          )}
          
          {/* Playhead - Marcador de Tempo Atual */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-50 pointer-events-none"
            style={{
              left: `${currentTimePosition}%`,
              transition: 'left 0.5s ease-out',
              filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
            }}
          >
            {/* Triângulo no topo */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
        
        {/* Régua de Horários */}
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-mono">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
    </TooltipProvider>
  );
};
