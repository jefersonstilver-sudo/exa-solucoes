import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, UserPlus, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AddCollaboratorDialog } from './components/AddCollaboratorDialog';
import { CollaboratorCard, type CollaboratorRow } from './components/CollaboratorCard';
import { toast } from 'sonner';

const callEvolution = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown,
) => {
  const { data, error } = await supabase.functions.invoke('evolution-proxy', {
    body: { path, method, body },
  });
  if (error) throw new Error(error.message);
  return data as { status: number; data: any };
};

const CRMEvolutionPage: React.FC = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('evolution_instances')
      .select(
        'id, collaborator_name, collaborator_phone, profile_picture_url, profile_name, status, instance_name',
      )
      .order('created_at', { ascending: false });
    if (!error && data) setCollaborators(data as CollaboratorRow[]);
    setLoading(false);
  };

  const syncFromEvolution = async (silent = false) => {
    setSyncing(true);
    try {
      const res = await callEvolution('/instance/fetchInstances', 'GET');
      const list: any[] = Array.isArray(res.data) ? res.data : [];

      // Map by instance name for quick lookup
      const byName = new Map<string, any>();
      for (const item of list) {
        const name =
          item?.name ?? item?.instanceName ?? item?.instance?.instanceName;
        if (name) byName.set(name, item);
      }

      // Get current DB rows (need instance_name to match)
      const { data: rows } = await (supabase as any)
        .from('evolution_instances')
        .select('id, instance_name, profile_picture_url, profile_name, status, owner_jid');

      let updated = 0;
      for (const row of (rows ?? []) as any[]) {
        const remote = byName.get(row.instance_name);
        if (!remote) continue;

        const pic =
          remote.profilePicUrl ??
          remote.profilePictureUrl ??
          remote.instance?.profilePictureUrl ??
          null;
        const pname =
          remote.profileName ?? remote.instance?.profileName ?? null;
        const owner =
          remote.ownerJid ?? remote.owner ?? remote.instance?.owner ?? null;
        const connectionStatus =
          remote.connectionStatus ?? remote.instance?.state ?? null;
        const status =
          connectionStatus === 'open'
            ? 'connected'
            : connectionStatus === 'close'
              ? 'disconnected'
              : row.status;

        const patch: Record<string, unknown> = {};
        if (pic && pic !== row.profile_picture_url) patch.profile_picture_url = pic;
        if (pname && pname !== row.profile_name) patch.profile_name = pname;
        if (owner && owner !== row.owner_jid) patch.owner_jid = owner;
        if (status && status !== row.status) {
          patch.status = status;
          if (status === 'connected') patch.last_connected_at = new Date().toISOString();
        }

        if (Object.keys(patch).length > 0) {
          await (supabase as any)
            .from('evolution_instances')
            .update(patch)
            .eq('id', row.id);
          updated++;
        }
      }

      await load();
      if (!silent) {
        if (updated > 0) toast.success(`${updated} colaborador(es) sincronizado(s)`);
        else toast.info('Tudo já está em dia');
      }
    } catch (e: any) {
      if (!silent) toast.error(e?.message ?? 'Falha ao sincronizar');
      console.error('[CRMEvolution] sync error', e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      // Auto-sync silently on first mount to refresh profile pics
      syncFromEvolution(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>CRM Evolution | EXA Admin</title>
        <meta
          name="description"
          content="CRM para acompanhar conversas dos colaboradores via Evolution API"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center shadow-sm flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight truncate">
                  CRM Evolution
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  Conversas dos colaboradores via Evolution API
                </p>
              </div>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white flex-shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Adicionar colaborador</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Colaboradores</h2>
            <span className="text-xs text-gray-400">({collaborators.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => syncFromEvolution(false)}
              disabled={syncing}
              className="ml-auto h-7 px-2 text-xs text-gray-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-36 h-48 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : collaborators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Nenhum colaborador conectado ainda.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Clique em "Adicionar colaborador" para começar.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
              {collaborators.map((c) => (
                <div key={c.id} className="snap-start">
                  <CollaboratorCard collaborator={c} onUpdated={load} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddCollaboratorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          load();
          // Re-sync shortly after to grab profile pic once WhatsApp pushes it
          setTimeout(() => syncFromEvolution(true), 4000);
        }}
      />
    </>
  );
};

export default CRMEvolutionPage;
