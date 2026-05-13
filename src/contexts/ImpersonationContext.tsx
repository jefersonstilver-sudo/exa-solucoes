import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface ImpersonationData {
  session_id: string;
  admin_user_id: string;
  target_user_id: string;
  target_pedido_id: string | null;
  expires_at: string;
  target_user: { id: string; email?: string | null; nome?: string | null } | null;
}

interface ImpersonationContextValue {
  impersonation: ImpersonationData | null;
  loading: boolean;
  isImpersonating: boolean;
  effectiveUserId: string | null;
  endSession: (reason?: 'manual' | 'expired') => Promise<void>;
  logAction: (action: string, opts?: { entity_id?: string; payload?: any; pedido_id?: string }) => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  impersonation: null,
  loading: false,
  isImpersonating: false,
  effectiveUserId: null,
  endSession: async () => {},
  logAction: async () => {},
});

export const ImpersonationProvider: React.FC<{ children: React.ReactNode; fallbackUserId: string | null }> = ({ children, fallbackUserId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get('impersonate');
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setImpersonation(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('verify-impersonation', {
          method: 'GET' as any,
          // workaround: pass via path since invoke uses POST
        });
        // invoke doesn't support GET easily — use direct fetch
      } catch (_) {}
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const projectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || 'aakenoljsycyrcrchgxj';
        const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/verify-impersonation?session_id=${encodeURIComponent(sessionId)}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          },
        });
        if (!resp.ok) {
          console.warn('Impersonation inválida:', await resp.text());
          setImpersonation(null);
        } else {
          const data = await resp.json();
          setImpersonation(data);
        }
      } catch (e) {
        console.error('Erro ao verificar impersonação', e);
        setImpersonation(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // Auto-expire timer
  useEffect(() => {
    if (!impersonation) return;
    const ms = new Date(impersonation.expires_at).getTime() - Date.now();
    if (ms <= 0) {
      endSession('expired');
      return;
    }
    const t = setTimeout(() => endSession('expired'), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impersonation?.session_id]);

  const endSession = useCallback(async (reason: 'manual' | 'expired' = 'manual') => {
    if (!impersonation) return;
    try {
      await supabase.functions.invoke('end-impersonation', {
        body: { session_id: impersonation.session_id, reason },
      });
    } catch (e) { console.warn(e); }
    setImpersonation(null);
    // Remove param
    const next = new URLSearchParams(searchParams);
    next.delete('impersonate');
    setSearchParams(next, { replace: true });
    if (reason === 'expired') {
      window.alert('Sessão de impersonação expirada (30min). Esta aba será fechada.');
      window.close();
    }
  }, [impersonation, searchParams, setSearchParams]);

  const logAction: ImpersonationContextValue['logAction'] = useCallback(async (action, opts) => {
    if (!impersonation) return;
    try {
      await supabase.functions.invoke('log-impersonation-action', {
        body: {
          session_id: impersonation.session_id,
          action,
          entity_id: opts?.entity_id,
          payload: opts?.payload,
          pedido_id: opts?.pedido_id || impersonation.target_pedido_id,
        },
      });
    } catch (e) { console.warn('logAction failed', e); }
  }, [impersonation]);

  const isImpersonating = !!impersonation;
  const effectiveUserId = isImpersonating ? impersonation!.target_user_id : fallbackUserId;

  return (
    <ImpersonationContext.Provider value={{ impersonation, loading, isImpersonating, effectiveUserId, endSession, logAction }}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => useContext(ImpersonationContext);
