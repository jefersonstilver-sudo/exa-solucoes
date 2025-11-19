/**
 * Component: PanelsTable
 * Tabela desktop de painéis com sorting e actions
 */

import { Device } from '../utils/devices';
import { formatUptime, formatTemperature, humanizeDate } from '../utils/formatters';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import { Eye, Calendar } from 'lucide-react';

interface PanelsTableProps {
  devices: Device[];
  onViewDetails: (device: Device) => void;
  onSchedule?: (device: Device) => void;
}

export const PanelsTable = ({ devices, onViewDetails, onSchedule }: PanelsTableProps) => {
  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.unknown;
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || STATUS_LABELS.unknown;
  };

  if (devices.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <p className="text-muted-foreground">Nenhum painel encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Painel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Condomínio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Torre/Elevador
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Último Online
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Temp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Uptime
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {devices.map((device) => (
              <tr
                key={device.id}
                className="hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onViewDetails(device)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {device.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {device.anydesk_client_id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground">
                    {device.condominio_name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {device.metadata?.torre && device.metadata?.elevador
                      ? `Torre ${device.metadata.torre} - Elev. ${device.metadata.elevador}`
                      : device.metadata?.torre
                      ? `Torre ${device.metadata.torre}`
                      : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                    <span className="text-sm font-medium text-foreground">
                      {getStatusLabel(device.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {humanizeDate(device.last_online_at)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatTemperature(device.metadata?.temperature)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatUptime(device.metadata?.uptime)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(device);
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onSchedule && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSchedule(device);
                        }}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Agendar manutenção"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
