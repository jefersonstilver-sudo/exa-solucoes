/** O que a tela conta para o servidor a cada batimento: exibições (prova), o que toca, erros e eventos. */
import { FUSO } from './config';

type Exib = { dia: string; tipo: string; pedido_id: string | null; video_id: string | null; vezes: number; segundos: number };
const exib = new Map<string, Exib>();
const erros: string[] = [];
const eventos: { tipo: string; dados: unknown }[] = [];
let tocando: Record<string, unknown> | null = null;

const diaLocal = () => new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function registrarExibicao(tipo: string, pedido_id: string | null, video_id: string | null, segundos: number) {
  const dia = diaLocal();
  const k = [dia, tipo, pedido_id || '', video_id || ''].join('|');
  const e = exib.get(k) || { dia, tipo, pedido_id, video_id, vezes: 0, segundos: 0 };
  e.vezes += 1;
  e.segundos += Math.max(0, Math.round(segundos));
  exib.set(k, e);
}
export function retirarExibicoes(): Exib[] { const a = [...exib.values()]; exib.clear(); return a; }
export function devolverExibicoes(a: Exib[]) {
  for (const e of a) {
    const k = [e.dia, e.tipo, e.pedido_id || '', e.video_id || ''].join('|');
    const x = exib.get(k);
    if (x) { x.vezes += e.vezes; x.segundos += e.segundos; } else exib.set(k, { ...e });
  }
}

export function registrarErro(msg: string) {
  const linha = `${new Date().toISOString().slice(11, 19)} ${msg}`.slice(0, 280);
  erros.push(linha);
  if (erros.length > 20) erros.shift();
  console.warn('[tela]', msg);
}
export const errosRecentes = () => erros.slice(-10);

export function registrarEvento(tipo: string, dados?: unknown) {
  eventos.push({ tipo, dados: dados ?? null });
  if (eventos.length > 30) eventos.shift();
}
export function retirarEventos() { const a = eventos.splice(0, eventos.length); return a; }

export const marcarTocando = (t: Record<string, unknown> | null) => { tocando = t; };
export const tocandoAgora = () => tocando;
