import React from 'react';
import { Trophy, Clock, Calendar, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFullUptimeMode, formatUptimeDuration } from '@/hooks/useFullUptimeMode';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FullUptimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FullUptimeModal: React.FC<FullUptimeModalProps> = ({
  open,
  onOpenChange
}) => {
  const { 
    isFullUptime, 
    currentDuration, 
    currentStartedAt,
    record, 
    history, 
    totalDevices,
    onlineDevices 
  } = useFullUptimeMode();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            Modo 100% Ativo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className={`rounded-xl p-4 ${isFullUptime ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isFullUptime ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-medium text-sm">
                  {isFullUptime ? 'Ativo agora' : 'Não ativo'}
                </span>
              </div>
              <Badge variant={isFullUptime ? 'default' : 'secondary'} className={isFullUptime ? 'bg-emerald-500' : ''}>
                {onlineDevices}/{totalDevices} online
              </Badge>
            </div>

            {isFullUptime && currentStartedAt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Tempo atual:
                  </span>
                  <span className="font-mono font-bold text-lg text-emerald-700">
                    {formatUptimeDuration(currentDuration)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Iniciado em:</span>
                  <span>{format(currentStartedAt, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                </div>
              </div>
            )}

            {!isFullUptime && (
              <p className="text-sm text-gray-500">
                Há dispositivos offline. O modo 100% ativo será iniciado quando todos estiverem online.
              </p>
            )}
          </div>

          {/* Record */}
          {record && (
            <div className="rounded-xl p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-amber-800">Recorde</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xl text-amber-700">
                  {formatUptimeDuration(record.duration_seconds)}
                </span>
                <span className="text-xs text-amber-600">
                  {format(new Date(record.started_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              Histórico de períodos
            </h4>
            
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum período registrado ainda
                  </p>
                ) : (
                  history.map((period, index) => (
                    <div
                      key={period.id}
                      className={`p-3 rounded-lg border ${
                        period.is_current 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {period.is_current ? (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                          )}
                          <span className="font-mono font-semibold text-sm">
                            {formatUptimeDuration(period.is_current ? currentDuration : period.duration_seconds)}
                          </span>
                          {index === 0 && !period.is_current && record?.id === period.id && (
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        {period.is_current && (
                          <Badge className="bg-emerald-500 text-[10px]">Em andamento</Badge>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-gray-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Início:</span>
                          <span>{format(new Date(period.started_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</span>
                        </div>
                        {period.ended_at && (
                          <>
                            <div className="flex justify-between">
                              <span>Fim:</span>
                              <span>{format(new Date(period.ended_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</span>
                            </div>
                            {period.ended_by_device_name && (
                              <div className="flex justify-between text-red-500">
                                <span>Interrompido por:</span>
                                <span>{period.ended_by_device_name}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <div className="flex gap-2 text-xs text-blue-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Regra:</strong> Quedas menores que 10 minutos não interrompem o modo 100% ativo.
                Apenas quedas ≥10 minutos são consideradas significativas.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
