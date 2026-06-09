import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Centraliza ações administrativas sobre instâncias Evolution:
 * - Logout (desconecta sem apagar)
 * - Reconectar (gera novo QR)
 * - Apagar (na Evolution + opcionalmente em cascata no Supabase)
 *
 * Reutilizado pela página CRM Evolution e pelo card de Notificações em XAlerts.
 */

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

export interface DeleteInstanceOptions {
  /** Quando true, apaga conversas/mensagens persistidas para esta instância */
  purgeLocalHistory?: boolean;
}

export const useEvolutionInstanceActions = () => {
  const [busy, setBusy] = useState(false);

  const fetchQr = useCallback(async (instanceName: string): Promise<string | null> => {
    const res = await callEvolution(`/instance/connect/${instanceName}`, 'GET');
    const base64 =
      res?.data?.base64 ??
      res?.data?.qrcode?.base64 ??
      res?.data?.code ??
      null;
    return base64;
  }, []);

  const fetchConnectionState = useCallback(
    async (instanceName: string): Promise<'open' | 'connecting' | 'close' | 'unknown'> => {
      try {
        const res = await callEvolution(`/instance/connectionState/${instanceName}`, 'GET');
        const state: string | undefined =
          res?.data?.instance?.state ?? res?.data?.state;
        if (state === 'open') return 'open';
        if (state === 'connecting') return 'connecting';
        if (state === 'close') return 'close';
        return 'unknown';
      } catch {
        return 'unknown';
      }
    },
    [],
  );

  const logout = useCallback(async (instanceName: string, rowId?: string) => {
    setBusy(true);
    try {
      await callEvolution(`/instance/logout/${instanceName}`, 'DELETE');
      if (rowId) {
        await (supabase as any)
          .from('evolution_instances')
          .update({ status: 'disconnected' })
          .eq('id', rowId);
      }
      toast.success('Instância desconectada');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao desconectar');
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const reconnect = useCallback(
    async (instanceName: string, rowId?: string): Promise<string | null> => {
      setBusy(true);
      try {
        // Força logout primeiro (ignora erros — pode já estar desconectada)
        try {
          await callEvolution(`/instance/logout/${instanceName}`, 'DELETE');
        } catch {
          /* ok */
        }
        // Solicita novo QR
        const base64 = await fetchQr(instanceName);
        if (rowId) {
          await (supabase as any)
            .from('evolution_instances')
            .update({ status: 'pending' })
            .eq('id', rowId);
        }
        return base64;
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao reconectar');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [fetchQr],
  );

  const deleteInstance = useCallback(
    async (
      instanceName: string,
      rowId: string,
      options: DeleteInstanceOptions = {},
    ) => {
      setBusy(true);
      try {
        // 1) Logout (best-effort)
        try {
          await callEvolution(`/instance/logout/${instanceName}`, 'DELETE');
        } catch {
          /* ok */
        }
        // 2) Delete na Evolution
        try {
          await callEvolution(`/instance/delete/${instanceName}`, 'DELETE');
        } catch (e) {
          console.warn('[Evolution] delete remote failed', e);
        }
        // 3) Purge local (opcional) — conversas/mensagens não têm vínculo direto
        // com a instância no schema atual, então a flag é informativa.
        // Mantemos o histórico salvo para auditoria.
        void options.purgeLocalHistory;
        // 4) Remove a linha da instância
        const { error: delErr } = await (supabase as any)
          .from('evolution_instances')
          .delete()
          .eq('id', rowId);
        if (delErr) throw delErr;
        toast.success('Instância removida');
      } catch (e: any) {
        toast.error(e?.message ?? 'Falha ao apagar instância');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return {
    busy,
    fetchQr,
    fetchConnectionState,
    logout,
    reconnect,
    deleteInstance,
  };
};
