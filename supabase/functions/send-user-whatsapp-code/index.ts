import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


// Segurança (02/11/2026): quem pede/verifica código para uma conta tem que ser o dono da conta (JWT) ou a equipe.
// Antes o userId vinha do corpo: dava para trocar o telefone de qualquer conta e o limite era por sessionId (contornável).
const EQUIPE = ['super_admin', 'admin', 'admin_financeiro', 'admin_departamental', 'comercial'];
async function donoOuEquipe(supabase: any, req: Request, userId?: string): Promise<boolean> {
  if (!userId) return true;
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  if (user.id === userId) return true;
  const { data: papeis } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
  return (papeis || []).some((r: any) => EQUIPE.includes(String(r.role)));
}
const soDigitos = (t?: string) => String(t || '').replace(/\D/g, '');

interface RequestBody {
  userId?: string;
  telefone: string;
  tipo: 'phone_change' | '2fa_login' | 'new_phone' | 'signup';
  novoTelefone?: string;
  sessionId?: string;
  canal?: 'nando';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Parse do body
    const body: RequestBody = await req.json();
    const { userId, telefone, tipo, novoTelefone, sessionId } = body;

    console.log('📥 [SEND-USER-CODE] Recebido:', { 
      userId: userId || 'sem userId (signup)', 
      telefone: telefone?.substring(0, 8) + '****', 
      tipo,
      sessionId: sessionId || 'sem session'
    });

    // Para tipo 'signup', userId pode ser opcional (verificação antes de criar conta)
    // Usa sessionId para rastrear
    if (!telefone || !tipo) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios faltando (telefone, tipo)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não for signup, userId é obrigatório
    if (tipo !== 'signup' && !userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório para este tipo de verificação' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!(await donoOuEquipe(supabase, req, userId))) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // 2FA e confirmação do número atual: o código vai SEMPRE para o telefone cadastrado da conta
    if (userId && (tipo === '2fa_login' || tipo === 'phone_change')) {
      const { data: u } = await supabase.from('users').select('telefone').eq('id', userId).maybeSingle();
      if (u?.telefone) body.telefone = u.telefone;
    }
    const telefoneAlvo = body.telefone;

    // Rate limiting: verificar tentativas recentes (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // limite por TELEFONE (antes era por sessionId, que o próprio navegador escolhe)
    const rateLimitQuery = supabase
      .from('exa_alerts_verification_codes')
      .select('id')
      .eq('telefone', telefoneAlvo)
      .gte('created_at', fiveMinutesAgo);

    const { data: recentCodes, error: rateLimitError } = await rateLimitQuery;

    if (rateLimitError) {
      console.error('❌ [SEND-USER-CODE] Erro ao verificar rate limit:', rateLimitError);
    }

    if (recentCodes && recentCodes.length >= 3) {
      console.warn('⚠️ [SEND-USER-CODE] Rate limit excedido');
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
          success: false 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 [SEND-USER-CODE] Código gerado:', codigo.substring(0, 3) + '***');

    // Definir mensagem baseada no tipo
    let mensagem = '';
    switch (tipo) {
      case 'phone_change':
        mensagem = `🔐 *Código de Verificação EXA*\n\nSeu código para alterar o WhatsApp é:\n\n*${codigo}*\n\nVálido por 5 minutos.`;
        break;
      case '2fa_login':
        mensagem = `🔐 *Código de Acesso EXA*\n\nSeu código de autenticação é:\n\n*${codigo}*\n\nVálido por 5 minutos.\n\n_Se você não tentou fazer login, ignore esta mensagem._`;
        break;
      case 'new_phone':
        mensagem = `✅ *Verificação de Novo WhatsApp - EXA*\n\nSeu código de verificação é:\n\n*${codigo}*\n\nVálido por 5 minutos.`;
        break;
      case 'signup':
        mensagem = `🎉 *Bem-vindo à EXA!*\n\nPara completar seu cadastro, digite o código:\n\n*${codigo}*\n\nVálido por 5 minutos.`;
        break;
      default:
        mensagem = `🔐 Código de verificação EXA: *${codigo}*\n\nVálido por 5 minutos.`;
    }

    // Inserir código no banco
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const insertData: any = {
      telefone: telefoneAlvo,
      codigo,
      tipo_verificacao: tipo,
      expires_at: expiresAt.toISOString(),
      verificado: false
    };
    if (userId) insertData.user_id = userId;
    else if (sessionId) insertData.session_id = sessionId;

    const { error: insertError } = await supabase
      .from('exa_alerts_verification_codes')
      .insert(insertData);

    if (insertError) {
      console.error('❌ [SEND-USER-CODE] Erro ao salvar código:', insertError);
      throw insertError;
    }

    // 06/11/2026 (Jeferson): tudo de síndico é do Nando — o código do formulário do síndico sai pelo WhatsApp do Nando.
    if (body.canal === 'nando') {
      const evoUrl = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/+$/, '');
      const evoKey = Deno.env.get('EVOLUTION_API_KEY') || '';
      let inst = Deno.env.get('NANDO_INSTANCIA') || '';
      if (!inst) {
        const { data: ni } = await supabase.from('evolution_instances').select('instance_name').ilike('instance_name', '%nando%').order('created_at', { ascending: false }).limit(1).maybeSingle();
        inst = ni?.instance_name || 'exa-nando-sindicos-mvmjft5q';
      }
      const textoNando = `Oi! Aqui é o Nando, da EXA Mídia 👋\n\nSeu código para confirmar o cadastro do prédio é *${codigo}*.\n\nVale por 5 minutos. Depois é por aqui mesmo que eu cuido de tudo do seu condomínio com você.`;
      const rN = await fetch(`${evoUrl}/message/sendText/${inst}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: evoKey },
        body: JSON.stringify({ number: soDigitos(telefoneAlvo).startsWith('55') ? soDigitos(telefoneAlvo) : '55' + soDigitos(telefoneAlvo), text: textoNando }),
      });
      if (!rN.ok) throw new Error('Não consegui enviar o código pelo WhatsApp agora. Tente de novo em instantes.');
      return new Response(JSON.stringify({ success: true, canal: 'nando' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 🔄 Enviar via roteador zapi-send-message → Evolution (Notificações EXA)
    console.log('📤 [SEND-USER-CODE] Enviando código via shim Evolution para:', telefone.substring(0, 8) + '****');
    const { data: sendData, error: sendError } = await supabase.functions.invoke('zapi-send-message', {
      body: {
        agentKey: 'exa_alert',
        codigo: true, // código de acesso: única exceção que ainda sai pelo número de notificações (temporário)
        phone: telefoneAlvo,
        message: mensagem,
        skipSplit: true,
      },
    });

    if (sendError) {
      console.error('❌ [SEND-USER-CODE] Erro do shim Evolution:', sendError);
      throw new Error(`Erro ao enviar código via WhatsApp: ${sendError.message || sendError}`);
    }
    if (sendData && typeof sendData === 'object' && (sendData as any).error) {
      console.error('❌ [SEND-USER-CODE] Shim retornou erro:', (sendData as any).error);
      throw new Error(`Erro ao enviar código via WhatsApp: ${(sendData as any).error}`);
    }

    console.log('✅ [SEND-USER-CODE] Código enviado com sucesso via Evolution');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso',
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [SEND-USER-CODE] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao enviar código', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
