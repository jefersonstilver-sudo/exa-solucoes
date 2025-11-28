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
    <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="text-foreground font-semibold text-xs md:text-sm">Painel</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm hidden lg:table-cell">Condomínio</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm hidden xl:table-cell">Torre</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm">Tipo</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm hidden md:table-cell">Provedor</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm">Severidade</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm">Status</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm hidden lg:table-cell">Aberto em</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm hidden xl:table-cell">Fechado em</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm hidden md:table-cell">Tempo</TableHead>
              <TableHead className="text-foreground font-semibold text-xs md:text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow
                key={alert.id}
                className="border-border border-b hover:bg-accent/50 transition-all cursor-pointer group"
                onClick={() => onViewDetails(alert)}
              >
                <TableCell className="font-medium text-foreground text-xs md:text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{alert.devices?.name || 'Desconhecido'}</span>
                    {alert.devices?.comments && (
                      <span className="text-xs text-muted-foreground lg:hidden">{alert.devices.comments.split(' - ')[0]}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs md:text-sm hidden lg:table-cell">
                  {alert.devices?.condominio_name || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs md:text-sm hidden xl:table-cell">
                  {alert.devices?.comments?.split('-')[1]?.trim() || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs md:text-sm">
                  {getAlertTypeLabel(alert.alert_type)}
                </TableCell>
                <TableCell className="hidden md:table-cell">{getProviderBadge(alert.provider)}</TableCell>
                <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                <TableCell>{getStatusBadge(alert.status)}</TableCell>
                <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">
                  {new Date(alert.opened_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs hidden xl:table-cell">
                  {alert.closed_at ? (
                    new Date(alert.closed_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ) : (
                    <span className="text-muted-foreground">Em andamento</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
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
                    className="hover:bg-accent h-8 w-8 p-0 md:h-9 md:w-9"
                  >
                    <Eye className="w-3 h-3 md:w-4 md:h-4" />
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