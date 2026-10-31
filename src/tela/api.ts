import { ANON_KEY, FUNCAO, VERSAO_PLAYER } from './config';

export type Formato = 'h169' | 'h65' | 'v' | 'q';
export interface ItemVideo {
  id: string;
  tipo: 'anuncio' | 'casa';
  pedido_id: string;
  video_id: string;
  url: string;
  titulo: string;
  cliente: string;
  formato: Formato;
  duracao: number | null;
  trim_inicio: number;
  trim_fim: number;
}
export interface Camera { url: string; nome: string; credito: string; segundos: number }
export interface Noticia { titulo: string; resumo: string; categoria: string; origem: string; imagem: string; link: string; data: string | null }
export interface Ritmo { casa_a_cada: number; editorial_a_cada: number; camera: boolean; noticias: boolean }
export interface Estado {
  ok: boolean;
  pareada: boolean;
  codigo?: string | null;
  versao?: string;
  servidor_agora?: string;
  tela?: { id: string; nome: string | null; layout: string; ambiente: string; config: Record<string, any> };
  local?: { id: string; nome: string; bairro: string | null; segmento: string | null; tipo: string };
  ritmo?: Ritmo;
  comando?: { tipo: string; em: string } | null;
  anuncios?: ItemVideo[];
  casa?: ItemVideo[];
  cameras?: Camera[];
  noticias?: Noticia[];
  desconhecida?: boolean;
  erro?: string;
}

const qs = new URLSearchParams(location.search);
/** Ponte do app Android (opcional). */
const ponte: any = (window as any).ExaTela;

export const plataforma = (): string => {
  const p = qs.get('plataforma');
  if (p) return p.slice(0, 20);
  if (ponte) return 'android';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android-navegador';
  if (/Windows/i.test(ua)) return 'windows-navegador';
  if (/Linux/i.test(ua)) return 'linux-navegador';
  return 'web';
};

export const versaoCompleta = () => {
  const build = document.querySelector('meta[name="exa-build"]')?.getAttribute('content') || '';
  const app = qs.get('app') || (ponte?.versao ? safe(() => ponte.versao()) : '');
  return [VERSAO_PLAYER, build && `b${build}`, app && `app ${app}`].filter(Boolean).join(' · ');
};

function safe<T>(f: () => T): T | '' { try { return f(); } catch { return ''; } }

export const ler = <T,>(k: string, padrao: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; } };
export const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* cheio ou bloqueado */ } };
export const apagar = (k: string) => { try { localStorage.removeItem(k); } catch { /* */ } };

export const infoAparelho = () => {
  const extra = ponte?.infoAparelho ? safe(() => JSON.parse(ponte.infoAparelho())) : '';
  return {
    ua: navigator.userAgent.slice(0, 240),
    tela: `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}`,
    janela: `${innerWidth}x${innerHeight}`,
    memoria_gb: (navigator as any).deviceMemory || null,
    nucleos: navigator.hardwareConcurrency || null,
    idioma: navigator.language,
    fuso: Intl.DateTimeFormat().resolvedOptions().timeZone,
    id_aparelho: ponte?.idAparelho ? safe(() => ponte.idAparelho()) : '',
    ...(extra && typeof extra === 'object' ? extra : {}),
  };
};

async function chamar(corpo: Record<string, unknown>, ms = 20000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(FUNCAO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
      cache: 'no-store',
      credentials: 'omit',
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok && !j?.desconhecida) throw new Error(j?.erro || `HTTP ${r.status}`);
    return j;
  } finally {
    clearTimeout(t);
  }
}

export const iniciar = () => chamar({ acao: 'iniciar', plataforma: plataforma(), versao: versaoCompleta(), info: infoAparelho() });
export const pedirEstado = (extra: Record<string, unknown>) => chamar({ acao: 'estado', versao: versaoCompleta(), plataforma: plataforma(), ...extra });

export const reiniciarApp = () => {
  if (ponte?.reiniciarApp) { try { ponte.reiniciarApp(); return; } catch { /* cai no reload */ } }
  recarregar();
};

/** Recarrega a página pegando a versão nova do site (o cookie __dpl prende o aparelho numa publicação velha). */
export const recarregar = () => {
  try { document.cookie = '__dpl=; Max-Age=0; path=/'; } catch { /* */ }
  const u = new URL(location.href);
  u.searchParams.set('r', String(Date.now()));
  location.replace(u.toString());
};
