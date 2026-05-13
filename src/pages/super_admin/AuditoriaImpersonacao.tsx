import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Loader2, Search, ShieldAlert, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionRow {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  target_pedido_id: string | null;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  end_reason: string | null;
  admin_email?: string | null;
  target_email?: string | null;
}

interface ActionRow {
  id: string;
  session_id: string;
  admin_user_id: string;
  target_user_id: string;
  pedido_id: string | null;
  action: string;
  entity_id: string | null;
  payload: any;
  created_at: string;
}

const ACTIONS = ['view', 'upload_video', 'delete_video', 'purge_pedido', 'approve_video', 'edit_qr', 'edit_schedule'];

const AuditoriaImpersonacao: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [adminFilter, setAdminFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let q: any = (supabase as any)
        .from('admin_impersonation_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(500);
      if (from) q = q.gte('started_at', new Date(from).toISOString());
      if (to) q = q.lte('started_at', new Date(to).toISOString());
      const { data, error } = await q;
      if (error) throw error;

      const rows = (data || []) as SessionRow[];

      // Hydrate emails
      const ids = Array.from(new Set([...rows.map(r => r.admin_user_id), ...rows.map(r => r.target_user_id)])).filter(Boolean);
      if (ids.length) {
        const { data: profiles } = await (supabase as any)
          .from('profiles')
          .select('user_id, email, nome')
          .in('user_id', ids);
        const map = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]));
        rows.forEach(r => {
          r.admin_email = map.get(r.admin_user_id)?.email || null;
          r.target_email = map.get(r.target_user_id)?.email || map.get(r.target_user_id)?.nome || null;
        });
      }
      setSessions(rows);
    } catch (e) {
      console.error('fetchSessions error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (adminFilter && !(s.admin_email || '').toLowerCase().includes(adminFilter.toLowerCase())) return false;
      if (targetFilter && !(s.target_email || '').toLowerCase().includes(targetFilter.toLowerCase())) return false;
      return true;
    });
  }, [sessions, adminFilter, targetFilter]);

  const openDetails = async (s: SessionRow) => {
    setOpenSession(s);
    setActionsLoading(true);
    try {
      let q: any = (supabase as any)
        .from('admin_impersonation_actions')
        .select('*')
        .eq('session_id', s.id)
        .order('created_at', { ascending: true });
      if (actionFilter !== 'all') q = q.eq('action', actionFilter);
      const { data, error } = await q;
      if (error) throw error;
      setActions((data || []) as ActionRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setActionsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-[#C7141A]" />
        <h1 className="text-2xl font-bold">Auditoria de Impersonação</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Admin (email)" className="pl-8" value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)} />
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cliente (email)" className="pl-8" value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          <div className="flex gap-2">
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button variant="secondary" onClick={fetchSessions} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Sessões ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Cliente impersonado</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const ended = !!s.ended_at;
                  return (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(s)}>
                      <TableCell className="text-xs">
                        {format(new Date(s.started_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">{s.admin_email || s.admin_user_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{s.target_email || s.target_user_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs font-mono">{s.target_pedido_id?.slice(0, 8) || '—'}</TableCell>
                      <TableCell>
                        {ended ? (
                          <Badge variant="outline">{s.end_reason || 'encerrada'}</Badge>
                        ) : (
                          <Badge className="bg-[#C7141A] text-white">ativa</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">Ver ações</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma sessão encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!openSession} onOpenChange={(v) => !v && setOpenSession(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Linha do tempo da sessão</SheetTitle>
          </SheetHeader>
          {openSession && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                <div><b>Admin:</b> {openSession.admin_email || openSession.admin_user_id}</div>
                <div><b>Cliente:</b> {openSession.target_email || openSession.target_user_id}</div>
                <div><b>Início:</b> {format(new Date(openSession.started_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}</div>
                <div><b>Expira em:</b> {format(new Date(openSession.expires_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}</div>
                {openSession.ended_at && (
                  <div><b>Encerrada:</b> {format(new Date(openSession.ended_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })} ({openSession.end_reason})</div>
                )}
              </div>
              <div className="border-t pt-3">
                {actionsLoading ? (
                  <div className="flex items-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando ações…</div>
                ) : actions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma ação registrada.</div>
                ) : (
                  <ol className="space-y-3">
                    {actions.map(a => (
                      <li key={a.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono text-xs">{a.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(a.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                        {a.entity_id && (
                          <div className="text-xs mt-1"><b>Entidade:</b> <span className="font-mono">{a.entity_id}</span></div>
                        )}
                        {a.pedido_id && (
                          <div className="text-xs"><b>Pedido:</b> <span className="font-mono">{a.pedido_id}</span></div>
                        )}
                        {a.payload && (
                          <pre className="mt-2 text-[10px] bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(a.payload, null, 2)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AuditoriaImpersonacao;
