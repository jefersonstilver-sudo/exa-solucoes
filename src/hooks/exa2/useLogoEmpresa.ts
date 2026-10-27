import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * EXA 2.0 — logo da empresa do cliente, de onde ela estiver:
 * 1) logo enviada na aba Empresa do pedido ou para a Sofia (marca_arquivos, tipo 'logo', mais recente);
 * 2) senão, a foto/logo do perfil (users.avatar_url).
 * Cache simples por usuário para a barra lateral e o cabeçalho não buscarem duas vezes.
 */
const cache = new Map<string, string | null>();

export function useLogoEmpresa(userId?: string | null, avatarUrl?: string | null) {
  const [url, setUrl] = useState<string | null>(userId && cache.has(userId) ? cache.get(userId)! : null);

  useEffect(() => {
    if (!userId) return;
    let vivo = true;
    (async () => {
      try {
        const { data: marcas } = await (supabase as any).from('marcas_clientes').select('id').eq('client_id', userId);
        const ids = (marcas || []).map((m: any) => m.id);
        let logo: string | null = null;
        if (ids.length) {
          const { data: arq } = await (supabase as any)
            .from('marca_arquivos')
            .select('url')
            .in('marca_id', ids)
            .eq('tipo', 'logo')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          logo = arq?.url || null;
        }
        const final = logo || avatarUrl || null;
        cache.set(userId, final);
        if (vivo) setUrl(final);
      } catch {
        if (vivo) setUrl(avatarUrl || null);
      }
    })();
    return () => { vivo = false; };
  }, [userId, avatarUrl]);

  return url;
}
