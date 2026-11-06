// EXA (06/11/2026) — PDF do Relatório (layout aprovado pelo Jeferson em 06/11): A4 retrato.
// Página 1: capa vinho com logo da EXA e do cliente, total, tela do elevador com a miniatura do vídeo no ar, números,
// a rodada desenhada, barras por mês e linha do tempo. Página 2+: vídeos com miniatura e exibições, mapa e prédios.
import type { Relatorio, RelatorioVideo } from './useRelatorio';
import { nf, dataBR, mesCurto, periodoTexto, SERIE, exibicoesAte, videoNoAr, ehAgora } from './useRelatorio';
import { imagemComoDataUrl, mapaComoImagem, miniaturaDoVideo } from './midia';

type RGB = [number, number, number];
const VINHO: RGB = [109, 19, 23];
const VERMELHO: RGB = [156, 30, 30];
const TINTA: RGB = [27, 23, 25];
const CINZA: RGB = [111, 102, 105];
const CLARO: RGB = [247, 245, 246];
const ROSA: RGB = [244, 207, 211];
const COR: Record<string, RGB[]> = { cinema: [[158, 27, 52], [182, 59, 82]], hotel: [[37, 99, 235], [91, 141, 239]], geral: [[111, 102, 105], [154, 145, 148]] };

const tipoImg = (d: string) => (d.startsWith('data:image/png') ? 'PNG' : 'JPEG');
const tamanhoImg = (d: string): Promise<{ w: number; h: number }> =>
  new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.width, h: i.height }); i.onerror = () => res({ w: 1, h: 1 }); i.src = d; });

/** Logo claro (branco sobre transparente)? Média de brilho dos pixels visíveis. */
const logoEhClaro = (d: string): Promise<boolean> => new Promise((res) => {
  const i = new Image();
  i.onload = () => {
    try {
      const w = 64, h = Math.max(1, Math.round((i.height / i.width) * 64));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d')!; g.drawImage(i, 0, 0, w, h);
      const px = g.getImageData(0, 0, w, h).data; let soma = 0, n = 0, transp = 0;
      for (let k = 0; k < px.length; k += 4) { if (px[k + 3] < 40) { transp++; continue; } soma += 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]; n++; }
      res(n > 0 && transp > (px.length / 4) * 0.15 && soma / n > 200);
    } catch { res(false); }
  };
  i.onerror = () => res(false); i.src = d;
});

