import React, { useState } from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useBuildingOutageHistory } from '@/hooks/useBuildingDeviceStatus';
import { cn } from '@/lib/utils';

interface BuildingOutageHistoryProps {
  deviceId: string | null;
  children: React.ReactNode;
}

type Period = 'today' | '7days' | '30days' | 'custom';

const BuildingOutageHistory: React.FC<BuildingOutageHistoryProps> = ({ deviceId, children }) => {
  const [period, setPeriod] = useState<Period>('today');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  const { outages, count, isLoading } = useBuildingOutageHistory(
    deviceId,
    period,
    customStartDate,
    customEndDate
  );

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Em andamento';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Hoje';
      case '7days': return '7 dias';
      case '30days': return '30 dias';
      case 'custom': return 'Personalizado';
    }
  };

  if (!deviceId) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="text-center text-gray-500 py-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Painel não conectado</p>
            <p className="text-xs mt-1">Vincule um dispositivo para ver o histórico</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b bg-gray-50/80">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h4 className="font-semibold text-sm text-gray-900">Histórico de Quedas</h4>
          </div>

          {/* Period Filters */}
          <div className="flex gap-1 flex-wrap">
            {(['today', '7days', '30days', 'custom'] as Period[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                className={cn(
                  "h-7 text-xs px-2",
                  period === p && "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => {
                  setPeriod(p);
                  if (p === 'custom') setShowCalendar(true);
                }}
              >
                {p === 'today' && 'Hoje'}
                {p === '7days' && '7 dias'}
                {p === '30days' && '30 dias'}
                {p === 'custom' && 'Personalizado'}
              </Button>
            ))}
          </div>

          {period === 'custom' && showCalendar && (
            <div className="mt-2 p-2 bg-white rounded border">
              <CalendarComponent
                mode="range"
                selected={{ from: customStartDate, to: customEndDate }}
                onSelect={(range) => {
                  setCustomStartDate(range?.from);
                  setCustomEndDate(range?.to);
                  if (range?.from && range?.to) {
                    setShowCalendar(false);
                  }
                }}
                locale={ptBR}
                className="text-xs"
              />
            </div>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Carregando...
            </div>
          ) : count === 0 ? (
            <div className="p-4 text-center">
              <div className="text-green-600 font-medium text-sm">✅ Sem quedas</div>
              <p className="text-xs text-gray-500 mt-1">{getPeriodLabel()}</p>
            </div>
          ) : (
            <div className="divide-y">
              {outages.map((outage) => (
                <div key={outage.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700 font-medium">
                          {format(new Date(outage.startedAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-red-600 font-medium">
                          {formatDuration(outage.durationSeconds)}
                        </span>
                        {!outage.endedAt && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            Em andamento
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {count > 0 && (
          <div className="p-2 border-t bg-gray-50 text-center">
            <span className="text-xs text-gray-500">
              {count} {count === 1 ? 'queda' : 'quedas'} • {getPeriodLabel()}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default BuildingOutageHistory;
