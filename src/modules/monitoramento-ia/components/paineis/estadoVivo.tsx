import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { EstadoPainel } from '../../hooks/useFrotaSaude';
import { ESTADO_INFO } from './estados';

/** "2 h 14 min", "3 dias e 4 h", "12 min" — tempo desde uma data. */
export function duracaoDesde(desde: string | null | undefined, agora = Date.now()) {
  if (!desde) return null;
  const ms = agora - new Date(desde).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  if (h < 24) return m ? `${h} h ${m} min` : `${h} h`;
  const d = Math.floor(h / 24), hh = h % 24;
  return hh ? `${d} ${d === 1 ? 'dia' : 'dias'} e ${hh} h` : `${d} ${d === 1 ? 'dia' : 'dias'}`;
}

/** Contador ao vivo ("há 2 h 14 min"), atualiza a cada 30 s. */
export const TempoFora: React.FC<{ desde: string | null | undefined; prefixo?: string }> = ({ desde, prefixo = 'há ' }) => {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setAgora(Date.now()), 30000); return () => window.clearInterval(t); }, []);
  const d = duracaoDesde(desde, agora);
  return d ? <>{prefixo}{d}</> : null;
};

const VERDE = { fundo: '#EAF5EF', cor: '#1E6B47', ponto: '#2E9B62' };
const Selo: React.FC<{ fundo: string; cor: string; ponto?: string; children: React.ReactNode }> = ({ fundo, cor, ponto, children }) => (
  <span className="inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold" style={{ background: fundo, color: cor }}>
    {ponto && <span className="h-1.5 w-1.5 rounded-full" style={{ background: ponto }} />}{children}
  </span>
);

/**
 * Situação do painel em selos: a tela tocando fica verde ("No ar") e o problema que não tira do ar
 * (internet ruim, instável, quente) vem num selo âmbar ao lado. Sem sinal mostra há quanto tempo, ao vivo.
 */
export const SelosEstado: React.FC<{ estado: EstadoPainel; desde?: string | null }> = ({ estado, desde }) => {
  const info = ESTADO_INFO[estado];
  if (estado === 'sem_sinal') return <Selo fundo={info.fundo} cor={info.cor} ponto={info.ponto}>Offline{desde ? <>&nbsp;<TempoFora desde={desde} /></> : null}</Selo>;
  if (estado === 'sem_imagem') return <Selo fundo={info.fundo} cor={info.cor} ponto={info.ponto}>Sem imagem</Selo>;
  const alerta = estado === 'internet_ruim' || estado === 'instavel' || estado === 'quente';
  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      <Selo {...VERDE}>No ar</Selo>
      {alerta && <Selo fundo={info.fundo} cor={info.cor}>{info.rotulo}</Selo>}
    </span>
  );
};

/** O que vai para a operadora de internet: só o nome do prédio e o endereço. */
export function textoParaOperadora(predio: string | null | undefined, endereco: string | null | undefined) {
  return [predio || '', endereco || ''].filter(Boolean).join('\n');
}

export async function copiarTexto(t: string, ok = 'Copiado') {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(t);
    else {
      const a = document.createElement('textarea');
      a.value = t; a.style.position = 'fixed'; a.style.opacity = '0';
      document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove();
    }
    toast.success(ok);
  } catch { toast.error('Não consegui copiar'); }
}
