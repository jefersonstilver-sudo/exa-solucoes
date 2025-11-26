import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTimelineDrag } from '../hooks/useTimelineDrag';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, subDays, isToday } from 'date-fns';

interface TimelineOcorrencia {
  inicio: string;
  fim: string | null;
  duracao_segundos: number;
}

interface TimelineSegment {
  status: 'online' | 'offline';
  inicio: string;
  fim: string | null;
  absoluteStartPercent: number;
  widthPercent: number;
  duracao: string;
  dayIndex: number;
}

interface LoadedDay {
  date: Date;
  ocorrencias: TimelineOcorrencia[];
}

interface UptimeTimelineRealTimeProps {
  ocorrencias: TimelineOcorrencia[];
  painelId: string;
}

const useCurrentTimePosition = (totalDays: number) => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      // Posição relativa ao último dia (dia atual)
      const dayPercent = 100 / totalDays;
      const todayStartPercent = (totalDays - 1) * dayPercent;
      const positionInDay = (minutes / 1440) * dayPercent;
      setPosition(todayStartPercent + positionInDay);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [totalDays]);

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

const buildSegmentsForDay = (
  ocorrencias: TimelineOcorrencia[],
  dayIndex: number,
  totalDays: number,
  isCurrentDay: boolean
): TimelineSegment[] => {
  const segments: TimelineSegment[] = [];
  const sortedOcorrencias = [...ocorrencias].sort((a, b) => 
    new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  const dayPercent = 100 / totalDays;
  const dayStartPercent = dayIndex * dayPercent;

  const now = new Date();
  const startOfDayDate = new Date(ocorrencias[0]?.inicio || now);
  startOfDayDate.setHours(0, 0, 0, 0);

  let lastEnd = startOfDayDate.toISOString();

  // Processar cada queda e os períodos online entre elas
  sortedOcorrencias.forEach((ocorrencia) => {
    // Se há um gap entre a última queda e esta, é um período online
    if (new Date(ocorrencia.inicio).getTime() > new Date(lastEnd).getTime()) {
      const onlineStart = parseTimeToMinutes(lastEnd);
      const onlineEnd = parseTimeToMinutes(ocorrencia.inicio);
      const onlineDuration = (onlineEnd - onlineStart) * 60;
      
      segments.push({
        status: 'online',
        inicio: lastEnd,
        fim: ocorrencia.inicio,
        absoluteStartPercent: dayStartPercent + (onlineStart / 1440) * dayPercent,
        widthPercent: ((onlineEnd - onlineStart) / 1440) * dayPercent,
        duracao: formatDuracao(Math.floor(onlineDuration)),
        dayIndex,
      });
    }

    // Adicionar o período offline
    const offlineStart = parseTimeToMinutes(ocorrencia.inicio);
    const offlineEnd = ocorrencia.fim 
      ? parseTimeToMinutes(ocorrencia.fim) 
      : (isCurrentDay ? parseTimeToMinutes(now.toISOString()) : 1440);
    
    segments.push({
      status: 'offline',
      inicio: ocorrencia.inicio,
      fim: ocorrencia.fim,
      absoluteStartPercent: dayStartPercent + (offlineStart / 1440) * dayPercent,
      widthPercent: ((offlineEnd - offlineStart) / 1440) * dayPercent,
      duracao: formatDuracao(ocorrencia.duracao_segundos),
      dayIndex,
    });

    lastEnd = ocorrencia.fim || now.toISOString();
  });

  // Se há tempo restante até o fim do dia (ou agora), é online
  const lastEndMinutes = parseTimeToMinutes(lastEnd);
  const endMinutes = isCurrentDay ? parseTimeToMinutes(now.toISOString()) : 1440;
  
  if (endMinutes > lastEndMinutes) {
    const remainingDuration = (endMinutes - lastEndMinutes) * 60;
    segments.push({
      status: 'online',
      inicio: lastEnd,
      fim: null,
      absoluteStartPercent: dayStartPercent + (lastEndMinutes / 1440) * dayPercent,
      widthPercent: ((endMinutes - lastEndMinutes) / 1440) * dayPercent,
      duracao: formatDuracao(Math.floor(remainingDuration)),
      dayIndex,
    });
  }

  return segments;
};

const formatTime = (timeStr: string | null): string => {
  if (!timeStr) return 'Agora';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const UptimeTimelineRealTime = ({ ocorrencias, painelId }: UptimeTimelineRealTimeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedDays, setLoadedDays] = useState<LoadedDay[]>([
    { date: new Date(), ocorrencias }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const totalDays = loadedDays.length;
  const currentTimePosition = useCurrentTimePosition(totalDays);

  const allSegments = useMemo(() => {
    let segments: TimelineSegment[] = [];
    
    loadedDays.forEach((day, index) => {
      const isCurrentDay = isToday(day.date);
      const daySegments = buildSegmentsForDay(day.ocorrencias, index, totalDays, isCurrentDay);
      segments = segments.concat(daySegments);
    });
    
    return segments;
  }, [loadedDays, totalDays]);

  const loadPreviousDay = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const earliestDay = loadedDays[0].date;
      const previousDay = subDays(earliestDay, 1);
      
      // Buscar dados do dia anterior
      const { data: connectionHistory, error } = await supabase
        .from('connection_history')
        .select('*')
        .eq('computer_id', painelId)
        .eq('event_type', 'offline')
        .gte('started_at', startOfDay(previousDay).toISOString())
        .lte('started_at', endOfDay(previousDay).toISOString())
        .order('started_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar dia anterior:', error);
        return;
      }

      const previousDayOcorrencias: TimelineOcorrencia[] = (connectionHistory || []).map((conn: any) => ({
        inicio: conn.started_at,
        fim: conn.ended_at,
        duracao_segundos: conn.duration_seconds || 0,
      }));

      // Adicionar o novo dia no início
      setLoadedDays([
        { date: previousDay, ocorrencias: previousDayOcorrencias },
        ...loadedDays,
      ]);

      // Ajustar o scroll para manter a visualização
      setTimeout(() => {
        if (containerRef.current) {
          const dayWidth = containerRef.current.scrollWidth / (totalDays + 1);
          containerRef.current.scrollLeft += dayWidth;
        }
      }, 50);
    } catch (error) {
      console.error('Erro ao carregar dia anterior:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { isDragging, handleDragStart, handleDragMove, handleDragEnd } = useTimelineDrag({
    containerRef,
    onScrollToStart: loadPreviousDay,
    onScrollToEnd: () => {}, // Não aplicável para dias futuros
  });

  // Scroll automático para o dia atual ao montar
  useEffect(() => {
    if (containerRef.current && totalDays > 1) {
      const scrollToToday = () => {
        if (!containerRef.current) return;
        const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
        containerRef.current.scrollLeft = maxScroll;
      };
      
      setTimeout(scrollToToday, 100);
    }
  }, [totalDays]);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="mb-3">
        {/* Timeline Container - Scrollável Horizontalmente */}
        <div 
          ref={containerRef}
          className="relative h-[14px] overflow-x-auto overflow-y-hidden rounded-lg"
          style={{ 
            scrollBehavior: 'smooth',
            cursor: isDragging ? 'grabbing' : 'grab',
            scrollbarWidth: 'thin',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Timeline Interna com Largura Dinâmica */}
          <div 
            className="relative h-full bg-muted/20 rounded-lg"
            style={{ width: `${totalDays * 100}%`, minWidth: '100%' }}
          >
            {allSegments.length === 0 ? (
              // Se não há quedas, timeline toda verde
              <div className="absolute h-full w-full bg-green-500 rounded-lg" />
            ) : (
              // Segmentos Online/Offline de todos os dias
              allSegments.map((segment, idx) => (
                <Tooltip key={`${segment.dayIndex}-${idx}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "absolute h-full transition-opacity hover:opacity-80",
                        segment.status === 'online' ? 'bg-green-500' : 'bg-destructive'
                      )}
                      style={{
                        left: `${segment.absoluteStartPercent}%`,
                        width: `${segment.widthPercent}%`,
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
            
            {/* Playhead - Marcador de Tempo Atual (apenas visível no dia atual) */}
            {totalDays === 1 || isToday(loadedDays[loadedDays.length - 1].date) && (
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
            )}

            {/* Indicador de carregamento */}
            {isLoading && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full animate-pulse z-50" />
            )}
          </div>
        </div>
        
        {/* Régua de Horários Dinâmica */}
        <div className="relative mt-1.5" style={{ width: `${totalDays * 100}%`, minWidth: '100%' }}>
          {loadedDays.map((day, dayIndex) => (
            <div 
              key={dayIndex}
              className="absolute flex justify-between text-[10px] text-muted-foreground font-mono"
              style={{
                left: `${(dayIndex / totalDays) * 100}%`,
                width: `${(1 / totalDays) * 100}%`,
              }}
            >
              <span>{format(day.date, 'dd/MM')}</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
