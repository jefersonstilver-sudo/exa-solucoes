/**
 * Monta o que cada faixa (área de vídeo) do layout toca, a partir do estado do servidor.
 * Regras:
 *  - anúncios em rodízio (1 vídeo por pedido, o que vale agora pela agenda);
 *  - a cada N anúncios entra 1 vídeo da casa (vídeos do próprio comerciante, em rodízio);
 *  - no layout H6 a cada M anúncios entra 1 quadro editorial (câmera ao vivo ↔ notícia, alternando);
 *  - layout com área vertical: vídeos verticais vão para ela; nos outros, o vertical toca na área
 *    principal com fundo desfocado (anunciante pagou pelo local, não some);
 *  - sem anúncio e sem casa: a tela vive de câmera e notícia (nunca fica preta).
 */
import type { Camera, Estado, ItemVideo, Noticia } from './api';

export type ItemFaixa =
  | { k: string; tipo: 'video'; v: ItemVideo }
  | { k: string; tipo: 'camera'; cam: Camera; dur: number }
  | { k: string; tipo: 'noticia'; n: Noticia; dur: number };

export interface Layout {
  id: string;
  nome: string;
  /** a área principal recebe quadros editoriais na sequência (H6) */
  editorialNaSequencia?: boolean;
  /** tem área própria para vídeo vertical */
  temVertical?: boolean;
  /** tem duas áreas horizontais (H4) */
  duasHorizontais?: boolean;
  /** proporção da área principal */
  principal: '16:9' | '6:5';
}

export const LAYOUTS: Record<string, Layout> = {
  H1: { id: 'H1', nome: 'TV em L', principal: '16:9' },
  H2: { id: 'H2', nome: 'Horizontal + vertical', principal: '16:9', temVertical: true },
  H3: { id: 'H3', nome: 'Tela cheia limpa', principal: '16:9' },
  H4: { id: 'H4', nome: 'Vitrine (3 ao mesmo tempo)', principal: '16:9', temVertical: true, duasHorizontais: true },
  H5: { id: 'H5', nome: 'Tela cheia + vertical flutuante', principal: '16:9', temVertical: true },
  H6: { id: 'H6', nome: 'Tela cheia intercalada (câmera e notícia)', principal: '16:9', editorialNaSequencia: true },
  H7: { id: 'H7', nome: 'Tela cheia + janela que alterna', principal: '16:9' },
  L1: { id: 'L1', nome: 'Coluna informativa (6:5)', principal: '6:5' },
  L2: { id: 'L2', nome: 'Câmera ao vivo (6:5)', principal: '6:5' },
  L3: { id: 'L3', nome: 'Cinema (6:5)', principal: '6:5' },
  L4: { id: 'L4', nome: 'Tela cheia com faixa (6:5 ou 16:9)', principal: '16:9' },
};
export const layoutDe = (id?: string) => LAYOUTS[String(id || '').toUpperCase()] || LAYOUTS.H1;

let girarCamera = 0;
let girarNoticia = 0;
const proxCamera = (cams: Camera[]) => cams[(girarCamera++) % cams.length];
const proxNoticia = (ns: Noticia[]) => ns[(girarNoticia++) % ns.length];

const ehVertical = (v: ItemVideo) => v.formato === 'v';
const video = (v: ItemVideo): ItemFaixa => ({ k: `v:${v.id}`, tipo: 'video', v });

function editoriais(e: Estado, quantos: number): ItemFaixa[] {
  const cams = e.ritmo?.camera === false ? [] : e.cameras || [];
  const ns = e.ritmo?.noticias === false ? [] : e.noticias || [];
  const out: ItemFaixa[] = [];
  for (let i = 0; i < quantos; i++) {
    const querCamera = i % 2 === 0;
    if (querCamera && cams.length) { const c = proxCamera(cams); out.push({ k: `c:${i}:${c.url}`, tipo: 'camera', cam: c, dur: c.segundos || 14 }); }
    else if (ns.length) { const n = proxNoticia(ns); out.push({ k: `n:${i}:${n.titulo}`, tipo: 'noticia', n, dur: 12 }); }
    else if (cams.length) { const c = proxCamera(cams); out.push({ k: `c:${i}:${c.url}`, tipo: 'camera', cam: c, dur: c.segundos || 14 }); }
  }
  return out;
}

