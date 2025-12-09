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
  periodEventsMap?: Map<string, number>;
  periodLabel?: string;
}

export const PanelsListView = ({ 
  devices, 
  sort, 
  onSortChange, 
  onDeviceClick,
  periodEventsMap,
  periodLabel = 'hoje'
}: PanelsListViewProps) => {
  const handleSort = (field: DevicesSort['field']) => {
    if (sort.field === field) {
      onSortChange({ field, order: sort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, order: 'desc' });
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

  // Get period events count for a device
  const getPeriodEventsCount = (deviceId: string) => {
    return periodEventsMap?.get(deviceId) || 0;
  };

  return (
    <>
      {/* Desktop: Tabela completa */}
      <div className="hidden lg:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
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
              <TableHead 
                onClick={() => handleSort('offline_count')} 
                className="cursor-pointer hover:bg-muted/70 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  Quedas {periodLabel}
                  <SortIcon field="offline_count" />
                </div>
              </TableHead>
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
              const periodEvents = getPeriodEventsCount(device.id);
              
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
                    <span className={periodEvents > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                      {periodEvents}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {humanizeDate(device.last_online_at)}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {device.anydesk_client_id ? (
                      <a 
                        href={`anydesk:${device.anydesk_client_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        title="Clique para conectar via AnyDesk"
                      >
                        {device.anydesk_client_id}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Lista de cards compactos */}
      <div className="lg:hidden space-y-2">
        {devices.map((device) => {
          const displayName = (device.comments || device.name).split(' - ')[0].trim();
          const provider = device.provider || 'Sem provedor';
          const periodEvents = getPeriodEventsCount(device.id);
          const statusConfig = (() => {
            const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary'; label: string }> = {
              online: { variant: 'default', label: 'Online' },
              offline: { variant: 'destructive', label: 'Offline' },
              unknown: { variant: 'secondary', label: 'Desconhecido' },
            };
            return variants[device.status] || variants.unknown;
          })();
          
          return (
            <div
              key={device.id}
              onClick={() => onDeviceClick(device)}
              className="bg-card border border-border rounded-lg p-3 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
            >
              {/* Header: Nome + Badge Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    {displayName}
                  </h3>
                  {device.condominio_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {device.condominio_name}
                    </p>
                  )}
                </div>
                <Badge variant={statusConfig.variant} className="text-xs shrink-0">
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Grid de infos */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Operadora</p>
                  <p className={`font-semibold truncate ${getProviderColor(provider)}`}>
                    {provider}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quedas {periodLabel}</p>
                  <p className={`font-bold ${periodEvents > 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {periodEvents}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Último Online</p>
                  <p className="text-foreground truncate">
                    {humanizeDate(device.last_online_at)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">AnyDesk</p>
                  {device.anydesk_client_id ? (
                    <a 
                      href={`anydesk:${device.anydesk_client_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-primary hover:underline truncate block"
                      title="Conectar via AnyDesk"
                    >
                      {device.anydesk_client_id}
                    </a>
                  ) : (
                    <span className="font-mono text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
