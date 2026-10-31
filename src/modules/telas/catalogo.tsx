/** Catálogo dos 11 layouts das telas novas (mesmos ids do player em src/tela) com miniatura esquemática. */
import React from 'react';

type Bloco = [number, number, number, number, 'v' | 'vv' | 'i' | 'n' | 'c' | 'b'];
export interface LayoutInfo { id: string; nome: string; resumo: string; aviso?: string; destaque?: boolean; formato: '16:9' | '6:5'; blocos: Bloco[] }

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
export const infoLayout = (id?: string | null) => CATALOGO.find((l) => l.id === id) || CATALOGO[1];

const COR: Record<Bloco[4], string> = {
  v: 'url(#gv)', vv: 'url(#gvv)', i: 'rgba(255,255,255,.22)', n: 'rgba(255,255,255,.16)', c: 'url(#gc)', b: 'rgba(234,37,29,.25)',
};

export function MiniLayout({ id, largura = 160, className }: { id: string; largura?: number; className?: string }) {
  const l = infoLayout(id);
  const k = `ml-${id}`;
  return (
    <svg viewBox="0 0 1920 1080" width={largura} height={(largura * 9) / 16} className={className} role="img" aria-label={`Layout ${l.nome}`}>
      <defs>
        <linearGradient id="gv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EA251D" /><stop offset="1" stopColor="#7A1020" /></linearGradient>
        <linearGradient id="gvv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B4236B" /><stop offset="1" stopColor="#5A1040" /></linearGradient>
        <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B5C9A" /><stop offset="1" stopColor="#1A2540" /></linearGradient>
        <clipPath id={k}><rect width="1920" height="1080" rx="60" /></clipPath>
      </defs>
      <g clipPath={`url(#${k})`}>
        <rect width="1920" height="1080" fill="#140A12" />
        {l.blocos.map(([x, y, w, h, t], i) => <rect key={i} x={x} y={y} width={w} height={h} rx={t === 'v' || t === 'b' ? 0 : 26} fill={COR[t]} />)}
      </g>
    </svg>
  );
}