/** Intercala a casa (e o editorial no H6) entre os anúncios. */
function intercalar(base: ItemVideo[], casa: ItemVideo[], e: Estado, editorial: boolean): ItemFaixa[] {
  const cada = Math.max(1, Math.round(Number(e.ritmo?.casa_a_cada) || 3));
  const edCada = Math.max(1, Math.round(Number(e.ritmo?.editorial_a_cada) || 2));
  const out: ItemFaixa[] = [];
  const nEd = editorial ? Math.max(1, Math.ceil(Math.max(base.length, 1) / edCada)) : 0;
  const eds = editoriais(e, nEd);
  let ci = 0, ei = 0;
  if (!base.length) {
    // só a casa (ou nada): casa e editorial se alternam
    casa.forEach((c) => { out.push(video(c)); if (editorial && eds.length) out.push(eds[(ei++) % eds.length]); });
    if (!out.length) return editoriais(e, 6);
    return out;
  }
  base.forEach((a, i) => {
    out.push(video(a));
    const n = i + 1;
    if (casa.length && n % cada === 0) out.push(video({ ...casa[(ci++) % casa.length], id: `${casa[(ci - 1) % casa.length].id}#${n}` }));
    if (editorial && eds.length && n % edCada === 0) out.push(eds[(ei++) % eds.length]);
  });
  // casa que não coube no ciclo (poucos anúncios): entra 1 vez no fim
  if (casa.length && base.length < cada) out.push(video({ ...casa[(ci++) % casa.length], id: `${casa[(ci - 1) % casa.length].id}#fim` }));
  return out;
}

export interface Faixas { principal: ItemFaixa[]; segunda: ItemFaixa[]; vertical: ItemFaixa[] }

export function montarFaixas(e: Estado, layout: Layout): Faixas {
  const anuncios = e.anuncios || [];
  const casa = e.casa || [];
  const hAn = anuncios.filter((v) => !ehVertical(v));
  const vAn = anuncios.filter(ehVertical);
  const hCasa = casa.filter((v) => !ehVertical(v));
  const vCasa = casa.filter(ehVertical);

  if (!layout.temVertical) {
    // vertical toca na principal com fundo desfocado
    return { principal: intercalar([...hAn, ...vAn], [...hCasa, ...vCasa], e, !!layout.editorialNaSequencia), segunda: [], vertical: [] };
  }
  const vertical = intercalar(vAn, vCasa, { ...e, ritmo: { ...(e.ritmo as any), camera: false, noticias: false } }, false).filter((x) => x.tipo === 'video');
  if (!layout.duasHorizontais) return { principal: intercalar(hAn, hCasa, e, false), segunda: [], vertical };
  // H4: duas áreas horizontais — divide o rodízio entre elas
  const a = hAn.filter((_, i) => i % 2 === 0);
  const b = hAn.filter((_, i) => i % 2 === 1);
  const casaA = hCasa.filter((_, i) => i % 2 === 0);
  const casaB = hCasa.length > 1 ? hCasa.filter((_, i) => i % 2 === 1) : hCasa;
  return { principal: intercalar(a, casaA.length ? casaA : hCasa, e, false), segunda: b.length || casaB.length ? intercalar(b, casaB, e, false) : [], vertical };
}

/** Todas as URLs de vídeo que a tela precisa ter no aparelho. */
export const urlsDoEstado = (e: Estado) => [...new Set([...(e.anuncios || []), ...(e.casa || [])].map((v) => v.url).filter(Boolean))];
