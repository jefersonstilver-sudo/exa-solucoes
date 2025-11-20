import { Device } from '../utils/devices';
import { humanizeDate } from '../utils/formatters';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

interface PanelCardProps {
  device: Device;
  onClick: () => void;
}

export const PanelCard = ({ device, onClick }: PanelCardProps) => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  const hasCriticalAlert = (device as any).has_critical_alert === true;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  const lastOnline = humanizeDate(device.last_online_at);

  return (
    <div
      onClick={onClick}
      className={`${tc.bgCard} rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border overflow-hidden group ${
        hasCriticalAlert 
          ? 'border-red-600 border-2 animate-pulse shadow-lg shadow-red-200' 
          : tc.border
      }`}
    >
      {/* Corpo do card */}
      <div className="p-6 text-center">
        {/* Número do painel - destaque central */}
        <div className="mb-2">
          <div className={`text-3xl font-bold ${tc.textPrimary} group-hover:text-[#9C1E1E] transition-colors`}>
            {device.name}
          </div>
        </div>

        {/* Nome do prédio */}
        <div className="mb-4">
          <div className={`text-base ${tc.textSecondary} font-medium`}>
            {device.condominio_name}
          </div>
          {device.metadata?.torre && (
            <div className={`text-sm ${tc.textTertiary} mt-1`}>
              Torre {device.metadata.torre}
              {device.metadata?.elevador && ` - Elevador ${device.metadata.elevador}`}
            </div>
          )}
        </div>

        {/* AnyDesk ID */}
        <div className={`mb-4 text-xs ${tc.textTertiary} font-mono`}>
          {device.anydesk_client_id}
        </div>
      </div>

      {/* Rodapé com status */}
      <div className={`${tc.bgInput} px-6 py-3 flex items-center justify-between border-t ${tc.border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
          <span className={`text-sm font-medium ${tc.textSecondary}`}>
            {getStatusLabel(device.status)}
          </span>
        </div>
        <div className={`text-xs ${tc.textTertiary}`}>
          {lastOnline}
        </div>
      </div>
    </div>
  );
};
