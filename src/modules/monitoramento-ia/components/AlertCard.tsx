import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Clock } from 'lucide-react';
import type { DeviceAlert } from '../utils/alerts';

interface AlertCardProps {
  alert: DeviceAlert;
  onClick: () => void;
}

export const AlertCard = ({ alert, onClick }: AlertCardProps) => {
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-[#9C1E1E] bg-[#9C1E1E]/5';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/5';
      case 'low':
        return 'border-module bg-module-input';
      default:
        return 'border-module';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-[#9C1E1E] text-white">ALTA</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-black">MÉDIA</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-module-input text-module-primary">BAIXA</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs rounded bg-[#9C1E1E]/20 text-[#9C1E1E]">Aberto</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs rounded bg-module-input text-module-secondary">Agendado</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-500">Resolvido</span>;
      default:
        return null;
    }
  };

  const timeOpen = formatDistanceToNow(new Date(alert.opened_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const isCritical = alert.severity === 'high';

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md
        rounded-xl lg:rounded-2xl p-4 cursor-pointer
        border-l-4 ${getSeverityColor(alert.severity)}
        border border-white/20 dark:border-white/10
        shadow-lg hover:shadow-xl
        hover:bg-white/70 dark:hover:bg-neutral-900/50
        hover:scale-[1.02] hover:-translate-y-1
        transition-all duration-300
        ${isCritical ? 'animate-pulse' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base lg:text-lg font-bold text-foreground mb-1 group-hover:text-[#9C1E1E] transition-colors">
            {alert.devices?.name || 'Painel desconhecido'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {alert.devices?.condominio_name || 'Condomínio não especificado'}
          </p>
        </div>
        <AlertCircle className={`w-5 h-5 ${isCritical ? 'text-[#9C1E1E]' : 'text-muted-foreground'}`} />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {getSeverityBadge(alert.severity)}
        {getStatusBadge(alert.status)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-xs lg:text-sm">{timeOpen}</span>
        </div>
        <button className="text-[#9C1E1E] hover:text-[#9C1E1E]/80 font-medium text-xs lg:text-sm transition-colors">
          Ver detalhes →
        </button>
      </div>

      {/* Time and Type */}
      <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1">
        <div className="text-muted-foreground font-medium">
          Tipo: <span className="text-foreground">{alert.alert_type}</span>
        </div>
        {alert.opened_at && (
          <div className="text-muted-foreground">
            Aberto: {new Date(alert.opened_at).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {alert.closed_at && (
              <> • Fechado: {new Date(alert.closed_at).toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
};