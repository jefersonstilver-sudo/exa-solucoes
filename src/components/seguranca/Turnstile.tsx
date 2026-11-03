import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Captcha Cloudflare Turnstile (02/11/2026).
 * Vai SÓ no cadastro, no formulário do síndico e no "esqueci a senha". Nunca no login:
 * os robôs de notícias e do Cine Cataratas entram pelo login.
 * A chave do site é pública; o segredo fica no Supabase (TURNSTILE_SECRET_KEY) e é conferido no servidor.
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFxZjCpBlmK0Xj7k';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

let carregando: Promise<void> | null = null;
function carregarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (carregando) return carregando;
  carregando = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { carregando = null; reject(new Error('turnstile')); };
    document.head.appendChild(s);
  });
  return carregando;
}

interface Props {
  onToken: (token: string) => void;
  /** muda este número para pedir um token novo (cada token vale uma vez) */
  reiniciar?: number;
  tema?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const Turnstile: React.FC<Props> = ({ onToken, reiniciar = 0, tema = 'auto', className }) => {
  const caixa = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | undefined>();
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    let vivo = true;
    carregarScript()
      .then(() => {
        if (!vivo || !caixa.current || !window.turnstile) return;
        idWidget.current = window.turnstile.render(caixa.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: tema,
          language: 'pt-br',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(''),
          'error-callback': () => cb.current(''),
        });
      })
      .catch(() => { /* sem captcha carregado: o servidor decide */ });
    return () => {
      vivo = false;
      try { if (idWidget.current) window.turnstile?.remove(idWidget.current); } catch { /* */ }
      idWidget.current = undefined;
    };
  }, [tema]);

  useEffect(() => {
    if (!reiniciar || !idWidget.current) return;
    cb.current('');
    try { window.turnstile?.reset(idWidget.current); } catch { /* */ }
  }, [reiniciar]);

  return <div ref={caixa} className={className} style={{ minHeight: 65, display: 'flex', justifyContent: 'center' }} />;
};

/** Confere o token no servidor antes do cadastro / recuperação de senha. */
export async function conferirCaptcha(token: string, acao: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('turnstile-verificar', { body: { token, acao } });
    // só bloqueia quando o servidor recusou o captcha (403); falha de rede não trava o cadastro
    if (error) return (error as { context?: { status?: number } }).context?.status !== 403;
    return (data as { ok?: boolean } | null)?.ok !== false;
  } catch {
    return true;
  }
}

export default Turnstile;
