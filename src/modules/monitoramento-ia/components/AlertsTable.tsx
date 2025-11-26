import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DeviceAlert } from '../utils/alerts';

interface AlertsTableProps {
  alerts: DeviceAlert[];
  onViewDetails: (alert: DeviceAlert) => void;
}

export const AlertsTable = ({ alerts, onViewDetails }: AlertsTableProps) => {
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

  const getProviderBadge = (provider?: string) => {
    const prov = provider || 'AnyDesk';
    const colors: Record<string, string> = {
      'AnyDesk': 'bg-blue-500/20 text-blue-500',
      'String': 'bg-purple-500/20 text-purple-500',
      'Manual': 'bg-gray-500/20 text-gray-500'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[prov] || colors['Manual']}`}>
        {prov}
      </span>
    );
  };

  const getAlertTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'offline': 'Offline',
      'connection_lost': 'Conexão Perdida',
      'high_temperature': 'Alta Temperatura',
      'disk_full': 'Disco Cheio',
      'manual': 'Manual'
    };
    return types[type] || type;
  };

  return (
    <div className="bg-module-card rounded-xl overflow-hidden border border-module">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-module-input hover:bg-module-input border-b border-module">
              <TableHead className="text-module-primary font-semibold">Painel</TableHead>
              <TableHead className="text-module-primary font-semibold">Condomínio</TableHead>
              <TableHead className="text-module-primary font-semibold">Torre</TableHead>
              <TableHead className="text-module-primary font-semibold">Tipo</TableHead>
              <TableHead className="text-module-primary font-semibold">Provedor</TableHead>
              <TableHead className="text-module-primary font-semibold">Severidade</TableHead>
              <TableHead className="text-module-primary font-semibold">Status</TableHead>
              <TableHead className="text-module-primary font-semibold">Aberto em</TableHead>
              <TableHead className="text-module-primary font-semibold">Fechado em</TableHead>
              <TableHead className="text-module-primary font-semibold">Tempo</TableHead>
              <TableHead className="text-module-primary font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow
                key={alert.id}
                className="border-module border-b hover:bg-module-hover transition-colors cursor-pointer"
                onClick={() => onViewDetails(alert)}
              >
                <TableCell className="font-medium text-module-primary">
                  <div className="flex flex-col">
                    <span>{alert.devices?.name || 'Desconhecido'}</span>
                    {alert.devices?.comments && (
                      <span className="text-xs text-module-tertiary">{alert.devices.comments.split(' - ')[0]}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-module-secondary text-sm">
                  {alert.devices?.condominio_name || 'N/A'}
                </TableCell>
                <TableCell className="text-module-secondary text-sm">
                  {alert.devices?.comments?.split('-')[1]?.trim() || '-'}
                </TableCell>
                <TableCell className="text-module-secondary text-sm">
                  {getAlertTypeLabel(alert.alert_type)}
                </TableCell>
                <TableCell>{getProviderBadge(alert.provider)}</TableCell>
                <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                <TableCell>{getStatusBadge(alert.status)}</TableCell>
                <TableCell className="text-module-secondary text-xs">
                  {new Date(alert.opened_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="text-module-secondary text-xs">
                  {alert.closed_at ? (
                    new Date(alert.closed_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ) : (
                    <span className="text-module-muted">Em andamento</span>
                  )}
                </TableCell>
                <TableCell className="text-module-secondary text-xs">
                  {formatDistanceToNow(new Date(alert.opened_at), {
                    addSuffix: false,
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(alert);
                    }}
                    className="hover:bg-module-hover"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};