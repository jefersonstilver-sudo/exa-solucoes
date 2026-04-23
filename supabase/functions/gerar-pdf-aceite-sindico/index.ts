// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { PDFDocument, StandardFonts, rgb, degrees } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const COLORS = {
  black: rgb(0, 0, 0),
  textBlack: rgb(0.07, 0.07, 0.07),
  graphite: rgb(0.267, 0.267, 0.267),
  gray: rgb(0.4, 0.4, 0.4),
  midGray: rgb(0.533, 0.533, 0.533),
  lightGray: rgb(0.78, 0.78, 0.78),
  zebra: rgb(0.973, 0.973, 0.973),
  evidenceBg: rgb(0.98, 0.98, 0.98),
  bordo: rgb(0.357, 0.035, 0.051), // #5B090D
  red: rgb(0.918, 0.145, 0.114),   // #EA251D — restrito
  white: rgb(1, 1, 1),
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const HEADER_TOP = PAGE_H - 30;
const CONTENT_TOP = PAGE_H - 75;
const CONTENT_BOTTOM = 70;

// URL pública assinada (válida até 2070, já em uso em produção)
const LOGO_URL =
  'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJhbGciOiJIUzI1NiIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzEyOTcxOWZjLTk1OTYtNDQ3OS04OTcxLTNkOWE3OTk1MTk1ZSIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc0OTAyMDk2MSwiZXhwIjozMTYxNDIyMzc2MTYxfQ.zRYcIEUS2WYrnewRT_DfnpPCcr3tAbT9Dq4kn_ETaTo';

let LOGO_BYTES: Uint8Array | null = null;
async function loadLogo(): Promise<Uint8Array | null> {
  if (LOGO_BYTES) return LOGO_BYTES;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) {
      console.warn('[pdf] logo fetch failed', res.status);
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    LOGO_BYTES = buf;
    return buf;
  } catch (e) {
    console.warn('[pdf] logo fetch exception', e);
    return null;
  }
}

// ==== Termos integrais (sincronizado com src/components/interesse-sindico-form/termosTexto.ts) ====
const TERMOS_MARKDOWN = `### IDENTIFICAÇÃO DAS PARTES

**EXA MÍDIA** — marca de propriedade da **INDEXA MÍDIA LTDA**, pessoa jurídica de direito privado, inscrita no CNPJ sob nº **38.142.638/0001-30**, com sede na Av. Paraná, 974 — Sala 301, Centro, Foz do Iguaçu/PR, CEP 85852-000, doravante denominada simplesmente **"EXA"**.

**SÍNDICO INTERESSADO** — pessoa física identificada nos campos preenchidos neste formulário digital, na qualidade de síndico legalmente eleito do condomínio residencial também identificado neste formulário, doravante denominado simplesmente **"SÍNDICO"**.

**CONDOMÍNIO** — condomínio residencial identificado neste formulário, representado pelo SÍNDICO.

### 1. OBJETO DO REGISTRO

1.1. Pelo presente instrumento, o SÍNDICO manifesta formalmente, em nome do CONDOMÍNIO, **interesse em receber a instalação de painéis digitais operados pela EXA** nos elevadores sociais do prédio, nos termos do modelo de comodato praticado pela empresa.

1.2. Este documento constitui **manifestação de interesse** e **autorização para contato comercial**, **não representando**, em hipótese alguma, contrato de comodato, instrumento definitivo de instalação, obrigação de instalação por parte da EXA ou aceite de condições contratuais ainda não apresentadas.

### 2. PREMISSA DE ZERO CUSTO AO CONDOMÍNIO

2.1. O SÍNDICO declara estar ciente de que, em todas as etapas do processo (avaliação, visita técnica, instalação, manutenção e substituição de equipamentos), **nenhum custo será repassado ao CONDOMÍNIO**.

2.2. A operação da EXA é integralmente sustentada pela comercialização dos espaços publicitários dos painéis digitais e pelos anunciantes que integram sua rede.

2.3. O consumo de energia elétrica dos equipamentos instalados é residual e corresponde a um monitor LCD/LED de baixo consumo (30-50W) e um mini-computador padrão NUC (15-25W), totalizando aproximadamente 15 kWh/mês por painel instalado, sendo este o único custo indireto de responsabilidade do CONDOMÍNIO.

### 3. SUJEIÇÃO À APROVAÇÃO TÉCNICA DA EXA

3.1. O SÍNDICO declara estar plenamente ciente e concorda que **este registro de interesse está sujeito à avaliação e aprovação prévia da EXA**.

3.2. A EXA, a seu exclusivo critério, poderá **aprovar ou recusar** a continuidade do processo com base em critérios internos.

3.3. Em caso de não aprovação, o SÍNDICO será comunicado pelos canais informados e nenhuma obrigação adicional será gerada.

3.4. Em caso de aprovação, a EXA apresentará o contrato de comodato em versão integral para análise do SÍNDICO, sendo a celebração do contrato etapa posterior e independente deste registro.

### 4. LEGITIMIDADE DO SÍNDICO

4.1. O SÍNDICO declara, sob as penas da lei, ser **legalmente eleito e em exercício regular do mandato** na data deste aceite.

4.2. O SÍNDICO declara possuir poderes de representação do CONDOMÍNIO para atos de gestão ordinária, especialmente para iniciar negociações comerciais que não gerem ônus financeiro direto, nos termos do art. 1.348 do Código Civil Brasileiro.

4.3. Para atos subsequentes que demandem deliberação de assembleia, o SÍNDICO compromete-se a cumprir o rito previsto na convenção condominial e na legislação vigente.

### 5. VERACIDADE DAS INFORMAÇÕES PRESTADAS

5.1. O SÍNDICO declara, sob as penas da lei, que **todas as informações preenchidas neste formulário são verdadeiras, atuais e correspondem à realidade**.

5.2. Isto inclui dados pessoais do síndico, dados do prédio e infraestrutura (operadoras de internet, empresa de elevador, casa de máquinas).

5.3. O SÍNDICO declara ciência plena da responsabilidade civil e criminal decorrente da prestação de informações falsas, nos termos dos artigos 299 e 171 do Código Penal Brasileiro.

5.4. A EXA reserva-se o direito de recusar imediatamente o registro caso identifique inconsistência ou falsidade.

### 6. AUTORIZAÇÃO PARA CONTATO COMERCIAL

6.1. O SÍNDICO autoriza expressamente a EXA a entrar em contato consigo pelos canais informados (WhatsApp e e-mail) para confirmar dados, agendar visita técnica, apresentar contrato, comunicar decisões e prestar esclarecimentos.

6.2. Esta autorização compreende mensagens de texto, chamadas telefônicas, e-mails e envio de documentos, vinculadas exclusivamente a este processo.

### 7. AUTORIZAÇÃO DE ACESSO TÉCNICO E ARTICULAÇÃO COM TERCEIROS

7.1. O SÍNDICO autoriza expressamente a EXA a:

(a) Contatar a empresa de manutenção do elevador (Atlas, TKE, Otis ou Oriente) para tratar aspectos técnicos.

(b) Contatar as operadoras de internet (Vivo, Ligga ou Telecom Foz) para verificar viabilidade de sinal.

(c) Acessar fisicamente o prédio em horários autorizados — casa de máquinas, poço do elevador, hall e cabina — mediante identificação formal e respeitando normas internas.

(d) Apresentar o PDF oficial deste registro como documento comprobatório à empresa de elevador, conselho, administradora ou autoridades competentes.

7.2. Esta autorização não substitui a celebração posterior do contrato de comodato.

7.3. A autorização é limitada à fase de avaliação técnica e pode ser revogada a qualquer momento (cláusula 10).

7.4. A EXA compromete-se a comparecer apenas em horários agendados, manter equipe identificada e uniformizada, não realizar intervenção definitiva antes do contrato, respeitar normas internas e cobrir eventuais danos.

### 8. PROTEÇÃO DE DADOS PESSOAIS (LGPD)

8.1. Em conformidade com a Lei 13.709/2018 (LGPD), o SÍNDICO autoriza a EXA a coletar, armazenar, tratar e utilizar os dados informados.

8.2. Base legal: consentimento (art. 7º, I) e procedimentos preliminares de contrato (art. 7º, V).

8.3. Finalidades: avaliar interesse, contato comercial, agendamento técnico, análise de viabilidade, eventual celebração de contrato, cumprimento de obrigações legais.

8.4. Prazo: armazenamento pelo período necessário ao cumprimento das finalidades, respeitados os prazos legais.

8.5. Direitos do titular previstos no art. 18 da LGPD podem ser exercidos via suporte@examidia.com.br.

8.6. A EXA não compartilhará dados com terceiros estranhos ao processo, exceto quando exigido legalmente ou necessário a serviços vinculados.

### 9. PRÓXIMOS PASSOS APÓS O REGISTRO

9.1. Análise interna em até 48 horas úteis.

9.2. Caso aprovado, a EXA contatará via WhatsApp para agendar visita técnica.

9.3. A visita avalia condições físicas, sinal de internet, ponto de instalação e esclarece dúvidas.

9.4. Havendo viabilidade, será apresentado contrato de comodato. A celebração é etapa independente.

### 10. DIREITO DE REVOGAÇÃO

10.1. O SÍNDICO pode revogar este registro a qualquer momento, antes da assinatura do contrato definitivo, sem ônus.

10.2. Comunicação via suporte@examidia.com.br ou WhatsApp oficial.

10.3. A EXA cessará imediatamente o tratamento dos dados, respeitados prazos legais de guarda.

### 11. CAPTURA DE EVIDÊNCIAS TÉCNICAS DO ACEITE

11.1. No momento do aceite, são capturados automaticamente: data/hora, IP, user-agent e hash SHA-256 do documento, com finalidade de comprovação jurídica.

11.2. Estes dados integram o registro do aceite e compõem prova documental eletrônica.

11.3. Podem ser fornecidos em verificações internas, solicitações do titular ou demandas judiciais.

### 12. ASSINATURA ELETRÔNICA E BASE LEGAL

12.1. O aceite mediante marcação expressa e envio do formulário constitui manifestação de vontade válida e juridicamente vinculante, nos termos da MP 2.200-2/2001, Lei 14.063/2020, art. 107 do Código Civil e art. 411 do CPC.

12.2. Esta assinatura eletrônica, combinada com as evidências capturadas, possui força probatória equivalente à assinatura manuscrita.

### 13. GERAÇÃO E ENVIO DE DOCUMENTO OFICIAL

13.1. A EXA gerará automaticamente PDF oficial contendo todos os dados, texto integral dos termos, evidências, protocolo e selo de assinatura.

13.2. O documento será enviado ao e-mail do SÍNDICO, aos administradores EXA via WhatsApp e ao arquivo interno privado.

13.3. O SÍNDICO deve guardar cópia como prova.

### 14. COMUNICAÇÕES E CANAL OFICIAL

14.1. Canais oficiais: e-mail suporte@examidia.com.br, site www.examidia.com.br, WhatsApp informado pela equipe comercial.

14.2. Mensagens em canais não oficiais não vinculam a EXA.

### 15. FORO E LEGISLAÇÃO APLICÁVEL

15.1. Rege-se pelas leis da República Federativa do Brasil.

15.2. Foro eleito: comarca de Foz do Iguaçu — PR, com renúncia a qualquer outro.`;

