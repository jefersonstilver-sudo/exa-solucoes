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
    const { requestId, code } = await req.json();

    console.log('[validate-cortesia-code] Validando:', { requestId, code });

    if (!requestId || !code) {
      return new Response(JSON.stringify({ error: 'requestId e code são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar código no banco
    const { data: codeRecord, error: fetchError } = await supabase
      .from('cortesia_codes')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !codeRecord) {
      console.error('[validate-cortesia-code] Código não encontrado:', fetchError);
      return new Response(JSON.stringify({ error: 'Solicitação não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se já foi usado
    if (codeRecord.used_at) {
      return new Response(JSON.stringify({ error: 'Este código já foi utilizado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se expirou
    if (new Date(codeRecord.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Código expirado. Solicite um novo.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se o código está correto
    if (codeRecord.code !== code) {
      console.log('[validate-cortesia-code] Código incorreto:', { expected: codeRecord.code, received: code });
      return new Response(JSON.stringify({ error: 'Código incorreto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Marcar como validado
    await supabase
      .from('cortesia_codes')
      .update({ validated_at: new Date().toISOString() })
      .eq('id', requestId);

    console.log('[validate-cortesia-code] Código validado com sucesso');

    // Chamar create-cortesia-proposal para criar PROPOSTA (não pedido!)
    const { data: proposalResult, error: proposalError } = await supabase.functions.invoke('create-cortesia-proposal', {
      body: {
        requestId,
        requestData: codeRecord.request_data,
        createdBy: codeRecord.created_by
      }
    });

    if (proposalError) {
      console.error('[validate-cortesia-code] Erro ao criar proposta de cortesia:', proposalError);
      throw proposalError;
    }

    // NÃO marcar código como usado ainda - será marcado quando cliente ACEITAR
    // await supabase
    //   .from('cortesia_codes')
    //   .update({ used_at: new Date().toISOString() })
    //   .eq('id', requestId);

    // Log do evento
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'CORTESIA_CODE_VALIDATED',
      descricao: `Código de cortesia validado para ${codeRecord.request_data.client_name}. Proposta enviada.`
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Proposta de cortesia enviada para o cliente!',
      proposal: proposalResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[validate-cortesia-code] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
