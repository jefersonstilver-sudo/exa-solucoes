import React, { useEffect, useState, useCallback } from 'react';
import { Bell, Loader2, MessageSquare, QrCode, Plus, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { InstanceQRDialog } from '@/pages/admin/crm/components/InstanceQRDialog';
import { useEvolutionInstanceActions } from '@/pages/admin/crm/lib/useEvolutionInstanceActions';

interface NotifInstance {
  id: string;
  instance_name: string | null;
  collaborator_name: string;
  profile_name: string | null;
  profile_picture_url: string | null;
  status: string;
  owner_jid: string | null;
  last_connected_at: string | null;
}

const NOTIFICATIONS_NAME = 'Notificações EXA';
const NOTIFICATIONS_SLUG = 'notificacoes-exa';

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

const statusBadge = (status: string) => {
  switch (status) {
    case 'connected':
      return { dot: 'bg-emerald-500', label: 'Conectado', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
    case 'pending':
      return { dot: 'bg-amber-500', label: 'Aguardando QR', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
    case 'disconnected':
      return { dot: 'bg-red-500', label: 'Desconectado', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    default:
      return { dot: 'bg-gray-400', label: 'Sem instância', text: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
  }
};

export const NotificationsChannelCard: React.FC = () => {
  const navigate = useNavigate();
  const [instance, setInstance] = useState<NotifInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [initialQr, setInitialQr] = useState<string | null>(null);
  const { fetchConnectionState, fetchQr, busy } = useEvolutionInstanceActions();

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from('evolution_instances')
      .select(
        'id, instance_name, collaborator_name, profile_name, profile_picture_url, status, owner_jid, last_connected_at',
      )
      .eq('is_notifications', true)
      .maybeSingle();
    if (error) {
      console.error('[NotificationsChannel] load error', error);
    }
    setInstance((data as NotifInstance) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('exa_notif_instance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evolution_instances' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Refresh connection state periodically (60s) when instance exists
  useEffect(() => {
    if (!instance?.instance_name) return;
    const timer = setInterval(async () => {
      const state = await fetchConnectionState(instance.instance_name!);
      const mapped =
        state === 'open' ? 'connected' : state === 'close' ? 'disconnected' : 'pending';
      if (mapped !== instance.status) {
        await (supabase as any)
          .from('evolution_instances')
          .update({
            status: mapped,
            ...(mapped === 'connected'
              ? { last_connected_at: new Date().toISOString() }
              : {}),
          })
          .eq('id', instance.id);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [instance, fetchConnectionState]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const uniqueName = `${NOTIFICATIONS_SLUG}-${Date.now().toString(36)}`;
      const res = await callEvolution('/instance/create', 'POST', {
        instanceName: uniqueName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Evolution respondeu HTTP ${res.status}`);
      }
      const payload = res.data ?? {};
      const inst = payload.instance ?? {};
      const qr = payload.qrcode ?? {};
      const createdName: string = inst.instanceName ?? uniqueName;
      const createdId: string | undefined = inst.instanceId;
      const base64: string | undefined = qr.base64;

      const { data: userData } = await supabase.auth.getUser();
      const { data: row, error: insertErr } = await (supabase as any)
        .from('evolution_instances')
        .insert({
          collaborator_name: NOTIFICATIONS_NAME,
          collaborator_phone: null,
          instance_name: createdName,
          instance_id: createdId ?? null,
          instance_token: payload?.hash?.apikey ?? null,
          status: 'pending',
          is_notifications: true,
          created_by: userData.user?.id ?? null,
          metadata: { created_payload: payload, purpose: 'notifications' },
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      setInitialQr(base64 ?? null);
      setQrOpen(true);
      await load();
      toast.success('Instância de notificações criada');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  const handleShowQr = async () => {
    if (!instance?.instance_name) return;
    try {
      const base64 = await fetchQr(instance.instance_name);
      setInitialQr(base64);
      setQrOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao buscar QR');
    }
  };

  const handleOpenChat = () => {
    if (!instance) return;
    navigate(`/super_admin/crm-evolution/conversas/${instance.id}`);
  };

  const handleRefreshStatus = async () => {
    if (!instance?.instance_name) {
      await load();
      return;
    }
    const state = await fetchConnectionState(instance.instance_name);
    const mapped =
      state === 'open' ? 'connected' : state === 'close' ? 'disconnected' : 'pending';
    await (supabase as any)
      .from('evolution_instances')
      .update({
        status: mapped,
        ...(mapped === 'connected'
          ? { last_connected_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', instance.id);
    await load();
    toast.info(`Status: ${mapped}`);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Carregando canal de notificações…</span>
      </div>
    );
  }

  const badge = statusBadge(instance?.status ?? 'none');

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#7D1818] to-[#9C1E1E] px-5 py-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-white" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Canal de Notificações WhatsApp
          </h3>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-white/80 font-medium">
            Evolution API
          </span>
        </div>

        <div className="p-5 space-y-4">
          {!instance ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-900">
                  <strong>Nenhuma instância criada.</strong> Crie a instância dedicada
                  "Notificações EXA" para que o sistema possa enviar alertas
                  automáticos (painéis offline, 2FA, agendamentos, propostas etc.)
                  através do Evolution.
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar instância "Notificações EXA"
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {instance.profile_picture_url ? (
                    <img
                      src={instance.profile_picture_url}
                      alt="WhatsApp"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Bell className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {instance.profile_name ?? NOTIFICATIONS_NAME}
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {instance.owner_jid?.replace(/@.*$/, '') ??
                      instance.instance_name ??
                      '—'}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${badge.bg} ${badge.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </div>
              </div>

              {instance.status === 'connected' && instance.last_connected_at && (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conectado desde{' '}
                  {new Date(instance.last_connected_at).toLocaleString('pt-BR')}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenChat}
                  className="text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Abrir conversas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowQr}
                  disabled={busy}
                  className="text-xs"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5" />
                  {instance.status === 'connected' ? 'Reconectar (QR)' : 'Mostrar QR'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshStatus}
                  disabled={busy}
                  className="text-xs text-gray-600 ml-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${busy ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {instance?.instance_name && (
        <InstanceQRDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          instanceName={instance.instance_name}
          rowId={instance.id}
          initialQr={initialQr}
          title="Conectar canal de notificações"
          onConnected={load}
        />
      )}
    </>
  );
};

export default NotificationsChannelCard;