// =============== Helpers ===============
function fmtBR(date: Date): string {
  const d = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} às ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} BRT`;
}

function fmtDateBR(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

const MESES_PT = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];
function fmtDateExtenso(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} de ${MESES_PT[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

function canonicalJSON(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJSON).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJSON(obj[k])).join(',') + '}';
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

interface Ctx {
  pdf: PDFDocument;
  page: any;
  y: number;
  pageNum: number;
  font: any;
  fontBold: any;
  fontItalic: any;
  mono: any;
  monoBold: any;
  protocolo: string;
  logoImg: any | null;
}

// ===== Header (páginas ≥ 2) =====
function drawHeader(ctx: Ctx) {
  const { page, font, protocolo, logoImg } = ctx;
  // Logo pequena à esquerda
  if (logoImg) {
    const w = 45;
    const ratio = logoImg.height / logoImg.width;
    const h = w * ratio;
    page.drawImage(logoImg, {
      x: MARGIN,
      y: HEADER_TOP - h + 8,
      width: w,
      height: h,
    });
  } else {
    page.drawText('EXA', {
      x: MARGIN,
      y: HEADER_TOP - 4,
      size: 14,
      font: ctx.fontBold,
      color: COLORS.bordo,
    });
  }
  // Texto direita
  const l1 = 'DOCUMENTO OFICIAL';
  const l2 = `Protocolo ${protocolo}`;
  const w1 = font.widthOfTextAtSize(l1, 8);
  const w2 = font.widthOfTextAtSize(l2, 8);
  page.drawText(l1, {
    x: PAGE_W - MARGIN - w1,
    y: HEADER_TOP - 2,
    size: 8,
    font,
    color: COLORS.graphite,
  });
  page.drawText(l2, {
    x: PAGE_W - MARGIN - w2,
    y: HEADER_TOP - 13,
    size: 8,
    font,
    color: COLORS.graphite,
  });
  // Linha fina preta
  page.drawLine({
    start: { x: MARGIN, y: HEADER_TOP - 22 },
    end: { x: PAGE_W - MARGIN, y: HEADER_TOP - 22 },
    thickness: 0.4,
    color: COLORS.black,
  });
}

// ===== Footer (todas as páginas) =====
function drawFooter(page: any, font: any, fontBold: any, pageNum: number, totalPages: number) {
  // Linha fina
  page.drawLine({
    start: { x: MARGIN, y: 50 },
    end: { x: PAGE_W - MARGIN, y: 50 },
    thickness: 0.4,
    color: COLORS.black,
  });
  // Esquerda
  const left = 'Indexa Mídia LTDA · CNPJ 38.142.638/0001-30';
  page.drawText(left, {
    x: MARGIN,
    y: 38,
    size: 7.5,
    font,
    color: COLORS.graphite,
  });
  // Centro
  const center = `Página ${pageNum} de ${totalPages}`;
  const cw = font.widthOfTextAtSize(center, 8);
  page.drawText(center, {
    x: (PAGE_W - cw) / 2,
    y: 38,
    size: 8,
    font,
    color: COLORS.black,
  });
  // Direita
  const right = 'www.examidia.com.br';
  const rw = font.widthOfTextAtSize(right, 7.5);
  page.drawText(right, {
    x: PAGE_W - MARGIN - rw,
    y: 38,
    size: 7.5,
    font,
    color: COLORS.graphite,
  });
}

// ===== Caixa borda dupla preta =====
function drawDoubleBorderBox(page: any, x: number, y: number, w: number, h: number) {
  page.drawRectangle({
    x, y, width: w, height: h,
    borderColor: COLORS.black,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: x + 3, y: y + 3, width: w - 6, height: h - 6,
    borderColor: COLORS.black,
    borderWidth: 0.4,
  });
}

// ===== Texto justificado =====
function drawJustifiedLine(
  page: any, words: string[], x: number, y: number, maxWidth: number,
  font: any, size: number, color: any, isLast: boolean,
) {
  if (words.length === 0) return;
  if (words.length === 1 || isLast) {
    page.drawText(words.join(' '), { x, y, size, font, color });
    return;
  }
  const totalTextWidth = words.reduce((s, w) => s + font.widthOfTextAtSize(w, size), 0);
  const gaps = words.length - 1;
  const spaceWidth = (maxWidth - totalTextWidth) / gaps;
  // Limita o espaçamento para não ficar absurdo
  const safeSpace = Math.min(spaceWidth, font.widthOfTextAtSize(' ', size) * 4);
  let cx = x;
  for (let i = 0; i < words.length; i++) {
    page.drawText(words[i], { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(words[i], size) + safeSpace;
  }
}

function wrapWords(text: string, font: any, size: number, maxWidth: number): string[][] {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[][] = [];
  let cur: string[] = [];
  let curW = 0;
  const spaceW = font.widthOfTextAtSize(' ', size);
  for (const w of words) {
    const ww = font.widthOfTextAtSize(w, size);
    const tentativeW = cur.length === 0 ? ww : curW + spaceW + ww;
    if (tentativeW > maxWidth && cur.length > 0) {
      lines.push(cur);
      cur = [w];
      curW = ww;
    } else {
      cur.push(w);
      curW = tentativeW;
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}

function ensureSpace(ctx: Ctx, needed: number) {
  if (ctx.y - needed < CONTENT_BOTTOM + 10) {
    ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
    ctx.pageNum += 1;
    drawHeader(ctx);
    ctx.y = CONTENT_TOP;
  }
}

function drawJustifiedParagraph(
  ctx: Ctx, text: string,
  opts: { size?: number; font?: any; color?: any; lineHeight?: number; indent?: number } = {},
) {
  const size = opts.size ?? 10;
  const font = opts.font ?? ctx.font;
  const color = opts.color ?? COLORS.textBlack;
  const lineHeight = opts.lineHeight ?? size * 1.5;
  const indent = opts.indent ?? 0;
  const maxW = PAGE_W - 2 * MARGIN - indent;
  const lines = wrapWords(text, font, size, maxW);
  for (let i = 0; i < lines.length; i++) {
    ensureSpace(ctx, lineHeight);
    drawJustifiedLine(
      ctx.page, lines[i], MARGIN + indent, ctx.y - size, maxW,
      font, size, color, i === lines.length - 1,
    );
    ctx.y -= lineHeight;
  }
}

function drawLeftParagraph(
  ctx: Ctx, text: string,
  opts: { size?: number; font?: any; color?: any; lineHeight?: number; indent?: number; align?: 'left' | 'center' } = {},
) {
  const size = opts.size ?? 10;
  const font = opts.font ?? ctx.font;
  const color = opts.color ?? COLORS.textBlack;
  const lineHeight = opts.lineHeight ?? size * 1.4;
  const indent = opts.indent ?? 0;
  const align = opts.align ?? 'left';
  const maxW = PAGE_W - 2 * MARGIN - indent;
  const lines = wrapText(text, font, size, maxW);
  for (const line of lines) {
    ensureSpace(ctx, lineHeight);
    let x = MARGIN + indent;
    if (align === 'center') {
      const w = font.widthOfTextAtSize(line, size);
      x = (PAGE_W - w) / 2;
    }
    ctx.page.drawText(line, { x, y: ctx.y - size, size, font, color });
    ctx.y -= lineHeight;
  }
}

// ===== Tabela 2 colunas =====
function drawDataTable(
  ctx: Ctx,
  rows: [string, string][],
  opts: { labelWidth?: number; rowH?: number } = {},
) {
  const labelWidth = opts.labelWidth ?? 160;
  const rowH = opts.rowH ?? 18;
  const x = MARGIN;
  const w = PAGE_W - 2 * MARGIN;

  const startY = ctx.y;
  let totalH = 0;

  // Pré-calcular linhas (com wrap do valor)
  const renderedRows: { label: string; valueLines: string[]; height: number }[] = [];
  for (const [label, value] of rows) {
    const valueMaxW = w - labelWidth - 20;
    const vLines = wrapText(value || '—', ctx.font, 9.5, valueMaxW);
    const lineCount = Math.max(1, vLines.length);
    const h = Math.max(rowH, lineCount * 13 + 6);
    renderedRows.push({ label, valueLines: vLines, height: h });
    totalH += h;
  }

  ensureSpace(ctx, totalH + 4);

  // Redesenha após possível page break
  let cy = ctx.y;
  // Borda externa
  ctx.page.drawRectangle({
    x, y: cy - totalH, width: w, height: totalH,
    borderColor: COLORS.black,
    borderWidth: 0.5,
  });

  let alt = false;
  for (const r of renderedRows) {
    if (alt) {
      ctx.page.drawRectangle({
        x: x + 0.5, y: cy - r.height, width: w - 1, height: r.height,
        color: COLORS.zebra,
      });
    }
    // separador inferior fininho
    ctx.page.drawLine({
      start: { x, y: cy - r.height },
      end: { x: x + w, y: cy - r.height },
      thickness: 0.3,
      color: COLORS.lightGray,
    });
    // separador vertical coluna
    ctx.page.drawLine({
      start: { x: x + labelWidth, y: cy },
      end: { x: x + labelWidth, y: cy - r.height },
      thickness: 0.3,
      color: COLORS.lightGray,
    });
    // Label
    ctx.page.drawText(r.label, {
      x: x + 10,
      y: cy - 13,
      size: 9.5,
      font: ctx.fontBold,
      color: COLORS.textBlack,
    });
    // Valor (multilinha)
    for (let i = 0; i < r.valueLines.length; i++) {
      ctx.page.drawText(r.valueLines[i], {
        x: x + labelWidth + 10,
        y: cy - 13 - i * 13,
        size: 9.5,
        font: ctx.font,
        color: COLORS.graphite,
      });
    }
    cy -= r.height;
    alt = !alt;
  }
  ctx.y = cy - 2;
}

// ===== Selo notarial =====
function drawNotarialSeal(ctx: Ctx, cx: number, cy: number) {
  const Router = 60;
  const Rinner = 48;
  // Anel externo
  ctx.page.drawCircle({
    x: cx, y: cy, size: Router,
    borderColor: COLORS.black,
    borderWidth: 2,
  });
  // Anel interno
  ctx.page.drawCircle({
    x: cx, y: cy, size: Rinner,
    borderColor: COLORS.black,
    borderWidth: 0.8,
  });

  // Texto curvo aproximado: vamos rotacionar caracteres ao redor do anel
  const drawCurvedText = (
    text: string, radius: number, startAngleDeg: number, endAngleDeg: number,
    font: any, size: number,
  ) => {
    const chars = text.split('');
    if (chars.length === 0) return;
    const totalAngle = endAngleDeg - startAngleDeg;
    const step = totalAngle / Math.max(1, chars.length - 1);
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const angDeg = startAngleDeg + step * i;
      const angRad = (angDeg * Math.PI) / 180;
      // Posição na circunferência
      const x = cx + radius * Math.cos(angRad);
      const y = cy + radius * Math.sin(angRad);
      // Rotação tangente (ângulo em graus): para texto no topo (vai de 180 a 0 indo "por cima"),
      // a tangente aponta sentido do varrimento; ajustamos -90 para ficar de pé.
      const rotDeg = angDeg - 90;
      ctx.page.drawText(ch, {
        x, y,
        size, font,
        color: COLORS.black,
        rotate: degrees(rotDeg),
      });
    }
  };

  const radiusText = (Router + Rinner) / 2; // 54
  // Topo: 165° → 15° (vai por cima, varrendo da esquerda à direita)
  drawCurvedText('DOCUMENTO ASSINADO ELETRONICAMENTE', radiusText, 165, 15, ctx.fontBold, 5.5);
  // Base: -15° → -165° (vai por baixo, da direita à esquerda) — invertemos para ficar legível
  // Para que a base fique legível "de pé", invertemos a string e usamos ângulos crescentes pela base
  const baseTxt = 'MP 2.200-2/2001  -  LEI 14.063/2020';
  const chars = baseTxt.split('');
  const baseStart = 195; // grau (esquerda-baixo)
  const baseEnd = 345;   // grau (direita-baixo)
  const totalAng = baseEnd - baseStart;
  const stepB = totalAng / Math.max(1, chars.length - 1);
  for (let i = 0; i < chars.length; i++) {
    const angDeg = baseStart + stepB * i;
    const angRad = (angDeg * Math.PI) / 180;
    const x = cx + radiusText * Math.cos(angRad);
    const y = cy + radiusText * Math.sin(angRad);
    // Para base, queremos texto "de pé" lendo da esquerda para a direita
    const rotDeg = angDeg + 90;
    ctx.page.drawText(chars[i], {
      x, y,
      size: 5.5, font: ctx.fontBold,
      color: COLORS.black,
      rotate: degrees(rotDeg),
    });
  }

  // Check central
  const checkSize = 42;
  const checkW = ctx.fontBold.widthOfTextAtSize('✓', checkSize);
  ctx.page.drawText('✓', {
    x: cx - checkW / 2,
    y: cy - 6,
    size: checkSize,
    font: ctx.fontBold,
    color: COLORS.bordo,
  });
  // Validade jurídica
  const t1 = 'VALIDADE JURÍDICA';
  const t2 = 'ATESTADA';
  const w1 = ctx.fontBold.widthOfTextAtSize(t1, 7);
  const w2 = ctx.fontBold.widthOfTextAtSize(t2, 7);
  ctx.page.drawText(t1, {
    x: cx - w1 / 2,
    y: cy - 26,
    size: 7,
    font: ctx.fontBold,
    color: COLORS.black,
  });
  ctx.page.drawText(t2, {
    x: cx - w2 / 2,
    y: cy - 35,
    size: 7,
    font: ctx.fontBold,
    color: COLORS.black,
  });
}

// ===== Renderizador dos termos com bold inline =====
function renderInlineWithBold(
  ctx: Ctx, line: string,
  opts: { size?: number; lineHeight?: number; indent?: number } = {},
) {
  // Quebra em segmentos {text, bold}
  const size = opts.size ?? 10;
  const lineHeight = opts.lineHeight ?? size * 1.5;
  const indent = opts.indent ?? 0;
  const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const segments: { text: string; bold: boolean }[] = parts.map((p) =>
    p.startsWith('**') && p.endsWith('**')
      ? { text: p.slice(2, -2), bold: true }
      : { text: p, bold: false },
  );

  // Tokenize por palavras preservando bold flag
  type Tok = { text: string; bold: boolean };
  const tokens: Tok[] = [];
  for (const seg of segments) {
    const words = seg.text.split(/(\s+)/);
    for (const w of words) {
      if (w === '') continue;
      tokens.push({ text: w, bold: seg.bold });
    }
  }

  const maxW = PAGE_W - 2 * MARGIN - indent;
  const widthOf = (t: Tok) =>
    (t.bold ? ctx.fontBold : ctx.font).widthOfTextAtSize(t.text, size);

  // Quebra em linhas
  const lines: Tok[][] = [];
  let cur: Tok[] = [];
  let curW = 0;
  for (const t of tokens) {
    const ww = widthOf(t);
    if (curW + ww > maxW && cur.length > 0) {
      // Remove espaços terminais
      while (cur.length && /^\s+$/.test(cur[cur.length - 1].text)) cur.pop();
      lines.push(cur);
      cur = [];
      curW = 0;
      if (/^\s+$/.test(t.text)) continue; // não inicia linha com espaço
    }
    cur.push(t);
    curW += ww;
  }
  if (cur.length) {
    while (cur.length && /^\s+$/.test(cur[cur.length - 1].text)) cur.pop();
    lines.push(cur);
  }

  for (let li = 0; li < lines.length; li++) {
    ensureSpace(ctx, lineHeight);
    const isLast = li === lines.length - 1;
    const tokenLine = lines[li];
    // Separar palavras (não-espaço) para justificação
    const wordTokens: Tok[] = tokenLine.filter((t) => !/^\s+$/.test(t.text));
    if (wordTokens.length === 0) {
      ctx.y -= lineHeight;
      continue;
    }
    const totalTextW = wordTokens.reduce((s, t) => s + widthOf(t), 0);
    const gaps = wordTokens.length - 1;
    let spaceW = ctx.font.widthOfTextAtSize(' ', size);
    if (!isLast && gaps > 0) {
      const computed = (maxW - totalTextW) / gaps;
      // limite para não estourar
      spaceW = Math.min(Math.max(spaceW, computed), spaceW * 4);
    }
    let cx = MARGIN + indent;
    for (let i = 0; i < wordTokens.length; i++) {
      const t = wordTokens[i];
      const f = t.bold ? ctx.fontBold : ctx.font;
      ctx.page.drawText(t.text, {
        x: cx, y: ctx.y - size, size, font: f, color: COLORS.textBlack,
      });
      cx += widthOf(t) + spaceW;
    }
    ctx.y -= lineHeight;
  }
}

function drawTermos(ctx: Ctx) {
  const lines = TERMOS_MARKDOWN.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      ctx.y -= 5;
      continue;
    }
    if (line.startsWith('### ')) {
      // Orphan prevention: garante espaço para título + 2 linhas (~50pt)
      ensureSpace(ctx, 50);
      ctx.y -= 8;
      const title = line.replace(/^###\s+/, '').replace(/\*\*/g, '');
      ctx.page.drawText(title, {
        x: MARGIN,
        y: ctx.y - 11,
        size: 11,
        font: ctx.fontBold,
        color: COLORS.textBlack,
      });
      ctx.y -= 18;
    } else if (line.startsWith('- ')) {
      const txt = line.slice(2);
      // bullet
      ensureSpace(ctx, 14);
      ctx.page.drawText('•', {
        x: MARGIN + 8,
        y: ctx.y - 10,
        size: 10,
        font: ctx.font,
        color: COLORS.textBlack,
      });
      renderInlineWithBold(ctx, txt, { size: 10, indent: 20, lineHeight: 14 });
    } else {
      renderInlineWithBold(ctx, line, { size: 10, lineHeight: 14.5 });
    }
  }
}

// =============== Auth gate ===============
const ADMIN_ROLES = ['super_admin', 'admin', 'gestor_comercial', 'diretora_operacoes'];

async function isAuthorizedAdmin(req: Request, supaServiceRole: any): Promise<boolean> {
  // Service role (server-to-server) chamada interna sem auth header — bloqueamos somente quando vier de UI
  // Aqui se NÃO há Authorization, NÃO autorizamos regen (apenas o fluxo automático sem force_regenerate roda).
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  // Se vier o service role key direto, autorizamos
  const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (srk && token === srk) return true;
  // Caso contrário, valida JWT do usuário e checa role
  try {
    const { data: userData, error } = await supaServiceRole.auth.getUser(token);
    if (error || !userData?.user) return false;
    const userId = userData.user.id;
    for (const role of ADMIN_ROLES) {
      const { data, error: rpcErr } = await supaServiceRole.rpc('has_role', {
        _user_id: userId,
        _role: role,
      });
      if (!rpcErr && data === true) return true;
    }
    return false;
  } catch (e) {
    console.warn('[pdf] auth check exception', e);
    return false;
  }
}

// =============== Main ===============
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const reqIP = req.headers.get('x-forwarded-for') || 'unknown';
  const reqUA = req.headers.get('user-agent') || 'unknown';

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const id = body?.sindico_interessado_id;
  const forceRegenerate = body?.force_regenerate === true;
  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'sindico_interessado_id obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[gerar-pdf-aceite-sindico] request', {
    id, forceRegenerate, ts: new Date().toISOString(),
  });

  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Auth gate apenas para force_regenerate
  if (forceRegenerate) {
    const ok = await isAuthorizedAdmin(req, supa);
    if (!ok) {
      console.warn('[gerar-pdf-aceite-sindico] regen NÃO autorizado');
      return new Response(JSON.stringify({ error: 'Não autorizado a regenerar' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const { data: rec, error: selErr } = await supa
    .from('sindicos_interessados')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (selErr) {
    console.error('[gerar-pdf-aceite-sindico] select error', selErr);
    return new Response(JSON.stringify({ error: 'DB error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!rec) {
    return new Response(JSON.stringify({ error: 'Registro não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 🛡️ IDEMPOTÊNCIA (ignorada se force_regenerate=true)
  if (rec.aceite_pdf_url && !forceRegenerate) {
    console.log('[gerar-pdf-aceite-sindico] cached', { id, path: rec.aceite_pdf_url });
    return new Response(
      JSON.stringify({
        success: true,
        pdf_path: rec.aceite_pdf_url,
        protocolo: rec.protocolo,
        cached: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // 🛡️ VALIDAÇÃO TEMPORAL (5 min) — pulada para regen autorizado
  if (!forceRegenerate) {
    const idadeMin = (Date.now() - new Date(rec.created_at).getTime()) / 60000;
    if (idadeMin > 5) {
      console.warn('[gerar-pdf-aceite-sindico] registro muito antigo', { id, idadeMin });
      return new Response(
        JSON.stringify({ error: 'Registro muito antigo para geração automática.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  }

  // ===== Geração do PDF =====
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const mono = await pdf.embedFont(StandardFonts.Helvetica);
  const monoBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Logo
  let logoImg: any = null;
  const logoBytes = await loadLogo();
  if (logoBytes) {
    try {
      logoImg = await pdf.embedPng(logoBytes);
    } catch (e) {
      console.warn('[pdf] embedPng falhou, prosseguindo sem logo', e);
    }
  }

  const protocolo = rec.protocolo || 'SEM-PROTOCOLO';
  const now = new Date();

  // Hash SHA-256
  const hashInput = canonicalJSON({
    protocolo,
    sindico: {
      nome: rec.sindico_nome,
      cpf: rec.sindico_cpf,
      whatsapp: rec.sindico_whatsapp,
      email: rec.sindico_email,
      mandato: rec.sindico_mandato_ate,
    },
    predio: {
      nome: rec.nome_predio,
      logradouro: rec.endereco_logradouro,
      numero: rec.endereco_numero,
      cep: rec.cep,
      cidade: rec.endereco_cidade,
      uf: rec.endereco_uf,
      andares: rec.quantidade_andares,
      blocos: rec.quantidade_blocos,
      unidades: rec.quantidade_unidades_total,
      elevadores: rec.quantidade_elevadores_sociais,
      operadoras: rec.internet_operadoras,
      elevador_empresa: rec.empresa_elevador,
      casa_maquinas: rec.elevador_casa_maquinas,
    },
    aceite: {
      timestamp: rec.aceite_timestamp,
      ip: rec.aceite_ip,
      user_agent: rec.aceite_user_agent,
    },
    termos_versao: 'v2.0',
    regenerated_at: forceRegenerate ? now.toISOString() : undefined,
  });
  const hash = await sha256(hashInput);

  // ============================================================
  // PÁGINA 1 — CAPA
  // ============================================================
  const cover = pdf.addPage([PAGE_W, PAGE_H]);

  // Logo centralizada (140pt de largura)
  let cursorY = PAGE_H - 80;
  if (logoImg) {
    const logoW = 140;
    const ratio = logoImg.height / logoImg.width;
    const logoH = logoW * ratio;
    cover.drawImage(logoImg, {
      x: (PAGE_W - logoW) / 2,
      y: cursorY - logoH,
      width: logoW,
      height: logoH,
    });
    cursorY -= logoH + 18;
  } else {
    cover.drawText('EXA', {
      x: PAGE_W / 2 - 40,
      y: cursorY - 40,
      size: 48,
      font: fontBold,
      color: COLORS.bordo,
    });
    cursorY -= 60;
  }

  // Linha fina
  cover.drawLine({
    start: { x: (PAGE_W - 80) / 2, y: cursorY },
    end: { x: (PAGE_W + 80) / 2, y: cursorY },
    thickness: 0.5,
    color: COLORS.black,
  });
  cursorY -= 18;

  // Identificação institucional
  const drawCenter = (txt: string, size: number, f: any, color = COLORS.textBlack) => {
    const w = f.widthOfTextAtSize(txt, size);
    cover.drawText(txt, { x: (PAGE_W - w) / 2, y: cursorY, size, font: f, color });
  };
  drawCenter('INDEXA MÍDIA LTDA', 11, fontBold);
  cursorY -= 14;
  drawCenter('CNPJ 38.142.638/0001-30', 9, font, COLORS.graphite);
  cursorY -= 12;
  drawCenter(
    'Av. Paraná, 974 - Sala 301 · Centro · Foz do Iguaçu/PR · 85852-000',
    8.5, font, COLORS.graphite,
  );
  cursorY -= 32;

  // Linha bordô
  cover.drawRectangle({
    x: (PAGE_W - 120) / 2, y: cursorY,
    width: 120, height: 1.2,
    color: COLORS.bordo,
  });
  cursorY -= 20;

  // Título principal (com letter-spacing manual)
  const drawSpaced = (txt: string, size: number, f: any, color: any, spacing: number) => {
    const chars = txt.split('');
    const totalW = chars.reduce(
      (s, c) => s + f.widthOfTextAtSize(c, size) + spacing,
      -spacing,
    );
    let cx = (PAGE_W - totalW) / 2;
    for (const c of chars) {
      cover.drawText(c, { x: cx, y: cursorY, size, font: f, color });
      cx += f.widthOfTextAtSize(c, size) + spacing;
    }
  };
  drawSpaced('TERMO DE REGISTRO DE INTERESSE', 18, fontBold, COLORS.textBlack, 1.5);
  cursorY -= 22;
  drawSpaced('E AUTORIZAÇÃO DE ACESSO TÉCNICO', 14, fontBold, COLORS.graphite, 1);
  cursorY -= 22;
  drawCenter(
    'Instalação de Painel Digital EXA Mídia em elevador condominial',
    11, fontItalic, COLORS.graphite,
  );
  cursorY -= 14;
  cover.drawRectangle({
    x: (PAGE_W - 120) / 2, y: cursorY,
    width: 120, height: 1.2,
    color: COLORS.bordo,
  });
  cursorY -= 35;

  // Box duplo do protocolo
  const boxW = 320;
  const boxH = 95;
  const boxX = (PAGE_W - boxW) / 2;
  const boxY = cursorY - boxH;
  drawDoubleBorderBox(cover, boxX, boxY, boxW, boxH);
  // Conteúdo
  const labelTop = 'PROTOCOLO OFICIAL';
  // letter-spacing manual
  const drawSpacedAt = (
    txt: string, size: number, f: any, color: any, spacing: number, yPos: number,
  ) => {
    const chars = txt.split('');
    const totalW = chars.reduce(
      (s, c) => s + f.widthOfTextAtSize(c, size) + spacing,
      -spacing,
    );
    let cx = (PAGE_W - totalW) / 2;
    for (const c of chars) {
      cover.drawText(c, { x: cx, y: yPos, size, font: f, color });
      cx += f.widthOfTextAtSize(c, size) + spacing;
    }
  };
  drawSpacedAt(labelTop, 8.5, fontBold, COLORS.graphite, 2.5, boxY + boxH - 20);
  // Protocolo
  const protW = monoBold.widthOfTextAtSize(protocolo, 22);
  cover.drawText(protocolo, {
    x: (PAGE_W - protW) / 2,
    y: boxY + boxH - 50,
    size: 22,
    font: monoBold,
    color: COLORS.textBlack,
  });
  // Linha cinza interna
  cover.drawLine({
    start: { x: boxX + 30, y: boxY + 38 },
    end: { x: boxX + boxW - 30, y: boxY + 38 },
    thickness: 0.4,
    color: COLORS.lightGray,
  });
  // Data
  const dataLabel = `DATA DO REGISTRO: ${fmtBR(now)}`;
  const dlW = font.widthOfTextAtSize(dataLabel, 9);
  cover.drawText(dataLabel, {
    x: (PAGE_W - dlW) / 2,
    y: boxY + 25,
    size: 9,
    font,
    color: COLORS.textBlack,
  });
  // Status
  const statusTxt = 'STATUS: ASSINADO ELETRONICAMENTE';
  const stW = fontBold.widthOfTextAtSize(statusTxt, 9);
  cover.drawText(statusTxt, {
    x: (PAGE_W - stW) / 2,
    y: boxY + 12,
    size: 9,
    font: fontBold,
    color: COLORS.bordo,
  });

  cursorY = boxY - 40;

  // Bloco inferior — declaração
  const decl1 =
    'Documento eletrônico com validade jurídica plena nos termos da Medida Provisória nº 2.200-2/2001,';
  const decl2 =
    'da Lei nº 14.063/2020 e do Código Civil Brasileiro (Lei nº 10.406/2002, art. 107).';
  const d1W = fontItalic.widthOfTextAtSize(decl1, 9);
  const d2W = fontItalic.widthOfTextAtSize(decl2, 9);
  cover.drawText(decl1, {
    x: (PAGE_W - d1W) / 2, y: cursorY,
    size: 9, font: fontItalic, color: COLORS.graphite,
  });
  cover.drawText(decl2, {
    x: (PAGE_W - d2W) / 2, y: cursorY - 12,
    size: 9, font: fontItalic, color: COLORS.graphite,
  });
  cursorY -= 30;
  const decl3 =
    'Para validação de integridade, consulte o hash criptográfico SHA-256 constante na página final.';
  const d3W = fontItalic.widthOfTextAtSize(decl3, 8);
  cover.drawText(decl3, {
    x: (PAGE_W - d3W) / 2, y: cursorY,
    size: 8, font: fontItalic, color: COLORS.graphite,
  });

  // Faixa bordô estreita no pé
  cover.drawRectangle({
    x: 0, y: 0, width: PAGE_W, height: 2,
    color: COLORS.bordo,
  });

  // ============================================================
  // CONTEXTO DE PÁGINAS DE CONTEÚDO
  // ============================================================
  const ctx: Ctx = {
    pdf,
    page: cover, // será sobrescrita
    y: 0,
    pageNum: 1,
    font, fontBold, fontItalic, mono, monoBold,
    protocolo,
    logoImg,
  };

  // ============================================================
  // PÁGINA 2 — IDENTIFICAÇÃO DAS PARTES
  // ============================================================
  ctx.page = pdf.addPage([PAGE_W, PAGE_H]);
  ctx.pageNum = 2;
  drawHeader(ctx);
  ctx.y = CONTENT_TOP;

  // Título
  ctx.page.drawText('1. IDENTIFICAÇÃO DAS PARTES', {
    x: MARGIN, y: ctx.y - 13,
    size: 13, font: fontBold, color: COLORS.textBlack,
  });
  ctx.y -= 18;
  ctx.page.drawRectangle({
    x: MARGIN, y: ctx.y, width: 60, height: 1, color: COLORS.bordo,
  });
  ctx.y -= 18;

  // 1.1
  ctx.page.drawText('1.1 DADOS DO PRÉDIO', {
    x: MARGIN, y: ctx.y - 11,
    size: 11, font: fontBold, color: COLORS.textBlack,
  });
  ctx.y -= 18;

  const enderecoFull = [
    rec.endereco_logradouro,
    rec.endereco_numero,
    rec.endereco_bairro,
    rec.endereco_cidade && rec.endereco_uf ? `${rec.endereco_cidade}/${rec.endereco_uf}` : '',
  ].filter(Boolean).join(', ');

  const predioRows: [string, string][] = [
    ['Nome do prédio', rec.nome_predio || '—'],
    ['Endereço', enderecoFull || '—'],
    ['CEP', rec.cep || '—'],
  ];
  if (rec.endereco_complemento) {
    predioRows.push(['Complemento', rec.endereco_complemento]);
  }
  predioRows.push([
    'Estrutura',
    `${rec.quantidade_andares ?? '—'} andares · ${rec.quantidade_blocos ?? 1} bloco(s) · ${
      rec.quantidade_unidades_total ?? '—'
    } unidades · ${rec.quantidade_elevadores_sociais ?? '—'} elevador(es) social(is)`,
  ]);
  predioRows.push([
    'Operadoras de internet',
    Array.isArray(rec.internet_operadoras) && rec.internet_operadoras.length
      ? rec.internet_operadoras.join(', ')
      : '—',
  ]);
  predioRows.push(['Empresa de manutenção do elevador', rec.empresa_elevador || '—']);
  predioRows.push([
    'Casa de máquinas',
    rec.elevador_casa_maquinas === 'sim'
      ? 'Sim'
      : rec.elevador_casa_maquinas === 'nao'
        ? 'Não'
        : 'Não sei informar',
  ]);
  drawDataTable(ctx, predioRows);

  ctx.y -= 18;

  // 1.2
  ensureSpace(ctx, 30);
  ctx.page.drawText('1.2 DADOS DO SÍNDICO', {
    x: MARGIN, y: ctx.y - 11,
    size: 11, font: fontBold, color: COLORS.textBlack,
  });
  ctx.y -= 18;

  const sindicoRows: [string, string][] = [
    ['Nome completo', rec.sindico_nome || '—'],
    ['CPF', rec.sindico_cpf || '—'],
    ['WhatsApp', rec.sindico_whatsapp || '—'],
    ['E-mail', rec.sindico_email || '—'],
    ['Mandato até', fmtDateExtenso(rec.sindico_mandato_ate)],
  ];
  drawDataTable(ctx, sindicoRows);

  // ============================================================
  // PÁGINA 3+ — TERMOS
  // ============================================================
  ctx.page = pdf.addPage([PAGE_W, PAGE_H]);
  ctx.pageNum += 1;
  drawHeader(ctx);
  ctx.y = CONTENT_TOP;

  ctx.page.drawText('2. TERMOS E CONDIÇÕES DO REGISTRO DE INTERESSE', {
    x: MARGIN, y: ctx.y - 13,
    size: 13, font: fontBold, color: COLORS.textBlack,
  });
  ctx.y -= 18;
  ctx.page.drawRectangle({
    x: MARGIN, y: ctx.y, width: 60, height: 1, color: COLORS.bordo,
  });
  ctx.y -= 14;

  drawTermos(ctx);

  // ============================================================
  // PÁGINA FINAL — ASSINATURA
  // ============================================================
  ctx.page = pdf.addPage([PAGE_W, PAGE_H]);
  ctx.pageNum += 1;
  drawHeader(ctx);
  ctx.y = CONTENT_TOP;

  // Título centralizado
  const titFinal = '3. ASSINATURA ELETRÔNICA E REGISTRO DE EVIDÊNCIAS';
  const tfW = fontBold.widthOfTextAtSize(titFinal, 14);
  ctx.page.drawText(titFinal, {
    x: (PAGE_W - tfW) / 2,
    y: ctx.y - 14,
    size: 14, font: fontBold, color: COLORS.textBlack,
  });
  ctx.y -= 20;
  ctx.page.drawRectangle({
    x: (PAGE_W - 120) / 2, y: ctx.y, width: 120, height: 1, color: COLORS.bordo,
  });
  ctx.y -= 18;

  // Caixa borda dupla — declaração
  const declTitle = 'DECLARAÇÃO DE CONCORDÂNCIA';
  const declText =
    'O signatário abaixo identificado, ao aceitar eletronicamente este termo por meio de marcação expressa de caixa de confirmação seguida do envio do formulário digital, manifestou sua plena concordância com todas as cláusulas, condições e autorizações constantes neste documento, o que produz efeitos legais equivalentes à assinatura manuscrita, nos termos da Medida Provisória nº 2.200-2, de 24 de agosto de 2001, da Lei nº 14.063, de 23 de setembro de 2020, e dos artigos 107 e seguintes do Código Civil Brasileiro.';
  const declBoxW = PAGE_W - 2 * MARGIN;
  const declBoxH = 100;
  const declBoxX = MARGIN;
  const declBoxY = ctx.y - declBoxH;
  drawDoubleBorderBox(ctx.page, declBoxX, declBoxY, declBoxW, declBoxH);
  // Título
  const dtChars = declTitle.split('');
  const dtSize = 11;
  const dtSpacing = 2;
  const dtTotalW = dtChars.reduce(
    (s, c) => s + fontBold.widthOfTextAtSize(c, dtSize) + dtSpacing,
    -dtSpacing,
  );
  let dtX = (PAGE_W - dtTotalW) / 2;
  const dtY = declBoxY + declBoxH - 18;
  for (const c of dtChars) {
    ctx.page.drawText(c, { x: dtX, y: dtY, size: dtSize, font: fontBold, color: COLORS.textBlack });
    dtX += fontBold.widthOfTextAtSize(c, dtSize) + dtSpacing;
  }
  // Texto interno justificado
  const innerLines = wrapWords(declText, font, 9.5, declBoxW - 30);
  let innerY = dtY - 18;
  for (let i = 0; i < innerLines.length; i++) {
    drawJustifiedLine(
      ctx.page, innerLines[i], declBoxX + 15, innerY, declBoxW - 30,
      font, 9.5, COLORS.textBlack, i === innerLines.length - 1,
    );
    innerY -= 12;
  }

  ctx.y = declBoxY - 22;

  // Identificação do signatário
  ctx.page.drawLine({
    start: { x: (PAGE_W - 360) / 2, y: ctx.y },
    end: { x: (PAGE_W + 360) / 2, y: ctx.y },
    thickness: 0.8,
    color: COLORS.black,
  });
  ctx.y -= 18;
  const nomeUp = (rec.sindico_nome || '—').toUpperCase();
  const nW = fontBold.widthOfTextAtSize(nomeUp, 14);
  ctx.page.drawText(nomeUp, {
    x: (PAGE_W - nW) / 2,
    y: ctx.y, size: 14, font: fontBold, color: COLORS.textBlack,
  });
  ctx.y -= 16;
  const cpfStr = `CPF ${rec.sindico_cpf || '—'}`;
  const cpW = font.widthOfTextAtSize(cpfStr, 10);
  ctx.page.drawText(cpfStr, {
    x: (PAGE_W - cpW) / 2,
    y: ctx.y, size: 10, font, color: COLORS.graphite,
  });
  ctx.y -= 12;
  const mandato = `Síndico legalmente eleito — Mandato até ${fmtDateBR(rec.sindico_mandato_ate)}`;
  const mW = fontItalic.widthOfTextAtSize(mandato, 9);
  ctx.page.drawText(mandato, {
    x: (PAGE_W - mW) / 2,
    y: ctx.y, size: 9, font: fontItalic, color: COLORS.graphite,
  });
  ctx.y -= 12;
  const repr = `Representante do condomínio: ${rec.nome_predio || '—'}`;
  const reprW = font.widthOfTextAtSize(repr, 9);
  ctx.page.drawText(repr, {
    x: (PAGE_W - reprW) / 2,
    y: ctx.y, size: 9, font, color: COLORS.graphite,
  });
  ctx.y -= 28;

  // Selo notarial
  ensureSpace(ctx, 140);
  drawNotarialSeal(ctx, PAGE_W / 2, ctx.y - 60);
  ctx.y -= 140;

  // Caixa "REGISTRO DE EVIDÊNCIAS TÉCNICAS DO ACEITE"
  ensureSpace(ctx, 130);
  const evX = MARGIN;
  const evW = PAGE_W - 2 * MARGIN;
  const evRows: [string, string][] = [
    ['Data e hora do aceite', fmtBR(new Date(rec.aceite_timestamp || now))],
    ['Endereço IP', rec.aceite_ip || '—'],
    ['User-agent', (rec.aceite_user_agent || '—').slice(0, 80)],
    ['Hash SHA-256', hash],
    ['Protocolo', protocolo],
  ];
  // pre-calc altura
  const evLineH = 13;
  const evRowsRendered = evRows.map(([k, v]) => {
    const valW = evW - 130 - 24;
    const lines = wrapText(v, mono, 8.5, valW);
    return { k, lines };
  });
  const evContentH = evRowsRendered.reduce(
    (s, r) => s + Math.max(evLineH, r.lines.length * evLineH),
    0,
  );
  const evBoxH = 24 + evContentH + 12;
  const evY = ctx.y;
  ctx.page.drawRectangle({
    x: evX, y: evY - evBoxH, width: evW, height: evBoxH,
    color: COLORS.evidenceBg,
    borderColor: COLORS.black,
    borderWidth: 0.5,
  });
  // Título
  const evTitle = 'REGISTRO DE EVIDÊNCIAS TÉCNICAS DO ACEITE';
  const etChars = evTitle.split('');
  const etSize = 10;
  const etSpacing = 1;
  const etTotalW = etChars.reduce(
    (s, c) => s + fontBold.widthOfTextAtSize(c, etSize) + etSpacing, -etSpacing,
  );
  let etX = (PAGE_W - etTotalW) / 2;
  const etY = evY - 16;
  for (const c of etChars) {
    ctx.page.drawText(c, { x: etX, y: etY, size: etSize, font: fontBold, color: COLORS.textBlack });
    etX += fontBold.widthOfTextAtSize(c, etSize) + etSpacing;
  }
  // Linhas
  let evCY = evY - 30;
  for (const r of evRowsRendered) {
    ctx.page.drawText(r.k + ':', {
      x: evX + 12,
      y: evCY,
      size: 8.5, font: monoBold, color: COLORS.textBlack,
    });
    for (let i = 0; i < r.lines.length; i++) {
      ctx.page.drawText(r.lines[i], {
        x: evX + 130,
        y: evCY - i * evLineH,
        size: 8.5, font: mono, color: COLORS.graphite,
      });
    }
    evCY -= Math.max(evLineH, r.lines.length * evLineH);
  }
  ctx.y = evY - evBoxH - 16;

  // USO AUTORIZADO
  ensureSpace(ctx, 130);
  const uaY = ctx.y;
  const uaH = 130;
  ctx.page.drawRectangle({
    x: MARGIN, y: uaY - uaH, width: PAGE_W - 2 * MARGIN, height: uaH,
    borderColor: COLORS.bordo,
    borderWidth: 1,
  });
  // Título
  const uaTitle = 'USO AUTORIZADO DESTE DOCUMENTO';
  ctx.page.drawText(uaTitle, {
    x: MARGIN + 12,
    y: uaY - 18,
    size: 10, font: fontBold, color: COLORS.bordo,
  });
  // Texto
  let uaCY = uaY - 36;
  const uaIntro =
    'Este documento oficial comprova a manifestação formal de interesse e a autorização de acesso técnico concedida pelo síndico acima identificado. Poderá ser apresentado aos seguintes destinatários, sem necessidade de autenticação adicional:';
  const uaIntroLines = wrapText(uaIntro, font, 9.5, PAGE_W - 2 * MARGIN - 24);
  for (const ln of uaIntroLines) {
    ctx.page.drawText(ln, {
      x: MARGIN + 12, y: uaCY,
      size: 9.5, font, color: COLORS.graphite,
    });
    uaCY -= 12;
  }
  uaCY -= 4;
  const uaBullets = [
    'Empresa de manutenção do elevador (Atlas, TKE, Otis ou Oriente)',
    'Administradora do condomínio, zelador(a) ou conselho fiscal',
    'Operadoras de internet contratadas (Vivo, Ligga ou Telecom Foz)',
    'Autoridades públicas competentes, quando solicitado',
    'Equipe técnica da EXA Mídia durante a visita técnica',
  ];
  for (const b of uaBullets) {
    ctx.page.drawText('•', {
      x: MARGIN + 16, y: uaCY,
      size: 9, font, color: COLORS.bordo,
    });
    ctx.page.drawText(b, {
      x: MARGIN + 26, y: uaCY,
      size: 9, font, color: COLORS.graphite,
    });
    uaCY -= 12;
  }

  // ============================================================
  // RODAPÉS + NUMERAÇÃO (todas as páginas, inclusive capa)
  // ============================================================
  const totalPages = pdf.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdf.getPage(i);
    drawFooter(p, font, fontBold, i + 1, totalPages);
  }

  // ===== Salvar =====
  const pdfBytes = await pdf.save();
  const ano = new Date().getFullYear();
  const path = `aceites/${ano}/${protocolo}.pdf`;

  const { error: upErr } = await supa.storage
    .from('termos-sindicos')
    .upload(path, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (upErr) {
    console.error('[gerar-pdf-aceite-sindico] upload erro', upErr);
    return new Response(JSON.stringify({ error: 'Falha ao salvar PDF', details: upErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await supa
    .from('sindicos_interessados')
    .update({ aceite_pdf_url: path, aceite_hash: hash })
    .eq('id', id);

  console.log('[gerar-pdf-aceite-sindico] success', {
    id, protocolo, path, hash: hash.slice(0, 16), regenerated: forceRegenerate,
  });

  return new Response(
    JSON.stringify({
      success: true,
      pdf_path: path,
      protocolo,
      hash,
      regenerated: forceRegenerate,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
