import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, UserPlus, Users, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AddCollaboratorDialog } from './components/AddCollaboratorDialog';
import { CollaboratorCard, type CollaboratorRow } from './components/CollaboratorCard';
import { MonitorAoVivo } from './components/MonitorAoVivo';
import { PerfilWhatsApp, lerPerfil } from './components/PerfilWhatsApp';
import type { CxAgente } from './components/chat/ChatEXA';
import { UserRoundPen } from 'lucide-react';
import { toast } from 'sonner';
import { Pagina, Cabecalho, BOTAO, BOTAO2, Secao, Vazio } from '@/components/admin/ui/exa';

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
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/super_admin')
    ? '/super_admin'
    : '/admin';

  const [addOpen, setAddOpen] = useState(false);
  const [aoVivo, setAoVivo] = useState(false);
  const [perfilDe, setPerfilDe] = useState<CxAgente | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('evolution_instances')
      .select(
        'id, collaborator_name, collaborator_phone, profile_picture_url, profile_name, status, instance_name, is_notifications',
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
    // 07/11/2026: foto/nome/recado iguais ao WhatsApp — relê o perfil dos três ao abrir e a cada 2 min (espelha em evolution_instances)
    const relerPerfis = async () => {
      await Promise.all((['sofia', 'nando', 'livia'] as CxAgente[]).map((a) => lerPerfil(a).catch(() => null)));
      load();
    };
    relerPerfis();
    const t = setInterval(relerPerfis, 120000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agenteDe = (c: CollaboratorRow): CxAgente | null => {
    const r = `${c.collaborator_name} ${(c as any).instance_name || ''}`;
    return /sofia/i.test(r) ? 'sofia' : /nando/i.test(r) ? 'nando' : ((c as any).is_notifications || /l[ií]via/i.test(r)) ? 'livia' : null;
  };

  return (
    <>
      <Helmet>
        <title>Equipe | EXA Admin</title>
        <meta name="description" content="Equipe da EXA no WhatsApp: Sofia (comercial), Nando (síndicos), Lívia (financeiro) e colaboradores" />
      </Helmet>

      <Pagina>
        <Cabecalho
          titulo="Equipe"
          sub="Sofia (comercial), Nando (síndicos), Lívia (financeiro) e os números da equipe no WhatsApp. Clique num card para abrir as conversas."
          acoes={(
            <>
              <button type="button" className={BOTAO2} onClick={() => setAoVivo(true)} title="Acompanhar Sofia, Nando e Lívia ao mesmo tempo, lado a lado">
                <Radio className="h-4 w-4 text-[#9C1E1E]" /><span className="hidden sm:inline">Ao vivo</span>
              </button>
              <button type="button" className={BOTAO} onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" /><span className="hidden sm:inline">Adicionar número</span><span className="sm:hidden">Adicionar</span>
              </button>
            </>
          )}
        />

        <Secao
          titulo={<span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5" />Números conectados · {collaborators.length}</span>}
          acao={{ rotulo: syncing ? 'Sincronizando…' : 'Sincronizar', onClick: () => syncFromEvolution(false) }}
        >
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-48 w-36 flex-shrink-0 animate-pulse rounded-2xl bg-black/[0.04]" />)}
            </div>
          ) : collaborators.length === 0 ? (
            <Vazio icone={<MessageCircle className="h-6 w-6" />} titulo="Nenhum número conectado ainda" texto='Clique em "Adicionar número" para conectar um WhatsApp da equipe.' />
          ) : (
            <>
              {/* Celular: lista em linhas, como contatos do WhatsApp */}
              <div className="flex flex-col gap-2 md:hidden">
                {collaborators.map((c) => (
                  <div key={c.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80">
                    <CollaboratorCard variante="linha" collaborator={c} onUpdated={load} onSelect={() => navigate(`${basePath}/crm-evolution/conversas/${c.id}`)} />
                  </div>
                ))}
              </div>
              <div className="-mx-1 hidden gap-3 overflow-x-auto px-1 pb-2 md:flex [scrollbar-width:thin]">
                {collaborators.map((c) => {
                  const ag = agenteDe(c);
                  return (
                    <div key={c.id} className="snap-start">
                      <CollaboratorCard collaborator={c} onUpdated={load} onSelect={() => navigate(`${basePath}/crm-evolution/conversas/${c.id}`)} />
                      {ag && (
                        <button type="button" onClick={() => setPerfilDe(ag)} className="mt-1.5 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-bold text-[#9C1E1E] hover:bg-[#FDECEC]" title="Foto, nome, recado e privacidade no WhatsApp">
                          <UserRoundPen className="h-3.5 w-3.5" /> Perfil do WhatsApp
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Secao>
      </Pagina>

      <MonitorAoVivo aberto={aoVivo} onFechar={() => setAoVivo(false)} colaboradores={collaborators} />
      {perfilDe && <PerfilWhatsApp agente={perfilDe} aberto={!!perfilDe} onFechar={() => setPerfilDe(null)} onAtualizado={() => load()} />}

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
