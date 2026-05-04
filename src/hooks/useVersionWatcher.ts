import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * useVersionWatcher
 *
 * Camada 5 da política anti-cache (v4.0).
 * Faz polling leve a cada 5 minutos na edge function `get-app-version`.
 * Quando detecta versão nova, mostra toast persistente e força reload limpando
 * o Caches API. Cobre principalmente Safari macOS e Comet (Chromium da Perplexity)
 * onde o usuário deixa a aba aberta o dia inteiro.
 *
 * Respeita o memory rule de polling mínimo 60s — usa 5min (300s).
 */

const VERSION_URL =
  'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/get-app-version';
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

declare global {
  interface Window {
    __exaForceRefresh?: () => void;
  }
}

export const useVersionWatcher = () => {
  useEffect(() => {
    // BUILD_ID é injetado em tempo de build no index.html via __BUILD_ID__.
    // No contexto do bundle React não temos acesso direto — usamos o valor
    // persistido pelo script inline em localStorage.
    let bootVersion: string | null = null;
    try {
      bootVersion = localStorage.getItem('html-build-id');
    } catch {
      // localStorage indisponível (modo privado): aborta watcher silenciosamente
      return;
    }
    if (!bootVersion) return;

    let cancelled = false;
    let toastShown = false;

    const checkOnce = async () => {
      if (cancelled || toastShown) return;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 4000);
        const r = await fetch(VERSION_URL, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          signal: ctrl.signal,
        });
        clearTimeout(timeout);
        const d = await r.json();
        if (
          d?.version &&
          d.version !== '0' &&
          d.version !== bootVersion &&
          !toastShown
        ) {
          toastShown = true;
          toast.info('Nova versão disponível. Atualizando em 5s...', {
            duration: 5000,
          });
          setTimeout(() => {
            if (typeof window.__exaForceRefresh === 'function') {
              window.__exaForceRefresh();
            } else {
              window.location.replace('/?_v=' + Date.now());
            }
          }, 5000);
        }
      } catch {
        // timeout/rede: ignora e tenta no próximo ciclo
      }
    };

    const interval = setInterval(checkOnce, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
};
