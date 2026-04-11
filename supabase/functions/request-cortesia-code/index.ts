import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, clientPhone, clientCnpj, buildings, durationMonths, totalPanels, vendorName, vendorId } = await req.json();

    console.log('[request-cortesia-code] Dados recebidos:', { clientName, clientEmail, buildings: buildings?.length, durationMonths });

    // Validações
    if (!clientName || !clientEmail || !buildings || buildings.length === 0) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios não fornecidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar código de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    console.log('[request-cortesia-code] Código gerado:', code);

    // Salvar código na tabela cortesia_codes (expira em 10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const { data: codeRecord, error: insertError } = await supabase
      .from('cortesia_codes')
      .insert({
        code,
        request_data: {
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone,
          client_cnpj: clientCnpj,
          buildings,
          duration_months: durationMonths,
          total_panels: totalPanels,
          vendor_name: vendorName
        },
        created_by: vendorId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('[request-cortesia-code] Erro ao inserir código:', insertError);
      throw insertError;
    }

    console.log('[request-cortesia-code] Código salvo com ID:', codeRecord.id);

    // Buscar telefone do Super Admin na tabela exa_alerts_directors
    const { data: directors, error: directorError } = await supabase
      .from('exa_alerts_directors')
      .select('telefone, nome')
      .eq('ativo', true)
      .limit(1);

    if (directorError || !directors || directors.length === 0) {
      console.error('[request-cortesia-code] Nenhum super admin encontrado:', directorError);
      throw new Error('Nenhum administrador configurado para receber códigos');
    }

    const superAdminPhone = directors[0].telefone;
    const superAdminName = directors[0].nome;
    console.log('[request-cortesia-code] Enviando para:', superAdminName, superAdminPhone);

    // Construir mensagem WhatsApp
    const message = `🎁 *SOLICITAÇÃO DE CORTESIA*

Vendedor: ${vendorName || 'Não identificado'}
Cliente: ${clientName}
E-mail: ${clientEmail}
${clientPhone ? `WhatsApp: ${clientPhone}` : ''}
${clientCnpj ? `CNPJ: ${clientCnpj}` : ''}

📍 Prédios: ${buildings.length}
📺 Telas: ${totalPanels || 0}
📅 Período: ${durationMonths} ${durationMonths === 1 ? 'mês' : 'meses'}

👉 *CÓDIGO: ${code}*

⏰ Válido por 10 minutos`;

    // Buscar configuração do agente Sofia para Z-API
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    if (agentError || !agent?.zapi_config) {
      console.error('[request-cortesia-code] Erro ao buscar config Z-API:', agentError);
      throw new Error('Configuração Z-API não encontrada');
    }

    const zapiConfig = agent.zapi_config as any;
    const zapiInstanceId = zapiConfig.instance_id;
    const zapiToken = zapiConfig.token;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    // Formatar telefone (remover caracteres não numéricos)
    const cleanPhone = superAdminPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Enviar via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiToken}/send-text`;
    
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiClientToken || ''
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message
      })
    });

    const zapiResult = await zapiResponse.json();
    console.log('[request-cortesia-code] Resposta Z-API:', zapiResult);

    if (!zapiResponse.ok) {
      console.error('[request-cortesia-code] Erro Z-API:', zapiResult);
      // Não lançar erro, apenas logar - o código foi gerado mesmo se WhatsApp falhar
    }

    // Log do evento
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'CORTESIA_CODE_REQUESTED',
      descricao: `Código de cortesia solicitado por ${vendorName} para ${clientName}. Código enviado para ${superAdminName}`
    });

    return new Response(JSON.stringify({
      success: true,
      requestId: codeRecord.id,
      sentTo: superAdminName,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[request-cortesia-code] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
