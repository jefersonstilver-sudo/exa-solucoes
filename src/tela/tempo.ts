/** Relógio (corrigido pelo horário do servidor: TV box sem bateria costuma ligar com a data errada) e clima de Foz. */
import { useEffect, useState } from 'react';
import { FUSO, LAT, LON } from './config';
import { gravar, ler } from './api';

let desvio = ler<number>('exa-tela-desvio', 0);
export const ajustarRelogio = (servidorIso?: string) => {
  if (!servidorIso) return;
  const s = Date.parse(servidorIso);
  if (!Number.isFinite(s)) return;
  const d = s - Date.now();
  if (Math.abs(d - desvio) > 1500) { desvio = d; gravar('exa-tela-desvio', d); }
};
export const agora = () => new Date(Date.now() + desvio);

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, ...o });
const fHora = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const fSemana = fmt({ weekday: 'long' });
const fSemanaCurta = fmt({ weekday: 'short' });
const fDia = fmt({ day: 'numeric' });
const fMes = fmt({ month: 'long' });
const fMesCurto = fmt({ month: 'short' });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function textosDaHora(d = agora()) {
  const semana = cap(fSemana.format(d).replace('-feira', ''));
  const semanaCurta = cap(fSemanaCurta.format(d).replace('.', ''));
  return {
    hora: fHora.format(d),
    dataLonga: `${semana}, ${fDia.format(d)} de ${fMes.format(d)}`,
    dataCurta: `${semanaCurta} · ${fDia.format(d)} ${fMesCurto.format(d).replace('.', '')}`,
    dataMedia: `${semanaCurta} · ${fDia.format(d)} de ${fMes.format(d)}`,
    hora24: Number(fmt({ hour: 'numeric', hour12: false }).format(d)),
  };
}

/** Atualiza só quando o minuto muda (menos trabalho para aparelho fraco). */
export function useHora() {
  const [t, setT] = useState(textosDaHora);
  useEffect(() => {
    const id = setInterval(() => { const n = textosDaHora(); setT((v) => (v.hora === n.hora && v.dataLonga === n.dataLonga ? v : n)); }, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// ---------- clima (Open-Meteo, sem chave) ----------
export interface Clima { temp: number; codigo: number; dia: boolean; previsao: { dia: string; max: number; min: number; codigo: number }[]; em: number }
let clima: Clima | null = ler<Clima | null>('exa-tela-clima', null);
const ouv = new Set<(c: Clima | null) => void>();
let buscando = false;

async function buscarClima() {
  if (buscando) return;
  buscando = true;
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(FUSO)}&forecast_days=4`;
    const r = await fetch(u, { cache: 'no-store', credentials: 'omit' });
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const dias: string[] = j.daily?.time || [];
    clima = {
      temp: Math.round(j.current?.temperature_2m),
      codigo: Number(j.current?.weather_code) || 0,
      dia: j.current?.is_day !== 0,
      previsao: dias.slice(1, 4).map((d, i) => ({
        dia: cap(new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`)).replace('.', '')).toUpperCase(),
        max: Math.round(j.daily.temperature_2m_max[i + 1]),
        min: Math.round(j.daily.temperature_2m_min[i + 1]),
        codigo: Number(j.daily.weather_code[i + 1]) || 0,
      })),
      em: Date.now(),
    };
    gravar('exa-tela-clima', clima);
    ouv.forEach((f) => f(clima));
  } catch { /* fica o último que deu certo */ }
  finally { buscando = false; }
}
let iniciado = false;
export function useClima() {
  const [c, setC] = useState<Clima | null>(clima);
  useEffect(() => {
    ouv.add(setC);
    if (!iniciado) { iniciado = true; buscarClima(); setInterval(buscarClima, 15 * 60000); }
    else if (!clima || Date.now() - clima.em > 20 * 60000) buscarClima();
    return () => { ouv.delete(setC); };
  }, []);
  return c && Date.now() - c.em < 6 * 3600000 ? c : null; // clima de mais de 6 h não aparece
}

export function descreverClima(codigo: number): { texto: string; icone: 'sol' | 'parcial' | 'nuvem' | 'neblina' | 'garoa' | 'chuva' | 'tempestade' } {
  if (codigo === 0) return { texto: 'Céu limpo', icone: 'sol' };
  if (codigo <= 2) return { texto: 'Poucas nuvens', icone: 'parcial' };
  if (codigo === 3) return { texto: 'Nublado', icone: 'nuvem' };
  if (codigo === 45 || codigo === 48) return { texto: 'Neblina', icone: 'neblina' };
  if (codigo >= 51 && codigo <= 57) return { texto: 'Garoa', icone: 'garoa' };
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return { texto: codigo >= 80 ? 'Pancadas de chuva' : 'Chuva', icone: 'chuva' };
  if (codigo >= 95) return { texto: 'Tempestade', icone: 'tempestade' };
  return { texto: 'Tempo instável', icone: 'nuvem' };
}

/** Índice que gira a cada `ms` (notícias, câmeras da janela). */
export function useRodizio(n: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (n <= 1) { setI(0); return; }
    const id = setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => clearInterval(id);
  }, [n, ms]);
  return n ? i % n : 0;
}
