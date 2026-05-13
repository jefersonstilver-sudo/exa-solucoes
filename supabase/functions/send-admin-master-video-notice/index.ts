import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { email, name } = await req.json();
    if (!email) throw new Error('email é obrigatório');
    const firstName = (name || '').split(' ')[0] || 'Administrador';

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nova função: Admin Master de Vídeo</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.06);overflow:hidden;">
  <tr><td style="padding:36px 40px 16px;text-align:center;background:linear-gradient(135deg,#C7141A 0%,#7D1818 100%);color:#fff;">
    <div style="font-size:32px;margin-bottom:8px;">🛡️</div>
    <h1 style="margin:0;font-size:24px;font-weight:700;">Nova função ativada</h1>
    <p style="margin:8px 0 0;font-size:15px;opacity:.9;">Admin Master de Vídeo</p>
  </td></tr>
  <tr><td style="padding:32px 40px;color:#1a1a1a;">
    <p style="margin:0 0 16px;font-size:16px;">Olá, <strong>${firstName}</strong>!</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
      Sua conta na EXA Mídia recebeu a função <strong>Admin Master de Vídeo</strong>. Com ela você pode acessar a área dos anunciantes
      como se fosse o cliente para gerenciar pedidos, vídeos, relatórios e QR codes rastreáveis.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:18px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:600;color:#7D1818;font-size:14px;">⚠️ Cuidados importantes</p>
      <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;line-height:1.6;">
        <li>Toda ação fica registrada em auditoria com seu nome.</li>
        <li>A sessão de impersonação expira automaticamente em 30 minutos.</li>
        <li>Vídeos enviados por você entram já aprovados — confira antes de salvar.</li>
        <li>Exclusões são permanentes (banco, storage e AWS).</li>
      </ul>
    </div>
    <p style="margin:0 0 8px;font-size:14px;color:#374151;">Ao logar, você verá um guia de boas-vindas explicando o passo a passo.</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://examidia.com.br/super_admin/pedidos" style="display:inline-block;padding:12px 24px;background:#C7141A;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Acessar painel</a>
    </div>
  </td></tr>
  <tr><td style="padding:18px;text-align:center;background:#fafafa;color:#9ca3af;font-size:12px;">EXA Mídia · INDEXA MIDIA LTDA</td></tr>
</table></td></tr></table></body></html>`;

    const { error } = await resend.emails.send({
      from: 'EXA Mídia <noreply@examidia.com.br>',
      to: [email],
      subject: '🛡️ Nova função ativada: Admin Master de Vídeo',
      html,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-admin-master-video-notice error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
