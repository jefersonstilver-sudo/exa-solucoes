/** Catálogo dos 11 layouts das telas novas (mesmos ids do player em src/tela) com miniatura esquemática. */
import React from 'react';

type Bloco = [number, number, number, number, 'v' | 'vv' | 'i' | 'n' | 'c' | 'b'];
export interface LayoutInfo { id: string; nome: string; resumo: string; aviso?: string; destaque?: boolean; formato: '16:9' | '6:5' | '9:16'; blocos: Bloco[] }

export const CATALOGO: LayoutInfo[] = [
  { id: 'H6', nome: 'Tela cheia intercalada', resumo: 'Anúncio em tela cheia; entre eles entra a câmera ao vivo da ponte ou a notícia de Foz, com chamada "em N segundos".', destaque: true, formato: '16:9',
    blocos: [[0, 0, 1920, 1080, 'v'], [1500, 32, 384, 140, 'i'], [1460, 900, 424, 130, 'c']] },
  { id: 'H1', nome: 'TV em L', resumo: 'Vídeo grande, coluna com hora, clima e notícia, e faixa "A seguir".', formato: '16:9',
    blocos: [[0, 0, 1440, 810, 'v'], [1462, 22, 436, 170, 'i'], [1462, 210, 436, 150, 'i'], [1462, 378, 436, 410, 'n'], [200, 840, 400, 200, 'i'], [630, 840, 400, 200, 'i'], [1060, 840, 400, 200, 'i'], [1490, 840, 400, 200, 'i']] },
  { id: 'H3', nome: 'Tela cheia limpa', resumo: 'Só o anúncio, com hora e clima discretos no canto.', formato: '16:9',
    blocos: [[0, 0, 1920, 1080, 'v'], [1560, 32, 328, 80, 'i']] },
  { id: 'H7', nome: 'Tela cheia + janela', resumo: 'Anúncio em tela cheia e uma janela no canto alternando câmera, notícia e curiosidade.', formato: '16:9',
    blocos: [[0, 0, 1920, 1080, 'v'], [1500, 32, 384, 140, 'i'], [1284, 702, 600, 338, 'c']] },
  { id: 'H5', nome: 'Vertical flutuante', resumo: 'Anúncio em tela cheia e um vídeo vertical flutuando à direita.', aviso: 'Sem vídeo vertical, vira tela cheia.', formato: '16:9',
    blocos: [[0, 0, 1920, 1080, 'v'], [1536, 230, 340, 604, 'vv'], [36, 920, 560, 120, 'i']] },
  { id: 'H2', nome: 'Horizontal + vertical', resumo: 'Dois anúncios ao mesmo tempo (16:9 e vertical) e informações embaixo.', aviso: 'Sem vertical, a coluna mostra a câmera ao vivo.', formato: '16:9',
    blocos: [[0, 0, 1312, 738, 'v'], [1316, 0, 604, 1080, 'vv'], [24, 762, 330, 294, 'i'], [374, 762, 250, 294, 'i'], [644, 762, 644, 294, 'n']] },
  { id: 'H4', nome: 'Vitrine (3 ao mesmo tempo)', resumo: 'Dois horizontais e um vertical tocando juntos, mais coluna de informações.', aviso: 'Pesado: 3 vídeos juntos. Só em aparelho bom.', formato: '16:9',
    blocos: [[0, 0, 960, 540, 'v'], [0, 544, 960, 536, 'v'], [964, 0, 604, 1080, 'vv'], [1588, 22, 312, 170, 'i'], [1588, 210, 312, 140, 'i'], [1588, 370, 312, 640, 'n']] },
  { id: 'L1', nome: 'Coluna informativa (6:5)', resumo: 'Vídeo 6:5 de hoje à esquerda; hora, clima, notícia e "A seguir" à direita.', formato: '6:5',
    blocos: [[0, 0, 1296, 1080, 'v'], [1320, 24, 576, 196, 'i'], [1320, 240, 576, 166, 'i'], [1320, 426, 576, 330, 'n'], [1320, 776, 576, 280, 'i']] },
  { id: 'L2', nome: 'Câmera ao vivo (6:5)', resumo: 'Vídeo 6:5 e, ao lado, a câmera da ponte com hora, clima e notícia.', formato: '6:5',
    blocos: [[0, 0, 1296, 1080, 'v'], [1320, 24, 330, 190, 'i'], [1666, 24, 230, 190, 'i'], [1320, 234, 576, 470, 'c'], [1320, 724, 576, 332, 'n']] },
  { id: 'L3', nome: 'Cinema (6:5)', resumo: 'Vídeo 6:5 no centro com o fundo desfocado dele mesmo.', formato: '6:5',
    blocos: [[0, 0, 1920, 1080, 'b'], [312, 0, 1296, 1080, 'v'], [1636, 28, 256, 180, 'i']] },
  { id: 'L4', nome: 'Tela cheia com faixa', resumo: 'Anúncio em tela cheia e uma faixa embaixo com hora, clima, notícia e "A seguir".', formato: '16:9',
    blocos: [[0, 0, 1920, 1080, 'v'], [28, 912, 1864, 140, 'i']] },
];
/** TV em pé num estabelecimento (os outros verticais V1, V3 e V4 estão em aprovação no canvas). */
export const CATALOGO_V: LayoutInfo[] = [
  { id: 'V2', nome: 'Como o elevador', resumo: 'Vídeo 6:5 em cima; hora, clima, câmera ao vivo e "A seguir" embaixo.', destaque: true, formato: '9:16',
    blocos: [[0, 0, 1080, 900, 'v'], [24, 924, 506, 210, 'i'], [550, 924, 506, 210, 'i'], [24, 1154, 1032, 470, 'c'], [24, 1646, 1032, 250, 'i']] },
];
/** TV em pé num prédio: a mesma tela do elevador daquele prédio. */
export const REPLICA: LayoutInfo = { id: 'R', nome: 'Réplica do elevador', resumo: 'A mesma tela do elevador deste prédio: anúncios, avisos do síndico, câmera e notícias.', destaque: true, formato: '9:16',
  blocos: [[0, 0, 1080, 765, 'v'], [20, 785, 510, 1050, 'n'], [550, 785, 510, 330, 'i'], [550, 1135, 510, 400, 'c'], [550, 1555, 510, 280, 'i']] };
