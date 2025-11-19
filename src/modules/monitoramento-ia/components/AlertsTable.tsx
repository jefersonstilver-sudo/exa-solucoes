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
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-[#E30613] text-white">ALTA</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-500 text-black">MÉDIA</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-[#2C2C2C] text-white">BAIXA</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 text-xs rounded bg-[#E30613]/20 text-[#E30613]">Aberto</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs rounded bg-[#2C2C2C] text-white/70">Agendado</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-500">Resolvido</span>;
      default:
        return null;
    }
  };

  return (
    <div className="hidden md:block bg-[#0A0A0A] rounded-lg overflow-hidden border border-[#2C2C2C]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#1A1A1A] hover:bg-[#1A1A1A] border-b border-[#2C2C2C]">
            <TableHead className="text-white font-semibold">Painel</TableHead>
            <TableHead className="text-white font-semibold">Condomínio</TableHead>
            <TableHead className="text-white font-semibold">Severidade</TableHead>
            <TableHead className="text-white font-semibold">Status</TableHead>
            <TableHead className="text-white font-semibold">Tempo aberto</TableHead>
            <TableHead className="text-white font-semibold">Última atualização</TableHead>
            <TableHead className="text-white font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow
              key={alert.id}
              className="border-b border-[#1A1A1A] hover:bg-[#E30613]/10 transition-colors cursor-pointer"
              onClick={() => onViewDetails(alert)}
            >
              <TableCell className="font-medium text-white">
                {alert.devices?.name || 'Desconhecido'}
              </TableCell>
              <TableCell className="text-white/70">
                {alert.devices?.condominio_name || 'N/A'}
              </TableCell>
              <TableCell>
                {getSeverityBadge(alert.severity)}
              </TableCell>
              <TableCell>
                {getStatusBadge(alert.status)}
              </TableCell>
              <TableCell className="text-white/70">
                {formatDistanceToNow(new Date(alert.opened_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-white/70">
                {formatDistanceToNow(new Date(alert.created_at), {
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
                  className="text-[#E30613] hover:text-white hover:bg-[#E30613]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
