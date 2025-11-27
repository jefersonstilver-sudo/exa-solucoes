import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TooltipData {
  panelCode: string;
  condominiumName: string;
  status: 'online' | 'offline';
  startTime: Date;
  endTime?: Date;
  duration: number;
}

interface RichTimelineTooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number };
  onViewDetails?: () => void;
  onDismiss?: () => void;
}

export const RichTimelineTooltip = ({ 
  data, 
  position, 
  onViewDetails, 
  onDismiss 
}: RichTimelineTooltipProps) => {
  if (!data) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50 pointer-events-auto"
        style={{ 
          left: position.x + 10, 
          top: position.y - 10,
          maxWidth: '320px'
        }}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`px-4 py-3 border-b border-border/30 ${
            data.status === 'offline' 
              ? 'bg-destructive/10 border-destructive/20' 
              : 'bg-primary/10 border-primary/20'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${
                data.status === 'offline' ? 'text-destructive' : 'text-primary'
              }`} />
              <div className="flex-1">
                <div className="font-semibold text-sm">{data.panelCode}</div>
                <div className="text-xs text-muted-foreground">{data.condominiumName}</div>
              </div>
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                data.status === 'offline'
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-primary/20 text-primary'
              }`}>
                {data.status === 'offline' ? 'Offline' : 'Online'}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">Início</div>
                <div className="font-medium">
                  {format(data.startTime, 'HH:mm:ss', { locale: ptBR })}
                </div>
              </div>
              {data.endTime && (
                <div>
                  <div className="text-muted-foreground mb-0.5">Fim</div>
                  <div className="font-medium">
                    {format(data.endTime, 'HH:mm:ss', { locale: ptBR })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-1">
              <div className="text-muted-foreground text-xs mb-0.5">Duração</div>
              <div className="font-semibold text-sm">{formatDuration(data.duration)}</div>
            </div>
          </div>

          {/* Actions */}
          {(onViewDetails || onDismiss) && (
            <div className="px-3 py-2 bg-muted/30 border-t border-border/30 flex gap-2">
              {onViewDetails && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="flex-1 h-7 text-xs"
                  onClick={onViewDetails}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver detalhes
                </Button>
              )}
              {onDismiss && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs"
                  onClick={onDismiss}
                >
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
