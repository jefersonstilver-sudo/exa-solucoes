/**
 * Component: ExportCsvButton
 * Botão para exportar dados filtrados/ordenados para CSV
 */

import { Download } from 'lucide-react';
import { Device } from '../utils/devices';
import { formatUptime, formatTemperature, humanizeDate } from '../utils/formatters';
import { toast } from 'sonner';

interface ExportCsvButtonProps {
  devices: Device[];
  filename?: string;
}

export const ExportCsvButton = ({ devices, filename = 'paineis-export' }: ExportCsvButtonProps) => {
  const handleExport = () => {
    if (devices.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    try {
      // Preparar dados CSV
      const headers = [
        'Painel',
        'AnyDesk ID',
        'Condomínio',
        'Torre',
        'Elevador',
        'Status',
        'Último Online',
        'Temperatura',
        'Uptime',
        'IP',
        'OS',
      ];

      const rows = devices.map(device => [
        device.name,
        device.anydesk_client_id,
        device.condominio_name,
        device.metadata?.torre || '-',
        device.metadata?.elevador || '-',
        device.status,
        humanizeDate(device.last_online_at),
        formatTemperature(device.metadata?.temperature),
        formatUptime(device.metadata?.uptime),
        device.metadata?.ip_address || '-',
        device.metadata?.os_info || '-',
      ]);

      // Criar CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Exportar CSV</span>
    </button>
  );
};
