/**
 * Avisos no celular (Web Push do app da tela de início).
 * iPhone: só funciona no app instalado na tela de início (iOS 16.4+) e a permissão tem de vir de um toque.
 * O envio fica na edge function exa2-push (assinaturas em push_assinaturas).
 */
import { supabase } from '@/integrations/supabase/client';

const SW = '/sw-exa.js';
const ADIADO = 'exa-avisos-adiado';

export type EstadoAvisos = 'sem_suporte' | 'so_no_app' | 'bloqueado' | 'pendente' | 'ativo';

export const emApp = () => {
  try { return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true; } catch { return false; }
};
const ehIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const suporte = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function chamar(action: string, extra: Record<string, unknown> = {}) {
  // invoke manda o token da sessão (ou a chave pública) — funciona com ou sem verificação de JWT na função
  const { data, error } = await supabase.functions.invoke('exa2-push', { body: { action, ...extra } });
  if (error) throw new Error(error.message || 'erro');
  return data as any;
}

const b64ParaBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export async function estadoAvisos(): Promise<EstadoAvisos> {
  if (!suporte()) return ehIOS() && !emApp() ? 'so_no_app' : 'sem_suporte';
  if (Notification.permission === 'denied') return 'bloqueado';
  if (Notification.permission !== 'granted') return 'pendente';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    return sub ? 'ativo' : 'pendente';
  } catch { return 'pendente'; }
}

/** Chamar direto no toque do botão (o iPhone exige o gesto para pedir permissão). */
export async function ativarAvisos(): Promise<EstadoAvisos> {
  if (!suporte()) return ehIOS() && !emApp() ? 'so_no_app' : 'sem_suporte';
  const perm = await Notification.requestPermission(); // primeiro, ainda dentro do toque
  if (perm !== 'granted') return perm === 'denied' ? 'bloqueado' : 'pendente';
  const reg = await navigator.serviceWorker.register(SW, { scope: '/' });
  await navigator.serviceWorker.ready;
  const { publica } = await chamar('chave');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ParaBytes(publica) });
  await chamar('assinar', { assinatura: sub.toJSON(), aparelho: navigator.userAgent.slice(0, 180) });
  try { localStorage.removeItem(ADIADO); } catch { /* nada */ }
  return 'ativo';
}

export async function testarAvisos() {
  return chamar('teste', { url: window.location.pathname });
}

export async function desativarAvisos() {
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) { await chamar('sair', { endpoint: sub.endpoint }).catch(() => null); await sub.unsubscribe(); }
}

/** Mantém a assinatura viva: se a permissão existe mas o aparelho perdeu a assinatura, refaz sem perguntar. */
export async function renovarAvisosSeguro() {
  try {
    if (!suporte() || Notification.permission !== 'granted') return;
    const reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.register(SW, { scope: '/' }));
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { publica } = await chamar('chave');
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ParaBytes(publica) });
    }
    await chamar('assinar', { assinatura: sub.toJSON(), aparelho: navigator.userAgent.slice(0, 180) });
  } catch { /* silencioso */ }
}

export const conviteAdiado = () => {
  try { const t = Number(localStorage.getItem(ADIADO) || 0); return Date.now() - t < 7 * 24 * 3600 * 1000; } catch { return false; }
};
export const adiarConvite = () => { try { localStorage.setItem(ADIADO, String(Date.now())); } catch { /* nada */ } };