export async function baixarRelatorioPdf(r: Relatorio, logoCliente?: string | null, o: { exibicoes?: number } = {}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 15, L = W - 2 * M;

  // imagens (tudo antes de desenhar)
  const noAr = videoNoAr(r); // mesma regra da página (r já vem com o "no ar agora" marcado)
  const noArAgora = ehAgora(r, noAr);
  const lista = r.videos; // todos os vídeos (o PDF é o histórico completo)
  const [logoExa, logoExaVinho, logoCli, mapa, ...minis] = await Promise.all([
    imagemComoDataUrl('/relatorio/exa-branco.png'),
    imagemComoDataUrl('/relatorio/exa-vinho.png'),
    imagemComoDataUrl(logoCliente || null),
    mapaComoImagem(r.predios.map((p) => ({ lat: p.lat || 0, lng: p.lng || 0, nome: p.nome })), 900, 470),
    ...[noAr, ...lista].map((v) => miniaturaDoVideo(v?.url, { pronta: v?.miniatura, videoId: v?.id, pedidoId: r.pedido.id }).then((m) => (m && !m.startsWith('data:') ? imagemComoDataUrl(m) : m))),
  ]);
  const miniNoAr = minis[0];
  const miniDe = new Map<string, string | null>(lista.map((v, i) => [v.id, minis[i + 1]]));

  const txt = (s: string, x: number, y: number, o: { size?: number; bold?: boolean; cor?: RGB; align?: 'left' | 'right' | 'center'; max?: number } = {}) => {
    doc.setFont('helvetica', o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size || 10); doc.setTextColor(...(o.cor || TINTA));
    const t = o.max ? (doc.splitTextToSize(s, o.max) as string[]) : s;
    doc.text(t, x, y, { align: o.align || 'left' });
    return Array.isArray(t) ? t.length : 1;
  };
  const caixa = (x: number, y: number, w: number, h: number, cor: RGB, raio = 3) => { doc.setFillColor(...cor); doc.roundedRect(x, y, w, h, raio, raio, 'F'); };
  const logo = async (d: string | null, x: number, y: number, hMax: number, wMax: number, alinhar: 'left' | 'right' = 'left') => {
    if (!d) return;
    const s = await tamanhoImg(d); const k = Math.min(hMax / s.h, wMax / s.w); const w = s.w * k, h = s.h * k;
    doc.addImage(d, tipoImg(d), alinhar === 'right' ? x - w : x, y + (hMax - h) / 2, w, h);
  };
  const rotulo = (s: string, x: number, y: number) => txt(s.toUpperCase(), x, y, { size: 7.5, bold: true, cor: VERMELHO });
  const rodape = (pg: number, tot: number) => {
    doc.setDrawColor(238, 233, 234); doc.line(M, 284, W - M, 284);
    txt(`EXA Mídia · examidia.com.br · gerado em ${dataBR(r.gerado_em)}`, M, 289, { size: 7.5, cor: CINZA });
    txt(`${pg}/${tot}`, W - M, 289, { size: 7.5, cor: CINZA, align: 'right' });
  };

  // ===================== PÁGINA 1 =====================
  doc.setFillColor(...VINHO); doc.rect(0, 0, W, 118, 'F');
  await logo(logoExa, M, 11, 9, 40);
  if (logoCli) {
    if (await logoEhClaro(logoCli)) await logo(logoCli, W - M, 8, 15, 42, 'right'); // logo branco: direto no vinho (caixa branca o apagava)
    else { caixa(W - M - 30, 8, 30, 15, [255, 255, 255], 3); await logo(logoCli, W - M - 2, 9.5, 12, 26, 'right'); }
  }
  txt(`RELATÓRIO DE VEICULAÇÃO · ${new Date(r.gerado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}`, M, 35, { size: 7.5, bold: true, cor: ROSA });
  txt(r.pedido.cliente || r.pedido.nome, M, 45, { size: 21, bold: true, cor: [255, 255, 255], max: 130 });
  txt(`${r.formato.tela_cheia ? 'Vertical Premium · tela cheia' : 'Horizontal'} · ${dataBR(r.pedido.inicio)} a ${dataBR(r.pedido.fim)}`, M, 53, { size: 9, cor: [249, 228, 230] });
  txt('Sua marca apareceu', M, 68, { size: 9.5, cor: ROSA });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(36); doc.setTextColor(255, 255, 255);
  const total = nf(o.exibicoes ?? exibicoesAte(r)); doc.text(total, M, 82); // mesmo número do contador da página
  const wTot = doc.getTextWidth(total);
  txt('vezes', M + wTot + 2.5, 82, { size: 14, bold: true, cor: [255, 255, 255] });
  txt(`em ${r.totais.telas} telas nos elevadores de Foz do Iguaçu`, M, 90, { size: 9.5, cor: [249, 228, 230] });
  // barra do contrato
  txt(`${r.pedido.dias_no_ar} dias no ar`, M, 102, { size: 8, cor: ROSA });
  if (r.pedido.dias_restantes != null) txt(`${r.pedido.dias_restantes} dias restantes`, M + 125, 102, { size: 8, cor: ROSA, align: 'right' });
  caixa(M, 105, 125, 2.6, [140, 60, 64], 1.3); caixa(M, 105, 125 * (r.pedido.progresso / 100), 2.6, [255, 255, 255], 1.3);
  // tela do elevador
  const tw = r.formato.tela_cheia ? 40 : 52, th = r.formato.tela_cheia ? 71 : 44, tx = W - M - tw, ty = 30;
  caixa(tx - 2, ty - 2, tw + 4, th + 4, [20, 16, 18], 4);
  if (miniNoAr) doc.addImage(miniNoAr, 'JPEG', tx, ty, tw, th); else caixa(tx, ty, tw, th, [59, 31, 39], 3);
  if (noAr) txt(`${noArAgora ? 'No ar agora' : 'Último vídeo'} · ${noAr.titulo}`, tx + tw / 2, ty + th + 7, { size: 7, bold: true, cor: [255, 255, 255], align: 'center', max: 60 });

  // números
  let y = 128;
  const kpis: [string, string][] = [
    [nf(r.totais.media_dia), 'exibições por dia, somando as telas'],
    [`${r.formato.minutos_dia_tela} min`, `por dia em cada tela${r.formato.tela_cheia ? ', em tela cheia' : ''}`],
    [`${nf(r.totais.horas_tela)} h`, 'da sua marca na tela'],
    [`${r.totais.telas}`, 'telas nos elevadores'],
  ];
  const kw = (L - 9) / 4;
  kpis.forEach(([v, t], i) => {
    const x = M + i * (kw + 3);
    caixa(x, y, kw, 22, CLARO, 3);
    txt(v, x + 4, y + 10, { size: 15, bold: true });
    txt(t, x + 4, y + 16, { size: 7, cor: CINZA, max: kw - 8 });
  });

  // rodada
  y += 33; rotulo('Como sua marca aparece em cada tela', M, y); y += 4;
  const t = r.rodada_tipica || { horizontais: 12, verticais: 3, verticais_por_rodada: 4, segundos: r.formato.ciclo_s };
  const nH = Math.min(15, t.horizontais);
  const blocos: string[] = []; let nV = 0;
  const pushV = () => { blocos.push(r.formato.tela_cheia ? (nV % Math.max(1, t.verticais) === 0 ? 'v' : 'o') : 'o'); nV++; };
  for (let h = 0; h < nH; h++) { blocos.push(!r.formato.tela_cheia && h === 0 ? 'v' : 'h'); if ((h + 1) % 3 === 0 && h + 1 < nH && t.verticais) pushV(); }
  blocos.push('n'); if (t.verticais) pushV();
  const bw = Math.min(8, (L - 12) / (blocos.length + 1.2)); let bx = M;
  for (const b of blocos) {
    const ww = b === 'n' ? bw * 2 : bw, hh = b === 'v' || b === 'o' ? 15 : 7;
    caixa(bx, y + 15 - hh, ww - 1, hh, b === 'v' ? VERMELHO : b === 'o' ? [233, 211, 215] : b === 'n' ? [201, 214, 242] : [228, 222, 224], 1.4);
    if (b === 'v') txt('VOCÊ', bx + (ww - 1) / 2, y + 9, { size: 5, bold: true, cor: [255, 255, 255], align: 'center' });
    bx += ww;
  }
  y += 22;
  txt(`${r.formato.tela_cheia ? 'A sua marca entra em tela cheia, sozinha na tela inteira' : 'A sua marca aparece uma vez em cada rodada'}: ${nf(r.formato.exibicoes_dia_tela)} vezes por dia em cada tela, ${r.formato.minutos_dia_tela} minutos por dia.`, M, y, { size: 8.5, cor: CINZA, max: L });

  // meses
  y += 12; rotulo('Exibições por mês', M, y); y += 4;
  const max = Math.max(1, ...r.meses.map((m) => m.exibicoes));
  const mw = L / Math.max(1, r.meses.length);
  r.meses.forEach((m, i) => {
    const h = Math.max(1, (m.exibicoes / max) * 30), x = M + i * mw;
    const parcial = i === 0 || i === r.meses.length - 1;
    caixa(x + mw * 0.2, y + 6 + 30 - h, mw * 0.6, h, parcial ? [217, 163, 172] : VERMELHO, 1.2);
    txt(`${nf(m.exibicoes / 1000)} mil`, x + mw / 2, y + 4 + 30 - h, { size: 6.5, bold: true, cor: CINZA, align: 'center' });
    txt(mesCurto(m.mes), x + mw / 2, y + 41, { size: 7.5, bold: true, align: 'center' });
  });

  // ===================== PÁGINA 2+ =====================
  const novaPagina = async () => {
    doc.addPage();
    await logo(logoExaVinho, M, 10, 6.5, 26);
    txt(`${r.pedido.cliente || r.pedido.nome} · ${r.formato.tela_cheia ? 'Vertical Premium' : 'Horizontal'}`, W - M, 15, { size: 8, cor: CINZA, align: 'right' });
    doc.setDrawColor(238, 233, 234); doc.line(M, 20, W - M, 20);
    return 30;
  };
  y = await novaPagina();
  // linha do tempo
  rotulo('O que esteve nas telas', M, y); y += 4;
  const ini = Date.parse(r.pedido.inicio + 'T00:00:00'), tot = Math.max(1, Date.now() - ini);
  const pct = (x: number) => Math.max(0, Math.min(1, (x - ini) / tot));
  const series = ['cinema', 'hotel', 'geral'].filter((s) => r.videos.some((v) => v.serie === s && v.periodo));
  for (const s of series) {
    txt(SERIE[s as keyof typeof SERIE], M, y + 5, { size: 8, bold: true, cor: COR[s][0] });
    caixa(M + 20, y, L - 20, 7.5, CLARO, 2);
    r.videos.filter((v) => v.serie === s && v.periodo).forEach((v, i) => {
      const a = pct(Date.parse(v.periodo!.de)), b = pct(Date.parse(v.periodo!.ate));
      caixa(M + 20 + a * (L - 20), y + 1.2, Math.max(0.8, (b - a) * (L - 20) - 0.5), 5.1, COR[s][i % 2], 1.2);
    });
    y += 10;
  }
  const qCin = r.videos.filter((v) => v.serie === 'cinema').length, qHot = r.videos.filter((v) => v.serie === 'hotel').length;
  txt([qCin ? `${qCin} programações do cinema` : '', qHot ? `${qHot} vídeos do hotel` : '', `${r.videos.length} vídeos no total`].filter(Boolean).join(' · '), M, y + 2, { size: 7.5, cor: CINZA });

  y += 12;
  rotulo('Seus vídeos nas telas', M, y); y += 4;
  const cw = (L - 4) / 2, ch = 31;
  for (let i = 0; i < lista.length; i++) {
    const v: RelatorioVideo = lista[i];
    if (y + ch > 278) { y = await novaPagina(); }
    const x = M + (i % 2) * (cw + 4);
    caixa(x, y, cw, ch - 2, CLARO, 3);
    const mi = miniDe.get(v.id);
    if (mi) doc.addImage(mi, 'JPEG', x + 2.5, y + 2.5, 13.5, 24); else caixa(x + 2.5, y + 2.5, 13.5, 24, v.serie === 'hotel' ? [30, 44, 79] : [59, 31, 39], 1.5);
    const corChip = v.serie === 'hotel' ? [37, 87, 199] as RGB : v.serie === 'cinema' ? [158, 27, 52] as RGB : CINZA;
    txt(`${SERIE[v.serie].toUpperCase()}${v.situacao === 'no_ar' ? (v.agora ? ' · NO AR AGORA' : ' · NA PROGRAMAÇÃO') : v.situacao === 'pausado' ? ' · EM PAUSA' : v.situacao === 'aguardando' ? ' · APROVADO' : ''}`, x + 19, y + 7, { size: 6.5, bold: true, cor: corChip });
    const linhas = txt(v.titulo, x + 19, y + 11.5, { size: 8.5, bold: true, max: cw - 22 });
    txt(periodoTexto(v), x + 19, y + 11.5 + linhas * 3.6, { size: 7, cor: CINZA, max: cw - 22 });
    if (v.exibicoes != null) { txt(nf(v.exibicoes), x + 19, y + 25.5, { size: 11, bold: true }); txt('exibições', x + 19 + doc.getTextWidth(nf(v.exibicoes)) + 2, y + 25.5, { size: 7, cor: CINZA }); }
    if (i % 2 === 1 || i === lista.length - 1) y += ch;
  }
  // mapa e prédios
  y += 6;
  if (y + 70 > 278) y = await novaPagina();
  rotulo(`Onde sua marca aparece · ${r.totais.telas} telas`, M, y); y += 4;
  if (mapa) { doc.addImage(mapa, 'JPEG', M, y, L, L * (470 / 900)); y += L * (470 / 900) + 6; }
  const colW = (L - 8) / 2;
  r.predios.forEach((p, i) => {
    if (i % 2 === 0 && y + 8 > 278) { y = 30; doc.addPage(); }
    const x = M + (i % 2) * (colW + 8);
    txt(p.nome, x, y, { size: 8, bold: true, max: colW - 28 });
    txt(`${p.bairro} · ${p.telas} tela${p.telas === 1 ? '' : 's'}`, x, y + 3.5, { size: 6.8, cor: CINZA });
    txt(nf(p.exibicoes), x + colW, y + 1.5, { size: 8.5, bold: true, align: 'right' });
    doc.setDrawColor(241, 237, 238); doc.line(x, y + 5.5, x + colW, y + 5.5);
    if (i % 2 === 1) y += 9;
  });
  y += 12;
  if (y + 12 > 280) { doc.addPage(); y = 30; }
  txt(`Como contamos. As telas ficam ligadas ${r.formato.horas_dia} horas por dia. Para cada prédio e cada dia somamos os anúncios que estavam no ar, a duração de cada vídeo e o número de telas.`, M, y, { size: 7.5, cor: CINZA, max: L });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); rodape(i, n); }
  const nome = (r.pedido.cliente || r.pedido.nome).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase();
  doc.save(`relatorio-exa-${nome}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
