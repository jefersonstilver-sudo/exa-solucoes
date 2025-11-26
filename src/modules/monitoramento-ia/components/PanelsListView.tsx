import { Device } from '../utils/devices';
import { humanizeDate } from '../utils/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DevicesSort } from '../utils/devices';

interface PanelsListViewProps {
  devices: Device[];
  sort: DevicesSort;
  onSortChange: (sort: DevicesSort) => void;
  onDeviceClick: (device: Device) => void;
}

export const PanelsListView = ({ devices, sort, onSortChange, onDeviceClick }: PanelsListViewProps) => {
  const handleSort = (field: DevicesSort['field']) => {
    if (sort.field === field) {
      onSortChange({ field, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const SortIcon = ({ field }: { field: DevicesSort['field'] }) => {
    if (sort.field !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sort.order === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary'; label: string }> = {
      online: { variant: 'default', label: 'Online' },
      offline: { variant: 'destructive', label: 'Offline' },
      unknown: { variant: 'secondary', label: 'Desconhecido' },
    };
    const config = variants[status] || variants.unknown;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getProviderColor = (providerName: string) => {
    const upperProvider = providerName?.toUpperCase() || '';
    if (upperProvider.includes('VIVO')) return 'text-purple-600';
    if (upperProvider.includes('LIGGA')) return 'text-orange-600';
    if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-600';
    return 'text-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead 
              onClick={() => handleSort('name')} 
              className="cursor-pointer hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                Nome/Prédio
                <SortIcon field="name" />
              </div>
            </TableHead>
            <TableHead 
              onClick={() => handleSort('status')} 
              className="cursor-pointer hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </TableHead>
            <TableHead className="text-center">Operadora</TableHead>
            <TableHead className="text-center">Nº Quedas</TableHead>
            <TableHead 
              onClick={() => handleSort('last_online_at')} 
              className="cursor-pointer hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                Último Online
                <SortIcon field="last_online_at" />
              </div>
            </TableHead>
            <TableHead className="text-center">AnyDesk ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const displayName = (device.comments || device.name).split(' - ')[0].trim();
            const provider = device.provider || 'Sem provedor';
            
            return (
              <TableRow 
                key={device.id} 
                onClick={() => onDeviceClick(device)}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="text-base font-bold">{displayName}</div>
                    {device.condominio_name && (
                      <div className="text-sm text-muted-foreground">{device.condominio_name}</div>
                    )}
                    {device.metadata?.torre && (
                      <div className="text-xs text-muted-foreground">
                        Torre {device.metadata.torre}
                        {device.metadata?.elevador && ` - Elevador ${device.metadata.elevador}`}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(device.status)}</TableCell>
                <TableCell className="text-center">
                  <span className={`font-semibold ${getProviderColor(provider)}`}>
                    {provider}
                  </span>
                </TableCell>
                <TableCell className="text-center font-bold">
                  {device.total_events || 0}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {humanizeDate(device.last_online_at)}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {device.anydesk_client_id}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
