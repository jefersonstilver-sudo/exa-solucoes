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

  return (
    <div className="hidden md:block bg-module-card rounded-xl overflow-hidden border border-module">
      <Table>
        <TableHeader>
          <TableRow className="bg-module-input hover:bg-module-input border-b border-module">
            <TableHead className="text-module-primary font-semibold">Painel</TableHead>
            <TableHead className="text-module-primary font-semibold">Condomínio</TableHead>
            <TableHead className="text-module-primary font-semibold">Severidade</TableHead>
            <TableHead className="text-module-primary font-semibold">Status</TableHead>
            <TableHead className="text-module-primary font-semibold">Tempo aberto</TableHead>
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
                {alert.devices?.name || 'Desconhecido'}
              </TableCell>
              <TableCell className="text-module-secondary">
                {alert.devices?.condominio_name || 'N/A'}
              </TableCell>
              <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
              <TableCell>{getStatusBadge(alert.status)}</TableCell>
              <TableCell className="text-module-secondary">
                {formatDistanceToNow(new Date(alert.opened_at), {
                  addSuffix: true,
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
  );
};