/**
 * SyncHealthDialog
 * Painel de Saúde de Sincronia AnyDesk ↔ DB.
 * Mostra:
 *  - Devices stale (no DB mas ausentes da API)
 *  - Devices órfãos (sem building_id)
 *  - Timestamp do último evento de sync (events_log: stale_detected/stale_recovered)
 *
 * Apenas visualização — nenhuma alteração de dados.
 */

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Activity, AlertTriangle, Ghost, RefreshCw, Unlink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DeviceRow {
  id: string;
  name: string | null;
  anydesk_client_id: string | null;
  status: string | null;
  last_online_at: string | null;
  building_id: string | null;
  metadata: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncHealthDialog({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState<DeviceRow[]>([]);
  const [orphans, setOrphans] = useState<DeviceRow[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [forcing, setForcing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: devices, error } = await supabase
        .from('devices')
        .select('id, name, anydesk_client_id, status, last_online_at, building_id, metadata')
        .eq('is_deleted', false);

      if (error) throw error;

      const all = (devices || []) as DeviceRow[];
      setStale(all.filter(d => (d.metadata as any)?.stale === true));
      setOrphans(all.filter(d => !d.building_id));

      // Último parsed_at registrado
      const lastParsed = all
        .map(d => (d.metadata as any)?.parsed_at as string | undefined)
        .filter(Boolean)
        .sort()
        .pop();
      setLastSyncAt(lastParsed || null);
    } catch (e: any) {
      console.error('[SyncHealth] load error', e);
      toast.error('Erro ao carregar saúde de sincronia');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleForceSync = async () => {
    setForcing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-anydesk', {
        body: { force: true, triggered_by: 'sync_health_dialog' },
      });
      if (error) throw error;
      toast.success('Sincronização forçada concluída');
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error('Falha ao forçar sync');
    } finally {
      setForcing(false);
    }
  };

  const formatRelative = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return formatDistanceToNow(new Date(iso), { locale: ptBR, addSuffix: true });
    } catch {
      return iso;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Saúde de Sincronia AnyDesk
          </DialogTitle>
          <DialogDescription>
            Painéis fora de eixo entre o banco e a API. Nada é deletado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 py-2 border-y">
          <div className="text-sm text-muted-foreground">
            Último sync detectado: <span className="font-medium text-foreground">{formatRelative(lastSyncAt)}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={handleForceSync} disabled={forcing}>
              <RefreshCw className={`w-4 h-4 mr-1 ${forcing ? 'animate-spin' : ''}`} />
              Forçar Sync
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {/* Stale */}
          <section className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Ghost className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold">Sem resposta da API (stale)</h3>
              <Badge variant="secondary">{stale.length}</Badge>
            </div>
            {stale.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum painel stale. Tudo sincronizado.</p>
            ) : (
              <div className="space-y-2">
                {stale.map(d => {
                  const since = (d.metadata as any)?.stale_since || d.last_online_at;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-amber-500/30 bg-amber-500/5"
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{d.name || 'Sem nome'}</div>
                        <div className="text-xs text-muted-foreground">
                          AnyDesk ID: {d.anydesk_client_id || '—'} · sem resposta {formatRelative(since)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-500/40">
                        offline (stale)
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Orphans */}
          <section className="py-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Unlink className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold">Sem prédio vinculado</h3>
              <Badge variant="secondary">{orphans.length}</Badge>
            </div>
            {orphans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os painéis estão vinculados a prédios.</p>
            ) : (
              <div className="space-y-2">
                {orphans.map(d => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border bg-muted/30"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.name || 'Sem nome'}</div>
                      <div className="text-xs text-muted-foreground">
                        AnyDesk ID: {d.anydesk_client_id || '—'} · status: {d.status || 'unknown'}
                      </div>
                    </div>
                    <Badge variant="outline">órfão</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="py-3 border-t">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>
                Painéis stale ou órfãos permanecem no sistema para auditoria. Apenas o administrador
                pode arquivar manualmente. O sync automático limpa o estado stale assim que o painel
                volta a aparecer na API.
              </p>
            </div>
          </section>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
