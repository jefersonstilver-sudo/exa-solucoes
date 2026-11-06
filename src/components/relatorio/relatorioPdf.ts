// EXA (06/11/2026) — PDF do Relatório do pedido (jsPDF, A4 retrato, sem dependências extras).
import type { Relatorio } from './useRelatorio';
import { nf, dataBR, mesBR, SITUACAO, SERIE } from './useRelatorio';

const VINHO: [number, number, number] = [156, 30, 30];
const TINTA: [number, number, number] = [27, 23, 25];
const CINZA: [number, number, number] = [139, 130, 133];

export async function baixarRelatorioPdf(r: Relatorio) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 14, L = W - 2 * M;
  let y = 0;

  const rodape = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal');
      doc.text(`EXA Mídia · examidia.com.br · Relatório gerado em ${dataBR(r.gerado_em)}`, M, 290);
      doc.text(`${i}/${n}`, W - M, 290, { align: 'right' });
    }
  };
  const quebra = (h: number) => { if (y + h > 280) { doc.addPage(); y = 18; } };
  const titulo = (t: string) => {
    quebra(14); y += 4;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...VINHO);
    doc.text(t.toUpperCase(), M, y); y += 2;
    doc.setDrawColor(235, 230, 231); doc.line(M, y, W - M, y); y += 5;
  };
  const tabela = (cab: string[], larg: number[], linhas: string[][], alinhar: ('l' | 'r')[] = []) => {
    const linha = (cols: string[], negrito: boolean) => {
      quebra(6);
      doc.setFont('helvetica', negrito ? 'bold' : 'normal'); doc.setFontSize(8.5); doc.setTextColor(...(negrito ? CINZA : TINTA));
      let x = M;
      cols.forEach((c, i) => {
        const txt = doc.splitTextToSize(String(c ?? ''), larg[i] - 2)[0] || '';
        if (alinhar[i] === 'r') doc.text(txt, x + larg[i] - 1, y, { align: 'right' }); else doc.text(txt, x, y);
        x += larg[i];
      });
      y += 5.2;
    };
    linha(cab, true);
    linhas.forEach((l) => linha(l, false));
  };

  // capa
  doc.setFillColor(...VINHO); doc.rect(0, 0, W, 44, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('EXA MÍDIA · RELATÓRIO DE VEICULAÇÃO', M, 13);
  doc.setFontSize(19); doc.text(doc.splitTextToSize(r.pedido.nome, L)[0], M, 25);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(`${r.formato.produto} · ${dataBR(r.pedido.inicio)} a ${dataBR(r.pedido.fim)}${r.pedido.cliente ? ' · ' + r.pedido.cliente : ''}`, M, 34);
  doc.text(`${r.pedido.dias_no_ar} dias no ar${r.pedido.dias_restantes != null ? ` · ${r.pedido.dias_restantes} dias restantes` : ''}`, M, 40);
  y = 54;

  // números
  const cards: [string, string][] = [
    ['Exibições estimadas', nf(r.totais.exibicoes)],
    ['Média por dia', nf(r.totais.media_dia)],
    ['Horas de tela', nf(r.totais.horas_tela)],
    ['Prédios', nf(r.totais.predios)],
    ['Telas', nf(r.totais.telas)],
    ['Telas no ar', `${r.totais.disponibilidade.toLocaleString('pt-BR')}%`],
    ['Vídeos publicados', nf(r.totais.videos_publicados)],
    ['Público dos prédios', nf(r.totais.publico)],
  ];
  const cw = L / 4;
  cards.forEach(([k, v], i) => {
    const x = M + (i % 4) * cw, yy = y + Math.floor(i / 4) * 20;
    doc.setFillColor(247, 245, 246); doc.roundedRect(x + 1, yy, cw - 2, 17, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...TINTA); doc.text(v, x + 4, yy + 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...CINZA); doc.text(k, x + 4, yy + 13.5);
  });
  y += 44;

  titulo('Como sua marca aparece');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...TINTA);
  const como = `Formato ${r.formato.produto}, vídeo de ${r.formato.duracao_s} s. Os painéis funcionam ${r.formato.horas_dia} h por dia; sua marca aparece cerca de ${nf(r.formato.exibicoes_dia_tela)} vezes por tela por dia.`;
  doc.splitTextToSize(como, L).forEach((l: string) => { quebra(5); doc.text(l, M, y); y += 4.6; });

  titulo('Exibições por mês');
  const max = Math.max(1, ...r.meses.map((m) => m.exibicoes));
  r.meses.forEach((m) => {
    quebra(6);
    doc.setFontSize(8.5); doc.setTextColor(...TINTA); doc.setFont('helvetica', 'normal');
    doc.text(mesBR(m.mes), M, y);
    doc.setFillColor(...VINHO); doc.rect(M + 16, y - 3, Math.max(0.5, (m.exibicoes / max) * (L - 60)), 3.6, 'F');
    doc.text(`${nf(m.exibicoes)} (${m.dias} d)`, W - M, y, { align: 'right' });
    y += 5.6;
  });

  titulo('Prédios');
  tabela(['Prédio', 'Bairro', 'Telas', 'No ar', 'Exibições'], [70, 46, 18, 20, 28],
    r.predios.map((p) => [p.nome, p.bairro, String(p.telas), `${p.disponibilidade.toLocaleString('pt-BR')}%`, nf(p.exibicoes)]), ['l', 'l', 'r', 'r', 'r']);

  titulo('Vídeos publicados');
  const s = r.publicacoes.series;
  const resumo = Object.entries(s).map(([k, v]) => `${SERIE[k as keyof typeof SERIE] || k}: ${v.videos} vídeo(s) em ${v.semanas} semana(s)`).join(' · ');
  if (resumo) { doc.setFontSize(9); doc.setTextColor(...TINTA); doc.text(doc.splitTextToSize(resumo, L), M, y); y += 7; }
  tabela(['Vídeo', 'Tipo', 'Publicado', 'Situação', 'Exibições'], [78, 22, 24, 26, 32],
    r.videos.map((v) => [v.nome, SERIE[v.serie], dataBR(v.publicado_em), SITUACAO[v.situacao], v.exibicoes != null ? nf(v.exibicoes) : '—']), ['l', 'l', 'l', 'l', 'r']);

  titulo('Metodologia');
  doc.setFontSize(8); doc.setTextColor(...CINZA);
  doc.splitTextToSize(r.metodologia, L).forEach((l: string) => { quebra(4.5); doc.text(l, M, y); y += 4; });

  rodape();
  const nome = r.pedido.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase();
  doc.save(`relatorio-exa-${nome}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
