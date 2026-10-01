import { useMemo, useState } from 'react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOpenOfflineEvents } from '../hooks/useOpenOfflineEvents';
import type { ProviderConnection } from '../hooks/useProviderConnectionStats';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: ProviderConnection[];
  updatedAt: number;
}

function validDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ProviderConnectionsDialog({ open, onOpenChange, connections, updatedAt }: Props) {
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('all');
  const [order, setOrder] = useState('offline');
  const offlineIds = useMemo(() => connections.filter(d => d.status === 'offline').map(d => d.id), [connections]);
  const { data: openEvents, isLoading: eventsLoading, isError: eventsError } = useOpenOfflineEvents(offlineIds, open);
  const providerNames = useMemo(() => Array.from(new Set(connections.map(d => d.provider))).sort(), [connections]);

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const priority = (status: string | null) => status === 'offline' ? (order === 'offline' ? 0 : 1) : status === 'online' ? (order === 'online' ? 0 : 1) : 2;
    return connections.filter(d =>
      (provider === 'all' || d.provider === provider) &&
      (!query || [d.building, d.name, d.address || '', d.provider].some(text => text.toLocaleLowerCase('pt-BR').includes(query)))
    ).sort((a, b) => {
      const statusDifference = priority(a.status) - priority(b.status);
      if (statusDifference) return statusDifference;
      if (a.status === 'offline' && b.status === 'offline') {
        const aSince = validDate(openEvents?.get(a.id));
        const bSince = validDate(openEvents?.get(b.id));
        if (aSince && bSince && aSince.getTime() !== bSince.getTime()) return aSince.getTime() - bSince.getTime();
        if (aSince && !bSince) return -1;
        if (!aSince && bSince) return 1;
      }
      return a.building.localeCompare(b.building, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [connections, search, provider, order, openEvents]);

  const statusLabel = (status: string | null) => status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Desconhecido';
  const offlineText = (device: ProviderConnection) => {
    if (device.status !== 'offline') return '—';
    if (eventsLoading) return 'Consultando queda...';
    const lastOnline = validDate(device.lastOnlineAt);
    const started = eventsError ? null : validDate(openEvents?.get(device.id));
    // An open event older than the last online observation belongs to a prior outage.
    if (started && (!lastOnline || started >= lastOnline)) {
      return `Desde ${format(started, 'dd/MM/yyyy HH:mm')} · há ${formatDistanceToNowStrict(started, { locale: ptBR })}`;
    }
    return lastOnline ? `Última vez online: ${format(lastOnline, 'dd/MM/yyyy HH:mm')}` : 'Horário indisponível';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-h-[90dvh] flex flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>Conexões por operadora</DialogTitle>
          <DialogDescription>
            {connections.length} conexões cadastradas{updatedAt ? ` · Atualizado às ${format(new Date(updatedAt), 'HH:mm:ss')}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Input aria-label="Buscar prédio ou endereço" placeholder="Buscar prédio ou endereço" value={search} onChange={event => setSearch(event.target.value)} className="sm:flex-1" />
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger aria-label="Filtrar operadora" className="w-full sm:w-48"><SelectValue placeholder="Operadora" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas as operadoras</SelectItem>{providerNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={order} onValueChange={setOrder}>
            <SelectTrigger aria-label="Ordenar por status" className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="offline">Offline primeiro</SelectItem><SelectItem value="online">Online primeiro</SelectItem></SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground shrink-0">{rows.length} conexões exibidas</p>
        <div className="overflow-auto min-h-0 flex-1 border border-border rounded-md">
          <Table className="min-w-[760px]">
            <TableHeader className="sticky top-0 bg-background z-10"><TableRow>
              <TableHead>Prédio / conexão</TableHead><TableHead>Endereço físico</TableHead><TableHead>Operadora</TableHead><TableHead>Status</TableHead><TableHead>Queda / última conexão</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(device => <TableRow key={device.id}>
                <TableCell className="font-medium"><span className="block">{device.building}</span><span className="text-xs text-muted-foreground">{device.name !== device.building ? device.name : `Conexão ${device.id.slice(0, 8)}`}</span></TableCell>
                <TableCell className="max-w-64 whitespace-normal">{device.address && device.address !== 'Sem endereço' ? device.address : 'Endereço não informado'}</TableCell>
                <TableCell>{device.provider}</TableCell>
                <TableCell><Badge variant={device.status === 'offline' ? 'destructive' : device.status === 'online' ? 'default' : 'secondary'}>{statusLabel(device.status)}</Badge></TableCell>
                <TableCell className="whitespace-nowrap text-xs">{offlineText(device)}</TableCell>
              </TableRow>)}
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma conexão encontrada.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}