const TODOS = [...CATALOGO, ...CATALOGO_V, REPLICA];
export const infoLayout = (id?: string | null) => TODOS.find((l) => l.id === id) || CATALOGO[1];
export const ehLayoutVertical = (id?: string | null) => /^(V\d|R)$/.test(String(id || ''));

const COR: Record<Bloco[4], string> = {
  v: 'url(#gv)', vv: 'url(#gvv)', i: 'rgba(255,255,255,.22)', n: 'rgba(255,255,255,.16)', c: 'url(#gc)', b: 'rgba(234,37,29,.25)',
};

export function MiniLayout({ id, largura = 160, className }: { id: string; largura?: number; className?: string }) {
  const l = infoLayout(id);
  const k = `ml-${id}`;
  const pe = l.formato === '9:16';
  const [W, H] = pe ? [1080, 1920] : [1920, 1080];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={largura} height={(largura * H) / W} className={className} role="img" aria-label={`Layout ${l.nome}`}>
      <defs>
        <linearGradient id="gv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EA251D" /><stop offset="1" stopColor="#7A1020" /></linearGradient>
        <linearGradient id="gvv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B4236B" /><stop offset="1" stopColor="#5A1040" /></linearGradient>
        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B5C9A" /><stop offset="1" stopColor="#1A2540" /></linearGradient>
        <clipPath id={k}><rect width={W} height={H} rx="60" /></clipPath>
      </defs>
      <g clipPath={`url(#${k})`}>
        <rect width={W} height={H} fill="#140A12" />
        {l.blocos.map(([x, y, w, h, t], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={t === 'v' || t === 'b' ? 0 : 26} fill={COR[t]} />)}
      </g>
    </svg>
  );
}

