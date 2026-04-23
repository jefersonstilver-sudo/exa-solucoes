// @ts-nocheck
// PDF Termo de Adesão EXA — layout v4 (Helvetica nativa + logo embedada)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ====== Logo EXA oficial — buscada via fetch (URL pública do site) e cacheada em memória ======
const LOGO_URL =
  'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png';

let LOGO_BYTES: Uint8Array | null = null;
async function fetchLogoBytes(): Promise<Uint8Array | null> {
  if (LOGO_BYTES) return LOGO_BYTES;
  try {
    const res = await fetch(LOGO_URL);
    if (!res.ok) {
      console.warn('[pdf v4] fetch logo falhou', res.status);
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    LOGO_BYTES = buf;
    return buf;
  } catch (e) {
    console.warn('[pdf v4] fetch logo exceção', (e as any)?.message);
    return null;
  }
}

// ====== Cores ======
const C = {
  exa: rgb(234 / 255, 37 / 255, 29 / 255), // #EA251D
  exaDark: rgb(140 / 255, 17 / 255, 19 / 255), // #8C1113 (sólido em vez de gradiente)
  ink: rgb(10 / 255, 10 / 255, 10 / 255),
  ink600: rgb(61 / 255, 61 / 255, 61 / 255),
  ink500: rgb(92 / 255, 92 / 255, 92 / 255),
  ink400: rgb(133 / 255, 133 / 255, 133 / 255),
  ink100: rgb(234 / 255, 234 / 255, 234 / 255),
  greenOk: rgb(11 / 255, 138 / 255, 61 / 255),
  white: rgb(1, 1, 1),
};

// ====== Layout ======
const PW = 595.28;
const PH = 841.89;
const MX = 36;
const HEADER_H = 56;
const FAIXA_H = 3;
const FOOTER_BOTTOM = 18;

// Y helper: HTML coords (origem topo) → PDF coords (origem base)
const Y = (topFromTop: number) => PH - topFromTop;

// ====== Helpers ======
const ELEVADOR_LBL: Record<string, string> = {
  atlas: 'Atlas', tke: 'TKE', otis: 'Otis', oriente: 'Oriente',
  Atlas: 'Atlas', TKE: 'TKE', Otis: 'Otis', Oriente: 'Oriente',
};
const CASA_MAQ_LBL: Record<string, string> = {
  sim: 'com casa de máquinas',
  nao: 'sem casa de máquinas',
  nao_sei: 'casa de máquinas não informada',
};
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function fmtDataExtenso(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
function fmtDataCurta(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}
function fmtRegistradoEm(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} BRT`;
}
function fmtTimestampEvidencia(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} às ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} (Horário de Brasília)`;
}
function fmtPhoneE164(p?: string | null): string {
  if (!p) return '—';
  const digits = p.replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  return p;
}
function truncate(s: string, max: number): string {
  if (!s) return '—';
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
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
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Word wrap retornando linhas que cabem em maxWidth
function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Sanitiza caracteres não suportados pelo WinAnsi (Helvetica nativa)
function san(s: string): string {
  if (!s) return s;
  return String(s)
    .replace(/→/g, '>')
    .replace(/←/g, '<')
    .replace(/…/g, '...')
    .replace(/✓/g, 'v')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, ' ');
}

// Texto com partes em bold (segments [{text, bold}])
function drawRichLine(
  page: any, segments: { text: string; bold?: boolean }[],
  x: number, y: number, font: any, fontBold: any, size: number, color: any,
) {
  let cx = x;
  for (const seg of segments) {
    const f = seg.bold ? fontBold : font;
    const t = san(seg.text);
    page.drawText(san(t), { x: cx, y, size, font: f, color });
    cx += f.widthOfTextAtSize(t, size);
  }
}

// Word-wrap rich text (segments com bold mantidos)
function wrapRich(
  segments: { text: string; bold?: boolean }[],
  font: any, fontBold: any, size: number, maxWidth: number,
): { text: string; bold?: boolean }[][] {
  // Achata em tokens word-com-flag
  const tokens: { text: string; bold?: boolean }[] = [];
  for (const s of segments) {
    const parts = s.text.split(/(\s+)/);
    for (const p of parts) if (p.length) tokens.push({ text: p, bold: s.bold });
  }
  const lines: { text: string; bold?: boolean }[][] = [];
  let cur: { text: string; bold?: boolean }[] = [];
  let curW = 0;
  for (const tk of tokens) {
    const f = tk.bold ? fontBold : font;
    const w = f.widthOfTextAtSize(tk.text, size);
    if (curW + w > maxWidth && cur.length > 0 && tk.text.trim()) {
      // remove trailing whitespace
      while (cur.length && !cur[cur.length - 1].text.trim()) cur.pop();
      lines.push(cur);
      cur = [];
      curW = 0;
      if (!tk.text.trim()) continue;
    }
    cur.push(tk);
    curW += w;
  }
  if (cur.length) lines.push(cur);
  return lines;
}

// Check vermelho 12x12 (duas linhas formando V)
function drawCheckBullet(page: any, x: number, y: number) {
  page.drawLine({
    start: { x: x + 1, y: y + 4 }, end: { x: x + 4, y: y + 1 },
    thickness: 1.6, color: C.exa,
  });
  page.drawLine({
    start: { x: x + 4, y: y + 1 }, end: { x: x + 10, y: y + 8 },
    thickness: 1.6, color: C.exa,
  });
}

// ====== HEADER ======
function drawHeader(page: any, font: any, fontBold: any, logoImg: any, protocolo: string) {
  // Fundo vermelho
  page.drawRectangle({ x: 0, y: PH - (HEADER_H - FAIXA_H), width: PW, height: HEADER_H - FAIXA_H, color: C.exaDark });
  // Faixa vermelha clara
  page.drawRectangle({ x: 0, y: PH - HEADER_H, width: PW, height: FAIXA_H, color: C.exa });

  // Logo (oficial — 36px de altura)
  if (logoImg) {
    const targetH = 36;
    const ratio = logoImg.width / logoImg.height;
    const targetW = targetH * ratio;
    const bandBottom = PH - HEADER_H + FAIXA_H;
    const bandHeight = HEADER_H - FAIXA_H;
    page.drawImage(logoImg, {
      x: MX,
      y: bandBottom + (bandHeight - targetH) / 2,
      width: targetW,
      height: targetH,
    });
    // Divisor + texto INDEXA MIDIA LTDA
    const divX = MX + targetW + 12;
    page.drawLine({
      start: { x: divX, y: bandBottom + 10 },
      end: { x: divX, y: bandBottom + bandHeight - 10 },
      thickness: 0.8,
      color: rgb(1, 1, 1),
      opacity: 0.35,
    });
    page.drawText(san('INDEXA MÍDIA LTDA'), {
      x: divX + 12,
      y: bandBottom + (bandHeight - 8) / 2,
      size: 8,
      font: fontBold,
      color: C.white,
      opacity: 0.92,
    });
  } else {
    // Fallback texto se a logo não carregar
    page.drawText(san('EXA MÍDIA'), {
      x: MX,
      y: PH - HEADER_H + FAIXA_H + (HEADER_H - FAIXA_H - 14) / 2,
      size: 16,
      font: fontBold,
      color: C.white,
    });
  }

  // Direita
  const docOf = 'DOCUMENTO OFICIAL';
  const wDoc = font.widthOfTextAtSize(docOf, 7);
  page.drawText(san(docOf), {
    x: PW - MX - wDoc,
    y: PH - HEADER_H + FAIXA_H + 32,
    size: 7,
    font: fontBold,
    color: C.white,
    opacity: 0.78,
  });
  const wProto = fontBold.widthOfTextAtSize(protocolo, 12);
  page.drawText(san(protocolo), {
    x: PW - MX - wProto,
    y: PH - HEADER_H + FAIXA_H + 14,
    size: 12,
    font: fontBold,
    color: C.white,
  });
}

// ====== FOOTER ======
function drawFooter(page: any, font: any, fontBold: any, pageNum: number, total: number) {
  // Linha
  page.drawLine({
    start: { x: MX, y: FOOTER_BOTTOM + 14 },
    end: { x: PW - MX, y: FOOTER_BOTTOM + 14 },
    thickness: 0.5,
    color: C.ink100,
  });
  const left = 'Indexa Mídia LTDA · CNPJ 38.142.638/0001-30';
  const center = `Página ${pageNum} de ${total}`;
  const right = 'www.examidia.com.br';
  page.drawText(san(left), { x: MX, y: FOOTER_BOTTOM, size: 7.2, font: fontBold, color: C.ink500 });
  const cw = fontBold.widthOfTextAtSize(center, 7.5);
  page.drawText(san(center), { x: (PW - cw) / 2, y: FOOTER_BOTTOM, size: 7.5, font: fontBold, color: C.ink500 });
  const rw = font.widthOfTextAtSize(right, 7.2);
  page.drawText(san(right), { x: PW - MX - rw, y: FOOTER_BOTTOM, size: 7.2, font, color: C.ink400 });
}

// ====== Section label (eyebrow uppercase + linha) ======
function drawSectionLabel(page: any, fontBold: any, label: string, y: number): number {
  page.drawText(san(label), {
    x: MX, y: y - 7, size: 7, font: fontBold, color: C.ink400,
  });
  page.drawLine({
    start: { x: MX, y: y - 11 }, end: { x: PW - MX, y: y - 11 },
    thickness: 0.5, color: C.ink100,
  });
  return y - 22; // próxima linha de conteúdo
}

// ====== Auth gate ======
const ADMIN_ROLES = ['super_admin', 'admin', 'admin_departamental'];
async function isAuthorizedAdmin(req: Request, supa: any): Promise<boolean> {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (token === serviceKey) return true;
  try {
    const { data: ud, error } = await supa.auth.getUser(token);
    if (error || !ud?.user) return false;
    for (const r of ADMIN_ROLES) {
      const { data: ok } = await supa.rpc('has_role', { _user_id: ud.user.id, _role: r });
      if (ok === true) return true;
    }
  } catch (_) {}
  return false;
}

// ============================================================
// HANDLER
// ============================================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const id = body?.sindico_interessado_id;
  const forceRegenerate = body?.force_regenerate === true;
  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'sindico_interessado_id obrigatório' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SUPA_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supa = createClient(SUPA_URL, SUPA_SERVICE);

  // Auth gate apenas para regen
  if (forceRegenerate) {
    const ok = await isAuthorizedAdmin(req, supa);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Não autorizado para regenerar' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Fetch registro
  const { data: rec, error: recErr } = await supa
    .from('sindicos_interessados')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (recErr || !rec) {
    return new Response(JSON.stringify({ error: 'Registro não encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Idempotência (só se não for regen)
  if (rec.aceite_pdf_url && !forceRegenerate) {
    return new Response(
      JSON.stringify({ success: true, pdf_path: rec.aceite_pdf_url, protocolo: rec.protocolo, hash: rec.aceite_hash, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const protocolo = rec.protocolo ?? 'EXA-XXXX-XXXXXX';

  try {
    // ===== Construir PDF =====
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let logoImg: any = null;
    try {
      const bytes = await fetchLogoBytes();
      if (bytes) {
        logoImg = await pdf.embedPng(bytes);
      }
    } catch (e) {
      console.warn('[pdf v4] logo embed falhou', e);
    }

    // ====== PÁGINA 1 ======
    const p1 = pdf.addPage([PW, PH]);
    drawHeader(p1, font, fontBold, logoImg, protocolo);

    let y = PH - HEADER_H - 24;

    // Eyebrow
    p1.drawText(san('TERMO DE ADESÃO'), { x: MX, y: y - 7, size: 7, font: fontBold, color: C.exa });
    y -= 18;
    // Título 2 linhas
    p1.drawText(san('Registro de Interesse e'), { x: MX, y: y - 14, size: 20, font: fontBold, color: C.ink });
    y -= 22;
    p1.drawText(san('Autorização Técnica'), { x: MX, y: y - 14, size: 20, font: fontBold, color: C.ink });
    y -= 22;
    // Subtitle
    const subt = 'Manifestação formal do síndico para instalação de painel digital EXA Mídia em elevador condominial, com autorização expressa de acesso e articulação técnica com terceiros.';
    const subtLines = wrap(subt, font, 9.5, 500);
    for (const ln of subtLines) {
      p1.drawText(san(ln), { x: MX, y: y - 10, size: 9.5, font, color: C.ink500 });
      y -= 13;
    }
    y -= 12;

    // ====== Meta-strip 4 colunas ======
    p1.drawLine({ start: { x: MX, y }, end: { x: PW - MX, y }, thickness: 0.5, color: C.ink100 });
    y -= 12;
    const colW = (PW - 2 * MX) / 4;
    const cidade = rec.endereco_cidade || 'Foz do Iguaçu';
    const uf = rec.endereco_uf || 'PR';
    const cells = [
      { lbl: 'PROTOCOLO', val: protocolo, color: C.exa },
      { lbl: 'REGISTRADO EM', val: fmtRegistradoEm(rec.created_at), color: C.ink },
      { lbl: 'LOCAL', val: `${cidade}/${uf}`, color: C.ink },
      { lbl: 'STATUS', val: 'Assinado', color: C.greenOk },
    ];
    for (let i = 0; i < cells.length; i++) {
      const cx = MX + i * colW;
      p1.drawText(san(cells[i].lbl), { x: cx, y, size: 6.8, font: fontBold, color: C.ink400 });
      p1.drawText(san(cells[i].val), { x: cx, y: y - 11, size: 9, font: fontBold, color: cells[i].color });
    }
    y -= 16;
    p1.drawLine({ start: { x: MX, y }, end: { x: PW - MX, y }, thickness: 0.5, color: C.ink100 });
    y -= 16;

    // ====== O PRÉDIO ======
    y = drawSectionLabel(p1, fontBold, 'O PRÉDIO', y);
    p1.drawText(san(rec.nome_predio || '—'), { x: MX, y: y - 11, size: 12.5, font: fontBold, color: C.ink });
    y -= 16;
    const compl = rec.endereco_complemento ? ` — Sala ${rec.endereco_complemento}` : '';
    const enderecoLine = `${rec.endereco_logradouro ?? '—'}, ${rec.endereco_numero ?? '—'}${compl} · ${rec.endereco_bairro ?? '—'} · ${cidade}/${uf} · CEP ${rec.cep ?? '—'}`;
    const endLines = wrap(enderecoLine, font, 9, PW - 2 * MX);
    for (const ln of endLines) {
      p1.drawText(san(ln), { x: MX, y: y - 9, size: 9, font, color: C.ink500 });
      y -= 12;
    }
    y -= 4;
    // Grid info
    const ops = Array.isArray(rec.internet_operadoras) ? rec.internet_operadoras.join(', ') : '—';
    const elevEmp = ELEVADOR_LBL[rec.empresa_elevador as string] || rec.empresa_elevador || '—';
    const cm = CASA_MAQ_LBL[rec.elevador_casa_maquinas as string] || '—';
    const grid1: [string, string][] = [
      ['Estrutura', `${rec.quantidade_andares ?? '—'} andares · ${rec.quantidade_blocos ?? 1} bloco(s) · ${rec.quantidade_unidades_total ?? '—'} unidades · ${rec.quantidade_elevadores_sociais ?? '—'} elevadores sociais`],
      ['Internet', ops || '—'],
      ['Elevador', `${elevEmp} · ${cm}`],
    ];
    for (const [k, v] of grid1) {
      p1.drawText(san(k), { x: MX, y: y - 9, size: 8.8, font: fontBold, color: C.ink400 });
      const vLines = wrap(v, font, 8.8, PW - 2 * MX - 110);
      for (let i = 0; i < vLines.length; i++) {
        p1.drawText(san(vLines[i]), { x: MX + 110, y: y - 9 - i * 11, size: 8.8, font, color: C.ink });
      }
      y -= Math.max(13, vLines.length * 11 + 2);
    }
    y -= 6;
    p1.drawLine({ start: { x: MX, y }, end: { x: PW - MX, y }, thickness: 0.5, color: C.ink100 });
    y -= 14;

    // ====== O SÍNDICO ======
    y = drawSectionLabel(p1, fontBold, 'O SÍNDICO', y);
    const sindicoNome = rec.sindico_nome || rec.nome_completo || '—';
    p1.drawText(san(sindicoNome), { x: MX, y: y - 11, size: 12.5, font: fontBold, color: C.ink });
    y -= 16;
    const cpfLine = `CPF ${rec.sindico_cpf ?? '—'} · Mandato até ${fmtDataExtenso(rec.sindico_mandato_ate)}`;
    p1.drawText(san(cpfLine), { x: MX, y: y - 9, size: 9, font, color: C.ink500 });
    y -= 16;
    const grid2: [string, string][] = [
      ['WhatsApp', fmtPhoneE164(rec.sindico_whatsapp || rec.celular)],
      ['E-mail', rec.sindico_email || rec.email || '—'],
    ];
    for (const [k, v] of grid2) {
      p1.drawText(san(k), { x: MX, y: y - 9, size: 8.8, font: fontBold, color: C.ink400 });
      p1.drawText(san(v), { x: MX + 110, y: y - 9, size: 8.8, font, color: C.ink });
      y -= 13;
    }
    y -= 8;

    // ====== O SÍNDICO AUTORIZA (5 bullets) ======
    y = drawSectionLabel(p1, fontBold, 'O SÍNDICO AUTORIZA', y);
    const opsLista = ops || 'as operadoras informadas';
    const autoriza: { text: string; bold?: boolean }[][] = [
      [{ text: 'Contato comercial ', bold: true }, { text: 'pelo WhatsApp e e-mail informados, para confirmação de dados, agendamento de visita técnica e apresentação do contrato de comodato.' }],
      [{ text: 'Contato técnico direto ', bold: true }, { text: `com a empresa de manutenção do elevador (${elevEmp}) e com as operadoras de internet informadas (${opsLista}).` }],
      [{ text: 'Acesso da equipe técnica EXA ', bold: true }, { text: 'às áreas comuns do prédio — casa de máquinas, poço do elevador, hall e cabina — em horários previamente agendados.' }],
      [{ text: 'Uso deste documento ', bold: true }, { text: 'como comprovante de autorização formal perante terceiros (parceiros, administradora, autoridades).' }],
      [{ text: 'Tratamento dos dados pessoais ', bold: true }, { text: 'conforme a LGPD (Lei 13.709/2018), exclusivamente para as finalidades deste processo.' }],
    ];
    for (const seg of autoriza) {
      const lines = wrapRich(seg, font, fontBold, 8.8, PW - 2 * MX - 20);
      drawCheckBullet(p1, MX, y - 8);
      for (let i = 0; i < lines.length; i++) {
        drawRichLine(p1, lines[i], MX + 18, y - 8 - i * 12, font, fontBold, 8.8, C.ink600);
      }
      y -= lines.length * 12 + 4;
    }
    y -= 6;

    // ====== O SÍNDICO DECLARA (5 bullets) ======
    y = drawSectionLabel(p1, fontBold, 'O SÍNDICO DECLARA', y);
    const declara: { text: string; bold?: boolean }[][] = [
      [{ text: 'Ser ' }, { text: 'legalmente eleito ', bold: true }, { text: 'e em exercício regular do mandato, com poderes de representação do condomínio (art. 1.348, CC).' }],
      [{ text: 'Que ' }, { text: 'todas as informações são verdadeiras ', bold: true }, { text: 'e atuais, com ciência da responsabilidade civil e criminal pela falsidade (arts. 299 e 171, CP).' }],
      [{ text: 'Ter ciência de que este registro é ' }, { text: 'manifestação de interesse ', bold: true }, { text: 'sujeita à aprovação da EXA, não constituindo contrato de comodato.' }],
      [{ text: 'Que ' }, { text: 'nenhum custo será repassado ao condomínio ', bold: true }, { text: '— consumo residual ~15 kWh/mês (monitor LCD 30-50W + mini-PC NUC 15-25W).' }],
      [{ text: 'Poder ' }, { text: 'revogar este registro ', bold: true }, { text: 'a qualquer momento antes do contrato de comodato, sem ônus, via suporte@examidia.com.br.' }],
    ];
    for (const seg of declara) {
      const lines = wrapRich(seg, font, fontBold, 8.8, PW - 2 * MX - 20);
      drawCheckBullet(p1, MX, y - 8);
      for (let i = 0; i < lines.length; i++) {
        drawRichLine(p1, lines[i], MX + 18, y - 8 - i * 12, font, fontBold, 8.8, C.ink600);
      }
      y -= lines.length * 12 + 4;
    }

    // ====== PÁGINA 2 ======
    const p2 = pdf.addPage([PW, PH]);
    drawHeader(p2, font, fontBold, logoImg, protocolo);
    let y2 = PH - HEADER_H - 28;

    // DECLARAÇÃO DE CONCORDÂNCIA
    y2 = drawSectionLabel(p2, fontBold, 'DECLARAÇÃO DE CONCORDÂNCIA', y2);
    const declSegs: { text: string; bold?: boolean }[] = [
      { text: 'O signatário identificado abaixo, ao marcar expressamente a caixa de aceite e enviar o formulário digital, ' },
      { text: 'manifestou sua plena concordância ', bold: true },
      { text: 'com os termos deste documento, com efeitos legais equivalentes à assinatura manuscrita, nos termos da ' },
      { text: 'Medida Provisória nº 2.200-2/2001', bold: true }, { text: ', da ' },
      { text: 'Lei nº 14.063/2020', bold: true }, { text: ' e do ' },
      { text: 'Código Civil Brasileiro', bold: true }, { text: ' (art. 107).' },
    ];
    const declLines = wrapRich(declSegs, font, fontBold, 9.5, PW - 2 * MX);
    for (const ln of declLines) {
      drawRichLine(p2, ln, MX, y2 - 10, font, fontBold, 9.5, C.ink600);
      y2 -= 14;
    }
    y2 -= 18;

    // ASSINATURA
    const sigLineW = 280;
    const sigX = (PW - sigLineW) / 2;
    p2.drawLine({
      start: { x: sigX, y: y2 }, end: { x: sigX + sigLineW, y: y2 },
      thickness: 1.2, color: C.ink,
    });
    y2 -= 14;
    const sigName = String(sindicoNome).toUpperCase();
    const wName = fontBold.widthOfTextAtSize(sigName, 13);
    p2.drawText(san(sigName), { x: (PW - wName) / 2, y: y2, size: 13, font: fontBold, color: C.ink });
    y2 -= 14;
    const meta1 = `CPF ${rec.sindico_cpf ?? '—'} · Síndico legalmente eleito`;
    const wM1 = font.widthOfTextAtSize(meta1, 8.5);
    p2.drawText(san(meta1), { x: (PW - wM1) / 2, y: y2, size: 8.5, font, color: C.ink500 });
    y2 -= 11;
    const meta2 = `Representante do Condomínio ${rec.nome_predio ?? '—'} · Mandato até ${fmtDataCurta(rec.sindico_mandato_ate)}`;
    const meta2Lines = wrap(meta2, font, 8.5, PW - 2 * MX);
    for (const ln of meta2Lines) {
      const w = font.widthOfTextAtSize(ln, 8.5);
      p2.drawText(san(ln), { x: (PW - w) / 2, y: y2, size: 8.5, font, color: C.ink500 });
      y2 -= 11;
    }
    y2 -= 8;

    // Pill "Assinado"
    const pillTxt = 'Assinado eletronicamente · EXA Mídia';
    const pillTxtW = fontBold.widthOfTextAtSize(pillTxt, 8);
    const pillW = pillTxtW + 16 + 24; // padding + circle + gap
    const pillH = 18;
    const pillX = (PW - pillW) / 2;
    p2.drawRectangle({
      x: pillX, y: y2 - pillH, width: pillW, height: pillH,
      borderColor: C.ink100, borderWidth: 1, color: C.white,
    });
    // Círculo vermelho com check
    p2.drawCircle({ x: pillX + 12, y: y2 - 9, size: 6, color: C.exa });
    p2.drawLine({
      start: { x: pillX + 9, y: y2 - 9 }, end: { x: pillX + 11.5, y: y2 - 11 },
      thickness: 1, color: C.white,
    });
    p2.drawLine({
      start: { x: pillX + 11.5, y: y2 - 11 }, end: { x: pillX + 15, y: y2 - 7 },
      thickness: 1, color: C.white,
    });
    p2.drawText(san(pillTxt), { x: pillX + 22, y: y2 - 12, size: 8, font: fontBold, color: C.ink });
    y2 -= pillH + 14;
    p2.drawLine({ start: { x: MX, y: y2 }, end: { x: PW - MX, y: y2 }, thickness: 0.5, color: C.ink100 });
    y2 -= 18;

    // EVIDÊNCIAS TÉCNICAS DO ACEITE
    y2 = drawSectionLabel(p2, fontBold, 'EVIDÊNCIAS TÉCNICAS DO ACEITE', y2);
    // Hash (primeiro calculamos para incluir na tabela)
    const canonical = canonicalJSON({
      aceite_ip: rec.aceite_ip ?? '',
      aceite_timestamp: rec.aceite_timestamp ?? '',
      aceite_user_agent: rec.aceite_user_agent ?? '',
      nome_predio: rec.nome_predio ?? '',
      protocolo: protocolo,
      sindico_cpf: rec.sindico_cpf ?? '',
      sindico_nome: sindicoNome,
      termos_versao: 'v2-2025',
    });
    const hash = await sha256(canonical);
    const evRows: { k: string; v: string; valColor?: any; valBold?: boolean; size?: number }[] = [
      { k: 'Data e hora', v: fmtTimestampEvidencia(rec.aceite_timestamp) },
      { k: 'Endereço IP', v: rec.aceite_ip ?? '—' },
      { k: 'Navegador / Sistema', v: truncate(rec.aceite_user_agent ?? '—', 80) },
      { k: 'Hash SHA-256', v: hash, size: 7.6 },
      { k: 'Protocolo', v: protocolo, valColor: C.exa, valBold: true },
    ];
    for (const r of evRows) {
      p2.drawText(san(r.k), { x: MX, y: y2 - 8, size: 8.3, font: fontBold, color: C.ink400 });
      const f = r.valBold ? fontBold : font;
      const sz = r.size ?? 8.3;
      const lines = wrap(r.v, f, sz, PW - 2 * MX - 150);
      for (let i = 0; i < lines.length; i++) {
        p2.drawText(san(lines[i]), {
          x: MX + 150, y: y2 - 8 - i * 10, size: sz, font: f, color: r.valColor ?? C.ink,
        });
      }
      y2 -= Math.max(12, lines.length * 10 + 4);
      p2.drawLine({ start: { x: MX, y: y2 }, end: { x: PW - MX, y: y2 }, thickness: 0.4, color: C.ink100 });
      y2 -= 4;
    }
    y2 -= 12;

    // USO AUTORIZADO
    y2 = drawSectionLabel(p2, fontBold, 'USO AUTORIZADO DESTE DOCUMENTO', y2);
    const usoIntro = 'Pode ser apresentado como comprovante de autorização formal, sem necessidade de autenticação adicional, a:';
    const usoLines = wrap(usoIntro, font, 8.8, PW - 2 * MX);
    for (const ln of usoLines) {
      p2.drawText(san(ln), { x: MX, y: y2 - 9, size: 8.8, font, color: C.ink500 });
      y2 -= 12;
    }
    y2 -= 6;
    const usoItems = [
      'Empresa de manutenção do elevador',
      'Administradora do condomínio',
      'Zelador(a) ou conselho fiscal',
      'Operadoras de internet contratadas',
      'Autoridades públicas competentes',
      'Equipe técnica da EXA em visita agendada',
    ];
    const colWidth = (PW - 2 * MX - 18) / 2;
    for (let i = 0; i < usoItems.length; i += 2) {
      const left = usoItems[i];
      const right = usoItems[i + 1];
      p2.drawText(san('→'), { x: MX, y: y2 - 9, size: 9, font: fontBold, color: C.exa });
      p2.drawText(san(left), { x: MX + 12, y: y2 - 9, size: 8.8, font, color: C.ink600 });
      if (right) {
        const x2 = MX + colWidth + 18;
        p2.drawText(san('→'), { x: x2, y: y2 - 9, size: 9, font: fontBold, color: C.exa });
        p2.drawText(san(right), { x: x2 + 12, y: y2 - 9, size: 8.8, font, color: C.ink600 });
      }
      y2 -= 14;
    }
    y2 -= 16;

    // Footnote legal
    p2.drawLine({ start: { x: MX, y: y2 }, end: { x: PW - MX, y: y2 }, thickness: 0.5, color: C.ink100 });
    y2 -= 14;
    const fn1Segs: { text: string; bold?: boolean }[] = [
      { text: 'Validade jurídica plena', bold: true },
      { text: ' — MP 2.200-2/2001 · Lei 14.063/2020 · Código Civil, art. 107' },
    ];
    const fn1W = fn1Segs.reduce((s, seg) => s + (seg.bold ? fontBold : font).widthOfTextAtSize(seg.text, 7.8), 0);
    drawRichLine(p2, fn1Segs, (PW - fn1W) / 2, y2, font, fontBold, 7.8, C.ink600);
    y2 -= 11;
    const fn2 = 'Revogação: suporte@examidia.com.br · Foro: comarca de Foz do Iguaçu/PR';
    const fn2W = font.widthOfTextAtSize(fn2, 7.8);
    p2.drawText(san(fn2), { x: (PW - fn2W) / 2, y: y2, size: 7.8, font, color: C.ink400 });

    // Footers em ambas as páginas
    const total = pdf.getPageCount();
    for (let i = 0; i < total; i++) {
      drawFooter(pdf.getPage(i), font, fontBold, i + 1, total);
    }

    // Salvar
    const bytes = await pdf.save();
    const ano = new Date().getFullYear();
    const path = `aceites/${ano}/${protocolo}.pdf`;
    const { error: upErr } = await supa.storage
      .from('termos-sindicos')
      .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
    if (upErr) {
      console.error('[gerar-pdf-aceite-sindico v4] upload erro', upErr);
      return new Response(JSON.stringify({ error: 'Falha ao salvar PDF', details: upErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    await supa.from('sindicos_interessados').update({ aceite_pdf_url: path, aceite_hash: hash }).eq('id', id);

    console.log('[gerar-pdf-aceite-sindico v4] success', { id, protocolo, path, hash: hash.slice(0, 16), regen: forceRegenerate });

    return new Response(
      JSON.stringify({ success: true, pdf_path: path, protocolo, hash, regenerated: forceRegenerate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[gerar-pdf-aceite-sindico v4] geração falhou', { id, message: e?.message, stack: e?.stack });
    return new Response(JSON.stringify({ error: 'Falha na geração do PDF', details: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
