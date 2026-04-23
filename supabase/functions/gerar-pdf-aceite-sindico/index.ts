// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const COLORS = {
  black: rgb(0.102, 0.102, 0.102),
  red: rgb(0.918, 0.145, 0.114),
  bordo: rgb(0.357, 0.035, 0.051),
  gray: rgb(0.333, 0.333, 0.333),
  lightGray: rgb(0.815, 0.815, 0.815),
  bgGray: rgb(0.961, 0.961, 0.961),
  bordoBg: rgb(0.976, 0.91, 0.91),
  white: rgb(1, 1, 1),
};

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;

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
  const d = new Date(date.getTime() - 3 * 60 * 60 * 1000); // BRT
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
  const words = text.split(/\s+/);
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

// Parse markdown line — remove **bold** markers (kept simple; bold renderiza diferente em pdf-lib)
function stripBold(s: string): { text: string; segments: { text: string; bold: boolean }[] } {
  const segments: { text: string; bold: boolean }[] = [];
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  let plain = '';
  for (const p of parts) {
    if (p.startsWith('**') && p.endsWith('**')) {
      const t = p.slice(2, -2);
      segments.push({ text: t, bold: true });
      plain += t;
    } else if (p) {
      segments.push({ text: p, bold: false });
      plain += p;
    }
  }
  return { text: plain, segments };
}

interface DrawState {
  pdf: PDFDocument;
  page: any;
  y: number;
  pageNum: number;
  totalPagesPlaceholder: { value: number };
  font: any;
  fontBold: any;
  fontItalic: any;
  protocolo: string;
}

function newContentPage(state: DrawState) {
  state.page = state.pdf.addPage([PAGE_W, PAGE_H]);
  state.pageNum += 1;
  state.y = PAGE_H - MARGIN;
  drawHeader(state);
}

function drawHeader(state: DrawState) {
  const { page, font, fontBold, protocolo } = state;
  // logo wordmark esquerda
  page.drawText('exa', {
    x: MARGIN,
    y: PAGE_H - MARGIN + 6,
    size: 18,
    font: fontBold,
    color: COLORS.red,
  });
  // protocolo à direita
  const protoLabel = `Protocolo ${protocolo}`;
  const w = font.widthOfTextAtSize(protoLabel, 9);
  page.drawText(protoLabel, {
    x: PAGE_W - MARGIN - w,
    y: PAGE_H - MARGIN + 8,
    size: 9,
    font,
    color: COLORS.gray,
  });
  // linha vermelha
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - MARGIN - 2,
    width: PAGE_W - 2 * MARGIN,
    height: 1,
    color: COLORS.red,
  });
  state.y = PAGE_H - MARGIN - 18;
}

function ensureSpace(state: DrawState, needed: number) {
  if (state.y - needed < MARGIN + 30) {
    newContentPage(state);
  }
}

function drawParagraph(state: DrawState, text: string, opts: { size?: number; bold?: boolean; color?: any; indent?: number; lineHeight?: number } = {}) {
  const size = opts.size ?? 10;
  const lineHeight = opts.lineHeight ?? size * 1.45;
  const indent = opts.indent ?? 0;
  const font = opts.bold ? state.fontBold : state.font;
  const color = opts.color ?? COLORS.black;
  const maxWidth = PAGE_W - 2 * MARGIN - indent;
  const lines = wrapText(text, font, size, maxWidth);
  for (const line of lines) {
    ensureSpace(state, lineHeight);
    state.page.drawText(line, {
      x: MARGIN + indent,
      y: state.y - size,
      size,
      font,
      color,
    });
    state.y -= lineHeight;
  }
}

function drawTermos(state: DrawState) {
  const lines = TERMOS_MARKDOWN.split('\n');
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      state.y -= 4;
      inList = false;
      continue;
    }
    if (line.startsWith('### ')) {
      state.y -= 6;
      ensureSpace(state, 18);
      const title = line.replace(/^###\s+/, '');
      const { text } = stripBold(title);
      drawParagraph(state, text, { size: 11, bold: true, color: COLORS.bordo });
      state.y -= 2;
      inList = false;
    } else if (line.startsWith('- ')) {
      const { text } = stripBold(line.slice(2));
      drawParagraph(state, '• ' + text, { size: 9.5, indent: 12 });
      inList = true;
    } else {
      const { text } = stripBold(line);
      drawParagraph(state, text, { size: 9.5 });
    }
  }
}