/** Grade para escolher o layout (admin e área do cliente). No celular mostra só o desenho e o nome. */
export function GradeLayouts({ valor, onEscolher, atual, aplicando, vertical, predio }: { valor: string; onEscolher: (id: string) => void; atual?: string; aplicando?: string | null; vertical?: boolean; predio?: boolean }) {
  const lista = vertical ? (predio ? [REPLICA] : CATALOGO_V) : CATALOGO;
  return (
    <div className={`grid gap-2 ${vertical ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {lista.map((l) => {
        const sel = valor === l.id;
        return (
          <button key={l.id} type="button" disabled={!!aplicando} onClick={() => onEscolher(l.id)}
            className={`relative flex flex-col gap-1.5 rounded-2xl border p-2 text-left outline-none transition-colors disabled:opacity-60 ${sel ? 'border-[#9C1E1E] bg-[#9C1E1E]/[0.05] ring-2 ring-[#9C1E1E]/30' : 'border-black/10 active:bg-black/[0.03] sm:hover:border-black/25'}`}>
            <MiniLayout id={l.id} largura={200} className={vertical ? 'mx-auto h-auto w-1/2' : 'h-auto w-full'} />
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-[#9C1E1E]">{l.id}</span>
              <span className="truncate text-[13px] font-bold">{l.nome}</span>
            </div>
            <span className="hidden text-[11.5px] leading-snug text-[#5E5F63] sm:block">{l.resumo}</span>
            {l.destaque && <span className="self-start rounded-full bg-[#E3F4EA] px-2 py-0.5 text-[11px] font-bold text-[#1E6B47]">Mais atenção</span>}
            {l.aviso && <span className="hidden text-[11px] font-semibold text-[#8A5A00] sm:block">{l.aviso}</span>}
            {atual === l.id && <span className="absolute right-3 top-3 rounded-full bg-[#1b1719] px-2 py-0.5 text-[10.5px] font-bold text-white">Atual</span>}
            {aplicando === l.id && <span className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70 text-[13px] font-bold text-[#9C1E1E]">Aplicando…</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Ao vincular a TV a um local: deitada ou em pé (e, em pé, para que lado a TV foi girada). */
export function EscolherOrientacao({ orientacao, giro, onOrientacao, onGiro, predio }: {
  orientacao: 'horizontal' | 'vertical'; giro: number; onOrientacao: (o: 'horizontal' | 'vertical') => void; onGiro: (g: number) => void; predio?: boolean;
}) {
  const Tv = ({ pe }: { pe?: boolean }) => (
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
      {pe ? <rect x="20" y="6" width="24" height="42" rx="3" /> : <rect x="6" y="14" width="52" height="30" rx="3" />}
      <path d={pe ? 'M26 56h12M32 48v8' : 'M24 54h16M32 44v10'} strokeLinecap="round" />
    </svg>
  );
  const Op = ({ v, titulo, sub, pe }: { v: 'horizontal' | 'vertical'; titulo: string; sub: string; pe?: boolean }) => (
    <button type="button" onClick={() => onOrientacao(v)} aria-pressed={orientacao === v}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${orientacao === v ? 'border-[#9C1E1E] bg-[#9C1E1E]/[0.05] text-[#9C1E1E] ring-2 ring-[#9C1E1E]/25' : 'border-black/10 text-[#17181A] hover:border-black/25'}`}>
      <Tv pe={pe} />
      <span className="min-w-0"><b className="block text-[14px]">{titulo}</b><span className="block text-[12px] leading-snug text-[#5E5F63]">{sub}</span></span>
    </button>
  );
  const giros: [number, string][] = [[90, 'TV girada para a esquerda'], [270, 'TV girada para a direita'], [0, 'O aparelho já sai em pé']];
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Op v="horizontal" titulo="Horizontal" sub="TV deitada, como uma TV comum" />
        <Op v="vertical" titulo="Vertical" pe sub={predio ? 'TV em pé: a mesma tela do elevador do prédio, com os avisos do síndico' : 'TV em pé: layouts verticais'} />
      </div>
      {orientacao === 'vertical' && (
        <div className="rounded-2xl bg-black/[0.035] p-3">
          <span className="block text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Como a TV foi girada</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {giros.map(([g, t]) => (
              <button key={g} type="button" onClick={() => onGiro(g)} aria-pressed={giro === g}
                className={`h-10 rounded-xl px-3 text-[13px] font-bold ${giro === g ? 'bg-[#17181A] text-white' : 'border border-black/10 bg-white'}`}>{t}</button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[#6A6B70]">Se a imagem aparecer de cabeça para baixo, troque aqui: a TV muda em até 1 minuto.</p>
        </div>
      )}
    </div>
  );
}
