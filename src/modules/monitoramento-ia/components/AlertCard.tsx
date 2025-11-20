import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Clock } from 'lucide-react';
import type { DeviceAlert } from '../utils/alerts';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

interface AlertCardProps {
  alert: DeviceAlert;
  onClick: () => void;
}

export const AlertCard = ({ alert, onClick }: AlertCardProps) => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-[#9C1E1E] bg-[#9C1E1E]/5';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/5';
      case 'low':
        return `${tc.border} ${tc.bgInput}`;
      default:
        return tc.border;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-[#9C1E1E] text-white">ALTA</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-black">MÉDIA</span>;
      case 'low':
        return <span className={`px-2 py-1 text-xs font-semibold rounded ${tc.bgInput} ${tc.textPrimary}`}>BAIXA</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs rounded bg-[#9C1E1E]/20 text-[#9C1E1E]">Aberto</span>;
      case 'scheduled':
        return <span className={`px-2 py-1 text-xs rounded ${tc.bgInput} ${tc.textSecondary}`}>Agendado</span>;
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
        relative ${tc.bgCard} rounded-lg p-4 cursor-pointer
        border-l-4 ${getSeverityColor(alert.severity)}
        ${tc.bgHover} transition-all duration-300
        ${isCritical ? 'animate-pulse' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${tc.textPrimary} mb-1`}>
            {alert.devices?.name || 'Painel desconhecido'}
          </h3>
          <p className={`text-sm ${tc.textSecondary}`}>
            {alert.devices?.condominio_name || 'Condomínio não especificado'}
          </p>
        </div>
        <AlertCircle className={`w-5 h-5 ${isCritical ? 'text-[#9C1E1E]' : tc.textMuted}`} />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        {getSeverityBadge(alert.severity)}
        {getStatusBadge(alert.status)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className={`flex items-center gap-2 ${tc.textTertiary}`}>
          <Clock className="w-4 h-4" />
          <span>{timeOpen}</span>
        </div>
        <button className="text-[#9C1E1E] hover:text-[#9C1E1E]/80 font-medium">
          Ver detalhes →
        </button>
      </div>

      {/* Alert Type */}
      <div className={`mt-2 text-xs ${tc.textMuted}`}>
        Tipo: {alert.alert_type}
      </div>
    </div>
  );
};