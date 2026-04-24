// supabase/functions/send-sindico-confirmation/index.ts
// Envia o e-mail de confirmação ao síndico após o aceite, com o PDF jurídico anexado.
// - Carrega o registro de sindicos_interessados.
// - Renderiza o template HTML (placeholders {{PROTOCOLO}}, {{PRIMEIRO_NOME}}, {{NOME_PREDIO}}, {{DATA_REGISTRO}}).
// - Baixa o PDF de termos-sindicos/<aceite_pdf_url> e anexa em base64.
// - Envia via Resend.
// - Marca email_confirmacao_enviado_em / email_confirmacao_message_id na tabela.
// Idempotente: se já enviado, retorna sucesso sem reenviar (a menos que body.force === true).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { SINDICO_CONFIRMACAO_HTML } from '../_shared/email-templates-html/sindico-confirmacao.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const FROM_EMAIL = 'EXA Mídia <contato@examidia.com.br>';
const REPLY_TO = 'contato@examidia.com.br';

// Template HTML inlinado (Edge Runtime não empacota arquivos .html)
const TEMPLATE_HTML = SINDICO_CONFIRMACAO_HTML;

function firstName(full: string | null | undefined): string {
  if (!full) return 'Síndico(a)';
  const parts = String(full).trim().split(/\s+/);
  return parts[0] || 'Síndico(a)';
}