function drawDataRow(state: DrawState, label: string, value: string, alt: boolean) {
  const rowH = 16;
  ensureSpace(state, rowH);
  if (alt) {
    state.page.drawRectangle({
      x: MARGIN,
      y: state.y - rowH + 4,
      width: PAGE_W - 2 * MARGIN,
      height: rowH,
      color: COLORS.bgGray,
    });
  }
  state.page.drawText(label, {
    x: MARGIN + 6,
    y: state.y - 10,
    size: 9,
    font: state.fontBold,
    color: COLORS.black,
  });
  // value (com wrap simples)
  const valueX = MARGIN + 180;
  const maxW = PAGE_W - MARGIN - valueX - 6;
  const lines = wrapText(value || '—', state.font, 9, maxW);
  state.page.drawText(lines[0], {
    x: valueX,
    y: state.y - 10,
    size: 9,
    font: state.font,
    color: COLORS.gray,
  });
  state.y -= rowH;
  // linhas extras
  for (let i = 1; i < lines.length; i++) {
    ensureSpace(state, 12);
    state.page.drawText(lines[i], {
      x: valueX,
      y: state.y - 10,
      size: 9,
      font: state.font,
      color: COLORS.gray,
    });
    state.y -= 12;
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
  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'sindico_interessado_id obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[gerar-pdf-aceite-sindico] request', {
    sindico_interessado_id: id,
    timestamp: new Date().toISOString(),
    ip: reqIP,
    ua: reqUA,
  });

  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

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

  // 🛡️ IDEMPOTÊNCIA
  if (rec.aceite_pdf_url) {
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

  // 🛡️ VALIDAÇÃO TEMPORAL (5 min)
  const idadeMin = (Date.now() - new Date(rec.created_at).getTime()) / 60000;
  if (idadeMin > 5) {
    console.warn('[gerar-pdf-aceite-sindico] registro muito antigo', { id, idadeMin });
    return new Response(
      JSON.stringify({ error: 'Registro muito antigo para geração automática.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ===== Geração do PDF =====
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const protocolo = rec.protocolo || 'SEM-PROTOCOLO';
  const now = new Date();

  // Hash SHA-256 dos dados canônicos
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
      cep: rec.endereco_cep,
      cidade: rec.endereco_cidade,
      uf: rec.endereco_uf,
      andares: rec.quantidade_andares,
      blocos: rec.quantidade_blocos,
      unidades: rec.quantidade_unidades,
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
  });
  const hash = await sha256(hashInput);

  // ====== Página 1 — Capa ======
  let page = pdf.addPage([PAGE_W, PAGE_H]);

  // Logo wordmark
  page.drawText('exa', {
    x: PAGE_W / 2 - 50,
    y: PAGE_H - 130,
    size: 64,
    font: fontBold,
    color: COLORS.red,
  });

  // Faixa vermelha
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 170,
    width: PAGE_W,
    height: 6,
    color: COLORS.red,
  });

  // Bloco central
  const docLabel = 'D O C U M E N T O   O F I C I A L';
  const dlW = fontBold.widthOfTextAtSize(docLabel, 11);
  page.drawText(docLabel, {
    x: (PAGE_W - dlW) / 2,
    y: PAGE_H - 230,
    size: 11,
    font: fontBold,
    color: COLORS.gray,
  });

  const t1 = 'REGISTRO DE INTERESSE';
  const t2 = 'E AUTORIZAÇÃO TÉCNICA';
  const t1W = fontBold.widthOfTextAtSize(t1, 22);
  const t2W = fontBold.widthOfTextAtSize(t2, 22);
  page.drawText(t1, {
    x: (PAGE_W - t1W) / 2,
    y: PAGE_H - 280,
    size: 22,
    font: fontBold,
    color: COLORS.black,
  });
  page.drawText(t2, {
    x: (PAGE_W - t2W) / 2,
    y: PAGE_H - 310,
    size: 22,
    font: fontBold,
    color: COLORS.black,
  });

  const sub = 'INSTALAÇÃO DE PAINEL EXA MÍDIA';
  const subW = font.widthOfTextAtSize(sub, 13);
  page.drawText(sub, {
    x: (PAGE_W - subW) / 2,
    y: PAGE_H - 340,
    size: 13,
    font,
    color: COLORS.gray,
  });

  // linha vermelha curta
  page.drawRectangle({
    x: (PAGE_W - 80) / 2,
    y: PAGE_H - 360,
    width: 80,
    height: 2,
    color: COLORS.red,
  });

  // Box metadados
  const boxY = PAGE_H - 470;
  const boxH = 90;
  page.drawRectangle({
    x: MARGIN + 40,
    y: boxY,
    width: PAGE_W - 2 * MARGIN - 80,
    height: boxH,
    color: COLORS.bgGray,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
  });
  page.drawText('PROTOCOLO', {
    x: MARGIN + 60,
    y: boxY + boxH - 22,
    size: 9,
    font: fontBold,
    color: COLORS.gray,
  });
  page.drawText(protocolo, {
    x: MARGIN + 60,
    y: boxY + boxH - 40,
    size: 14,
    font: fontBold,
    color: COLORS.red,
  });
  page.drawText('DATA DE GERAÇÃO', {
    x: MARGIN + 60,
    y: boxY + 35,
    size: 9,
    font: fontBold,
    color: COLORS.gray,
  });
  page.drawText(fmtBR(now), {
    x: MARGIN + 60,
    y: boxY + 20,
    size: 10,
    font,
    color: COLORS.black,
  });
  page.drawText('STATUS:  Assinado eletronicamente', {
    x: MARGIN + 60,
    y: boxY + 6,
    size: 9,
    font: fontBold,
    color: COLORS.bordo,
  });

  // Rodapé conformidade
  const conf = 'Gerado em conformidade com MP 2.200-2/2001 e Lei 14.063/2020';
  const confW = font.widthOfTextAtSize(conf, 9);
  page.drawText(conf, {
    x: (PAGE_W - confW) / 2,
    y: 60,
    size: 9,
    font: fontItalic,
    color: COLORS.gray,
  });

  // Faixa bordô pé
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 6, color: COLORS.bordo });

  // ====== State para páginas seguintes ======
  const state: DrawState = {
    pdf,
    page,
    y: 0,
    pageNum: 1,
    totalPagesPlaceholder: { value: 0 },
    font,
    fontBold,
    fontItalic,
    protocolo,
  };

  // ====== Página 2 — Dados ======
  newContentPage(state);

  drawParagraph(state, '1. DADOS DO PRÉDIO', {
    size: 12,
    bold: true,
    color: COLORS.bordo,
  });
  state.y -= 4;

  let alt = false;
  const enderecoFull = [
    rec.endereco_logradouro,
    rec.endereco_numero,
    rec.endereco_complemento,
    rec.endereco_bairro,
    rec.endereco_cidade && rec.endereco_uf ? `${rec.endereco_cidade}/${rec.endereco_uf}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  drawDataRow(state, 'Nome do prédio', rec.nome_predio || '—', (alt = !alt));
  drawDataRow(state, 'Endereço', enderecoFull, (alt = !alt));
  drawDataRow(state, 'CEP', rec.endereco_cep || '—', (alt = !alt));
  if (rec.endereco_complemento) drawDataRow(state, 'Complemento', rec.endereco_complemento, (alt = !alt));
  drawDataRow(
    state,
    'Estrutura',
    `${rec.quantidade_andares ?? '—'} andares · ${rec.quantidade_blocos ?? 1} bloco(s) · ${
      rec.quantidade_unidades ?? '—'
    } unidades · ${rec.quantidade_elevadores_sociais ?? '—'} elevador(es) social(is)`,
    (alt = !alt),
  );
  drawDataRow(
    state,
    'Operadoras de internet',
    Array.isArray(rec.internet_operadoras) ? rec.internet_operadoras.join(', ') : '—',
    (alt = !alt),
  );
  drawDataRow(state, 'Empresa do elevador', rec.empresa_elevador || '—', (alt = !alt));
  drawDataRow(
    state,
    'Casa de máquinas',
    rec.elevador_casa_maquinas === 'sim'
      ? 'Sim'
      : rec.elevador_casa_maquinas === 'nao'
        ? 'Não'
        : 'Não sei informar',
    (alt = !alt),
  );

  state.y -= 14;
  drawParagraph(state, '2. DADOS DO SÍNDICO', {
    size: 12,
    bold: true,
    color: COLORS.bordo,
  });
  state.y -= 4;
  alt = false;
  drawDataRow(state, 'Nome completo', rec.sindico_nome || '—', (alt = !alt));
  drawDataRow(state, 'CPF', rec.sindico_cpf || '—', (alt = !alt));
  drawDataRow(state, 'WhatsApp', rec.sindico_whatsapp || '—', (alt = !alt));
  drawDataRow(state, 'E-mail', rec.sindico_email || '—', (alt = !alt));
  drawDataRow(state, 'Mandato até', fmtDateBR(rec.sindico_mandato_ate), (alt = !alt));

  // ====== Página 3+ — Termos integrais ======
  newContentPage(state);
  drawParagraph(state, '3. TERMOS ACEITOS PELO SÍNDICO', {
    size: 12,
    bold: true,
    color: COLORS.bordo,
  });
  state.y -= 4;
  drawTermos(state);

  // ====== Página final — Assinatura ======
  newContentPage(state);
  drawParagraph(state, '4. ASSINATURA ELETRÔNICA E EVIDÊNCIAS DO ACEITE', {
    size: 13,
    bold: true,
    color: COLORS.bordo,
  });
  state.y -= 8;

  // Caixa declaração
  const declY = state.y;
  state.page.drawRectangle({
    x: MARGIN,
    y: declY - 70,
    width: PAGE_W - 2 * MARGIN,
    height: 70,
    borderColor: COLORS.red,
    borderWidth: 1.5,
    color: COLORS.white,
  });
  state.y = declY - 14;
  drawParagraph(
    state,
    'O signatário abaixo identificado, ao marcar expressamente a caixa de aceite dos termos e enviar este formulário eletrônico, MANIFESTOU SUA CONCORDÂNCIA com todo o conteúdo acima descrito, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.',
    { size: 9.5, indent: 12 },
  );
  state.y = declY - 80;

  // Identificação
  state.page.drawRectangle({
    x: MARGIN + 80,
    y: state.y,
    width: PAGE_W - 2 * MARGIN - 160,
    height: 0.8,
    color: COLORS.gray,
  });
  state.y -= 6;
  const nomeUp = (rec.sindico_nome || '—').toUpperCase();
  const nomeW = fontBold.widthOfTextAtSize(nomeUp, 14);
  state.page.drawText(nomeUp, {
    x: (PAGE_W - nomeW) / 2,
    y: state.y - 14,
    size: 14,
    font: fontBold,
    color: COLORS.black,
  });
  state.y -= 22;
  const cpfStr = `CPF ${rec.sindico_cpf || '—'}`;
  const cpfW = font.widthOfTextAtSize(cpfStr, 9);
  state.page.drawText(cpfStr, {
    x: (PAGE_W - cpfW) / 2,
    y: state.y - 10,
    size: 9,
    font,
    color: COLORS.gray,
  });
  state.y -= 14;
  const role = 'Síndico legalmente eleito';
  const rW = fontItalic.widthOfTextAtSize(role, 9);
  state.page.drawText(role, {
    x: (PAGE_W - rW) / 2,
    y: state.y - 10,
    size: 9,
    font: fontItalic,
    color: COLORS.gray,
  });
  state.y -= 14;
  const cond = `Representante do Condomínio ${rec.nome_predio || ''}`;
  const cW = font.widthOfTextAtSize(cond, 9);
  state.page.drawText(cond, {
    x: (PAGE_W - cW) / 2,
    y: state.y - 10,
    size: 9,
    font,
    color: COLORS.gray,
  });
  state.y -= 24;

  // Caixa evidências
  ensureSpace(state, 130);
  const evY = state.y;
  state.page.drawRectangle({
    x: MARGIN,
    y: evY - 130,
    width: PAGE_W - 2 * MARGIN,
    height: 130,
    color: COLORS.bgGray,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
  });
  state.page.drawText('EVIDÊNCIAS TÉCNICAS DO ACEITE', {
    x: MARGIN + 10,
    y: evY - 16,
    size: 10,
    font: fontBold,
    color: COLORS.bordo,
  });
  state.y = evY - 34;
  const evRows: [string, string][] = [
    ['Data/hora', fmtBR(new Date(rec.aceite_timestamp || now))],
    ['IP', rec.aceite_ip || '—'],
    ['User-agent', (rec.aceite_user_agent || '—').slice(0, 100)],
    ['Hash SHA-256', hash],
    ['Protocolo', protocolo],
  ];
  for (const [k, v] of evRows) {
    state.page.drawText(k, {
      x: MARGIN + 10,
      y: state.y - 8,
      size: 8.5,
      font: fontBold,
      color: COLORS.black,
    });
    const valLines = wrapText(v, font, 8.5, PAGE_W - MARGIN - (MARGIN + 110));
    state.page.drawText(valLines[0], {
      x: MARGIN + 110,
      y: state.y - 8,
      size: 8.5,
      font,
      color: COLORS.gray,
    });
    state.y -= 14;
  }
  state.y = evY - 145;

  // Selo de assinatura
  ensureSpace(state, 100);
  const cx = PAGE_W / 2;
  const cy = state.y - 50;
  state.page.drawCircle({
    x: cx,
    y: cy,
    size: 38,
    borderColor: COLORS.gray,
    borderWidth: 1.5,
    color: COLORS.white,
  });
  state.page.drawCircle({
    x: cx,
    y: cy,
    size: 32,
    borderColor: COLORS.lightGray,
    borderWidth: 0.8,
    color: COLORS.white,
  });
  state.page.drawText('✓', {
    x: cx - 12,
    y: cy - 12,
    size: 36,
    font: fontBold,
    color: COLORS.red,
  });
  const seloLabel = 'ASSINADO ELETRONICAMENTE · EXA MÍDIA';
  const slW = font.widthOfTextAtSize(seloLabel, 7.5);
  state.page.drawText(seloLabel, {
    x: cx - slW / 2,
    y: cy - 50,
    size: 7.5,
    font: fontBold,
    color: COLORS.gray,
  });
  state.y = cy - 70;
  const validity = 'Validade jurídica equivalente à assinatura manuscrita';
  const vW = fontItalic.widthOfTextAtSize(validity, 8.5);
  state.page.drawText(validity, {
    x: (PAGE_W - vW) / 2,
    y: state.y,
    size: 8.5,
    font: fontItalic,
    color: COLORS.gray,
  });
  state.y -= 24;

  // Bloco USO AUTORIZADO
  ensureSpace(state, 110);
  const uaY = state.y;
  state.page.drawRectangle({
    x: MARGIN,
    y: uaY - 110,
    width: PAGE_W - 2 * MARGIN,
    height: 110,
    color: COLORS.bordoBg,
    borderColor: COLORS.bordo,
    borderWidth: 0.8,
  });
  state.page.drawText('USO AUTORIZADO DESTE DOCUMENTO', {
    x: MARGIN + 10,
    y: uaY - 16,
    size: 10,
    font: fontBold,
    color: COLORS.bordo,
  });
  state.y = uaY - 34;
  drawParagraph(
    state,
    'Este documento comprova a manifestação formal de interesse do síndico acima identificado e a autorização de acesso técnico. Pode ser apresentado a:',
    { size: 9, indent: 10 },
  );
  drawParagraph(state, '• Empresa de manutenção do elevador (Atlas/TKE/Otis/Oriente)', {
    size: 9,
    indent: 18,
  });
  drawParagraph(state, '• Administradora do condomínio e conselho fiscal', { size: 9, indent: 18 });
  drawParagraph(state, '• Autoridades competentes, se solicitado', { size: 9, indent: 18 });
  drawParagraph(state, '• Equipe técnica da EXA Mídia em visita agendada', { size: 9, indent: 18 });

  // Rodapé final
  state.y = 80;
  const f1 = 'INDEXA MÍDIA LTDA · CNPJ 38.142.638/0001-30';
  const f2 = 'Av. Paraná, 974 - Sala 301 · Centro · Foz do Iguaçu/PR · 85852-000';
  const f3 = 'www.examidia.com.br · suporte@examidia.com.br';
  for (const [t, fnt, sz] of [
    [f1, fontBold, 9],
    [f2, font, 8.5],
    [f3, font, 8.5],
  ] as const) {
    const w = fnt.widthOfTextAtSize(t, sz);
    state.page.drawText(t, {
      x: (PAGE_W - w) / 2,
      y: state.y,
      size: sz,
      font: fnt,
      color: COLORS.gray,
    });
    state.y -= 12;
  }
  state.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 6, color: COLORS.bordo });

  // Numeração de páginas (a partir da pág. 2)
  const totalPages = pdf.getPageCount();
  for (let i = 1; i < totalPages; i++) {
    const p = pdf.getPage(i);
    const label = `Página ${i + 1} de ${totalPages}`;
    const w = font.widthOfTextAtSize(label, 8);
    p.drawText(label, {
      x: (PAGE_W - w) / 2,
      y: 18,
      size: 8,
      font,
      color: COLORS.gray,
    });
  }

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

  console.log('[gerar-pdf-aceite-sindico] success', { id, protocolo, path, hash: hash.slice(0, 16) });

  return new Response(
    JSON.stringify({
      success: true,
      pdf_path: path,
      protocolo,
      hash,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
