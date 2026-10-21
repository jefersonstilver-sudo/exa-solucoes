import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export interface ImpersonationData {
  session_id: string;
  admin_user_id: string;
  target_user_id: string;
  target_pedido_id: string | null;
  expires_at: string;
  /** Full target user record from public.users — used to substitute userProfile in the advertiser portal. */
  target_user: any | null;
}

interface ImpersonationContextValue {
  impersonation: ImpersonationData | null;
  loading: boolean;
  isImpersonating: boolean;
  /** True while an impersonate session id was requested but not yet verified (or failed). */
  impersonationRequested: boolean;
  impersonationFailed: boolean;
  effectiveUserId: string | null;
  /** Full effective user profile when impersonating (target client), null otherwise. */
  effectiveUserProfile: any | null;
  endSession: (reason?: 'manual' | 'expired') => Promise<void>;
  logAction: (action: string, opts?: { entity_id?: string; payload?: any; pedido_id?: string }) => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  impersonation: null,
  loading: false,
  isImpersonating: false,
  impersonationRequested: false,
  impersonationFailed: false,
  effectiveUserId: null,
  effectiveUserProfile: null,
  endSession: async () => {},
  logAction: async () => {},
});

export const ImpersonationProvider: React.FC<{ children: React.ReactNode; fallbackUserId: string | null }> = ({ children, fallbackUserId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlSessionId = searchParams.get('impersonate');
  const urlEmbedded = searchParams.get('embedded');
  // Keep the session id across in-portal navigations (links drop the query string).
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [embedded, setEmbedded] = useState<string | null>(urlEmbedded);
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);
  const [loading, setLoading] = useState<boolean>(!!urlSessionId);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (urlSessionId && urlSessionId !== sessionId) setSessionId(urlSessionId);
    if (urlEmbedded && urlEmbedded !== embedded) setEmbedded(urlEmbedded);
  }, [urlSessionId, urlEmbedded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-append impersonate/embedded params when an internal link removed them.
  useEffect(() => {
    if (sessionId && !urlSessionId) {
      const next = new URLSearchParams(searchParams);
      next.set('impersonate', sessionId);
      if (embedded) next.set('embedded', embedded);
      setSearchParams(next, { replace: true });
    }
  }, [sessionId, urlSessionId, embedded, searchParams, setSearchParams]);

  useEffect(() => {
    if (!sessionId) {
      setImpersonation(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setFailed(false);
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
          setFailed(true);
        } else {
          const data = await resp.json();
          setImpersonation(data);
        }
      } catch (e) {
        console.error('Erro ao verificar impersonação', e);
        setImpersonation(null);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const endSession = useCallback(async (reason: 'manual' | 'expired' = 'manual') => {
    if (!impersonation) return;
    try {
      await supabase.functions.invoke('end-impersonation', {
        body: { session_id: impersonation.session_id, reason },
      });
    } catch (e) { console.warn(e); }
    setImpersonation(null);
    setSessionId(null);
    if (reason === 'expired') {
      window.alert('Sessão de impersonação expirada (30min). Voltando ao painel admin.');
    }
    // Embedded (iframe) view: the parent sheet handles closing.
    if (embedded === '1' && window.parent !== window) return;
    navigate('/super_admin/pedidos', { replace: true });
  }, [impersonation, navigate, embedded]);

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
  const effectiveUserProfile = isImpersonating ? impersonation!.target_user : null;

  return (
    <ImpersonationContext.Provider value={{ impersonation, loading, isImpersonating, impersonationRequested: !!sessionId, impersonationFailed: failed, effectiveUserId, effectiveUserProfile, endSession, logAction }}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => useContext(ImpersonationContext);