function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  // dd/mm/yyyy às HH:MM (horário de São Paulo)
  const dt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const tm = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${dt} às ${tm}`;
}

function renderTemplate(html: string, vars: Record<string, string>): string {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Conversão segura para base64 em chunks (evita estourar argumentos)
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'RESEND_API_KEY não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({} as any));
    const id: string | undefined = body?.sindico_interessado_id;
    const force: boolean = body?.force === true;

    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'sindico_interessado_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: rec, error: recErr } = await supa
      .from('sindicos_interessados')
      .select(
        'id, protocolo, nome_predio, sindico_nome, nome_completo, sindico_email, email, aceite_pdf_url, aceite_timestamp, created_at, email_confirmacao_enviado_em, tipo_predio, permite_airbnb',
      )
      .eq('id', id)
      .single();

    if (recErr || !rec) {
      console.error('[send-sindico-confirmation] registro não encontrado', { id, recErr });
      return new Response(JSON.stringify({ success: false, error: 'Registro não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotência
    if (rec.email_confirmacao_enviado_em && !force) {
      console.log('[send-sindico-confirmation] já enviado', {
        id,
        enviado_em: rec.email_confirmacao_enviado_em,
      });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'already_sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const recipient: string = (rec.sindico_email || rec.email || '').trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      console.error('[send-sindico-confirmation] e-mail inválido', { id, recipient });
      await supa
        .from('sindicos_interessados')
        .update({ email_confirmacao_erro: 'E-mail do síndico inválido ou ausente' })
        .eq('id', id);
      return new Response(
        JSON.stringify({ success: false, error: 'E-mail do síndico inválido ou ausente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const protocolo = rec.protocolo || '—';
    const nomePredio = rec.nome_predio || '—';
    const fullName = rec.sindico_nome || rec.nome_completo || '';
    const dataRegistro = formatDateBR(rec.aceite_timestamp || rec.created_at);

    const tipoLbl = rec.tipo_predio === 'residencial' ? 'Residencial' : rec.tipo_predio === 'comercial' ? 'Comercial' : '—';
    const airbnbLbl = rec.tipo_predio === 'residencial'
      ? (rec.permite_airbnb === 'sim' ? 'permite Airbnb' : rec.permite_airbnb === 'nao' ? 'não permite Airbnb' : 'Airbnb não informado')
      : '';
    const perfilPredio = rec.tipo_predio === 'residencial' ? `${tipoLbl} · ${airbnbLbl}` : tipoLbl;

    const html = renderTemplate(TEMPLATE_HTML, {
      PROTOCOLO: protocolo,
      PRIMEIRO_NOME: firstName(fullName),
      NOME_PREDIO: nomePredio,
      DATA_REGISTRO: dataRegistro,
      PERFIL_PREDIO: perfilPredio,
    });

    // Baixa PDF (se existir) e converte para base64
    let attachments: Array<{ filename: string; content: string }> | undefined;
    if (rec.aceite_pdf_url) {
      try {
        const { data: pdfData, error: pdfErr } = await supa.storage
          .from('termos-sindicos')
          .download(rec.aceite_pdf_url);
        if (pdfErr || !pdfData) {
          console.warn('[send-sindico-confirmation] não conseguiu baixar PDF', pdfErr);
        } else {
          const buf = new Uint8Array(await pdfData.arrayBuffer());
          attachments = [
            {
              filename: `Termo-${protocolo}.pdf`,
              content: bytesToBase64(buf),
            },
          ];
        }
      } catch (e: any) {
        console.warn('[send-sindico-confirmation] exceção ao baixar PDF (continua sem anexo)', e?.message);
      }
    } else {
      console.warn('[send-sindico-confirmation] aceite_pdf_url ausente — enviando sem anexo', { id });
    }

    const subject = `Registro recebido • Protocolo ${protocolo} • EXA Mídia`;

    // Versão texto plano (melhora pontuação anti-spam — e-mails só-HTML são suspeitos)
    const textPlain = [
      `Olá, ${firstName(fullName)}.`,
      ``,
      `Recebemos seu registro de interesse em receber painéis digitais da EXA Mídia no ${nomePredio}.`,
      ``,
      `Protocolo: ${protocolo}`,
      `Registrado em: ${dataRegistro}`,
      `Status: Assinado eletronicamente`,
      ``,
      `PRÓXIMOS PASSOS:`,
      `1. Análise técnica interna pela equipe EXA Mídia.`,
      `2. Contato pelo WhatsApp informado, caso aprovado.`,
      `3. Apresentação da proposta e contrato de comodato.`,
      ``,
      `IMPORTANTE: Caso não veja nossos próximos contatos, verifique sua caixa de Spam / Lixo Eletrônico e marque contato@examidia.com.br como remetente confiável.`,
      ``,
      `O Termo de Registro de Interesse em PDF está anexado a este e-mail.`,
      ``,
      `Para revogar este registro ou esclarecer dúvidas: suporte@examidia.com.br`,
      ``,
      `—`,
      `INDEXA MÍDIA LTDA · CNPJ 38.142.638/0001-30`,
      `Av. Paraná, 974 — Sala 301 · Centro · Foz do Iguaçu/PR`,
      `www.examidia.com.br`,
    ].join('\n');

    const resendPayload: Record<string, unknown> = {
      from: FROM_EMAIL,
      to: [recipient],
      reply_to: REPLY_TO,
      subject,
      html,
      text: textPlain,
      headers: {
        'List-Unsubscribe': '<mailto:contato@examidia.com.br?subject=Unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Entity-Ref-ID': protocolo,
      },
      tags: [
        { name: 'category', value: 'sindico-confirmation' },
        { name: 'protocolo', value: protocolo.replace(/[^a-zA-Z0-9_-]/g, '_') },
      ],
    };
    if (attachments) resendPayload.attachments = attachments;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const resendJson = await resendRes.json().catch(() => ({} as any));

    if (!resendRes.ok) {
      console.error('[send-sindico-confirmation] Resend falhou', {
        status: resendRes.status,
        body: resendJson,
      });
      await supa
        .from('sindicos_interessados')
        .update({
          email_confirmacao_erro:
            (resendJson?.message || resendJson?.error || `HTTP ${resendRes.status}`).toString().slice(0, 500),
        })
        .eq('id', id);
      return new Response(
        JSON.stringify({ success: false, error: 'Falha no envio', details: resendJson }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const messageId: string | undefined = resendJson?.id;

    await supa
      .from('sindicos_interessados')
      .update({
        email_confirmacao_enviado_em: new Date().toISOString(),
        email_confirmacao_message_id: messageId ?? null,
        email_confirmacao_erro: null,
      })
      .eq('id', id);

    console.log('[send-sindico-confirmation] enviado', { id, protocolo, recipient, messageId });

    return new Response(
      JSON.stringify({ success: true, message_id: messageId, protocolo, recipient }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    console.error('[send-sindico-confirmation] exceção', e?.message, e?.stack);
    return new Response(
      JSON.stringify({ success: false, error: e?.message || 'Erro inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
