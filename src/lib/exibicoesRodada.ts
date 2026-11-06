/**
 * EXA (06/11/2026) — FONTE ÚNICA das exibições por tela, igual ao player v22 das telas
 * (public/painel-web/ui/scripts/propagandas.js) e à função exa2-relatorio-pedido:
 *   rodada = todos os horizontais (1 vídeo por pedido), com 1 Vertical Premium a cada 3 horizontais,
 *   1 editorial (Notícias Brasil → Notícias Foz → Curiosidades, ~50 s) e mais 1 vertical no fim.
 *   Os verticais revezam entre si.
 * Números de venda = prédio LOTADO (15 horizontais + 3 verticais): é o mínimo garantido.
 *   23 h/dia → rodada 275 s → horizontal ≈ 301/dia (50 min) · vertical ≈ 502/dia (125 min em tela cheia).
 * Com menos anunciantes no prédio a rodada fica mais curta e todos aparecem mais.
 */
export const EDITORIAL_SEGUNDOS = 50;

export function calcularRodada(p: {
  horasDia?: number;
  diasMes?: number;
  horizontais?: number;
  duracaoHorizontal?: number;
  verticais?: number;
  duracaoVertical?: number;
  editorialSegundos?: number;
}) {
  const horas = p.horasDia ?? 23;
  const diasMes = p.diasMes ?? 30;
  const nH = Math.max(0, p.horizontais ?? 15);
  const dH = p.duracaoHorizontal ?? 10;
  const nP = Math.max(0, p.verticais ?? 3);
  const dV = p.duracaoVertical ?? 15;
  const ed = p.editorialSegundos ?? EDITORIAL_SEGUNDOS;
  const verticaisPorRodada = nP ? (nH > 0 ? Math.floor((nH - 1) / 3) : 0) + 1 : 0;
  const rodadaSegundos = nH * dH + ed + verticaisPorRodada * dV;
  const segundosDia = horas * 3600;
  const rodadasDia = rodadaSegundos > 0 ? segundosDia / rodadaSegundos : 0;
  const horizontalDia = Math.round(rodadasDia);
  const verticalDia = nP ? Math.round((rodadasDia * verticaisPorRodada) / nP) : 0;
  return {
    rodadaSegundos,
    rodadasDia: Math.floor(rodadasDia),
    segundosDia,
    verticaisPorRodada,
    horizontal: { dia: horizontalDia, mes: horizontalDia * diasMes, minutosDia: Math.round((horizontalDia * dH) / 60) },
    vertical: { dia: verticalDia, mes: verticalDia * diasMes, minutosDia: Math.round((verticalDia * dV) / 60) },
  };
}

/** Números oficiais de venda (23 h/dia, 30 dias, prédio lotado). Horizontal ≈ 301/dia · 9.030/mês; Vertical ≈ 502/dia · 15.060/mês. */
export const EXIBICOES_PADRAO = calcularRodada({});
export const exibicoesMesPorTela = (tipoProduto?: string | null) =>
  String(tipoProduto || '').startsWith('vertical') ? EXIBICOES_PADRAO.vertical.mes : EXIBICOES_PADRAO.horizontal.mes;
