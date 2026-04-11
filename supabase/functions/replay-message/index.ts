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

  console.log('[REPLAY-MESSAGE] ========== INICIANDO REPLAY ==========');

  try {
    // 1. Autenticação obrigatória
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authorization header required'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Validar usuário e permissões
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid authentication'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Verificar role do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const allowedRoles = ['admin', 'gerente_master', 'gerente'];
    if (!userData || !allowedRoles.includes(userData.role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Insufficient permissions. Required: admin, gerente_master, or gerente'
      }), { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 3. Parse request body
    const body = await req.json();
    const { message_id, zapi_message_id, reason } = body;

    if (!message_id && !zapi_message_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Either message_id or zapi_message_id is required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('[REPLAY-MESSAGE] Buscando mensagem:', { message_id, zapi_message_id });

    // 4. Buscar mensagem original
    let query = supabase
      .from('messages')
      .select(`
        id,
        zapi_message_id,
        conversation_id,
        content,
        raw_payload,
        direction,
        created_at,
        conversations!inner(
          contact_id,
          agent_key,
          contacts!inner(phone)
        )
      `);

    if (message_id) {
      query = query.eq('id', message_id);
    } else {
      query = query.eq('zapi_message_id', zapi_message_id);
    }

    const { data: originalMessage, error: fetchError } = await query.maybeSingle();

    if (fetchError || !originalMessage) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Message not found'
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('[REPLAY-MESSAGE] Mensagem encontrada:', {
      id: originalMessage.id,
      direction: originalMessage.direction,
      has_raw_payload: !!originalMessage.raw_payload
    });

    // 5. Validar que é uma mensagem inbound (faz sentido reprocessar)
    if (originalMessage.direction !== 'inbound') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only inbound messages can be replayed'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 6. Criar registro de auditoria (status pending)
    const { data: auditRecord, error: auditError } = await supabase
      .from('replay_audit')
      .insert({
        original_message_id: originalMessage.id,
        replayed_by: user.id,
        reason: reason || 'Manual replay requested',
        status: 'pending'
      })
      .select('id')
      .single();

    if (auditError) {
      console.error('[REPLAY-MESSAGE] Erro ao criar auditoria:', auditError);
      throw auditError;
    }

    // 7. Preparar payload para replay
    const conversation = originalMessage.conversations as any;
    const phone = conversation?.contacts?.phone;
    const agentKey = conversation?.agent_key;

    if (!phone || !agentKey) {
      await updateAuditStatus(supabase, auditRecord.id, 'failed', 'Missing phone or agent_key');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing phone or agent_key in original message'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 8. Gerar novo messageId para bypass de deduplicação
    const newMessageId = `replay_${Date.now()}_${originalMessage.zapi_message_id || originalMessage.id}`;
    
    // 9. Reconstruir payload do webhook
    const replayPayload = originalMessage.raw_payload || {
      phone: phone,
      text: { message: originalMessage.content },
      messageId: newMessageId,
      fromMe: false,
      isReplay: true,
      originalMessageId: originalMessage.id,
      replayedAt: new Date().toISOString(),
      replayedBy: user.id
    };

    // Garantir que o payload tenha o novo messageId
    if (typeof replayPayload === 'object') {
      (replayPayload as any).messageId = newMessageId;
      (replayPayload as any).isReplay = true;
      (replayPayload as any).originalMessageId = originalMessage.id;
    }

    console.log('[REPLAY-MESSAGE] Invocando zapi-webhook com payload de replay');

    // 10. Invocar zapi-webhook
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/zapi-webhook?agent=${agentKey}`;
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify(replayPayload)
    });

    const webhookResult = await webhookResponse.json();
    console.log('[REPLAY-MESSAGE] Resposta do webhook:', webhookResult);

    // 11. Atualizar auditoria com resultado
    if (webhookResponse.ok && webhookResult.success !== false) {
      // Buscar nova mensagem criada (se houver)
      const { data: newMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('zapi_message_id', newMessageId)
        .maybeSingle();

      await supabase
        .from('replay_audit')
        .update({
          status: 'success',
          new_message_id: newMessage?.id || null
        })
        .eq('id', auditRecord.id);

      // Atualizar mensagem original com referência
      if (newMessage?.id) {
        await supabase
          .from('messages')
          .update({ parent_message_id: originalMessage.id })
          .eq('id', newMessage.id);
      }

      console.log('[REPLAY-MESSAGE] ========== REPLAY CONCLUÍDO COM SUCESSO ==========');

      return new Response(JSON.stringify({
        success: true,
        message: 'Message replayed successfully',
        audit_id: auditRecord.id,
        new_message_id: newMessage?.id || null,
        original_message_id: originalMessage.id
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else {
      const errorMessage = webhookResult.error || 'Webhook returned error';
      await updateAuditStatus(supabase, auditRecord.id, 'failed', errorMessage);

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
        audit_id: auditRecord.id
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

  } catch (error) {
    console.error('[REPLAY-MESSAGE] Erro fatal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

async function updateAuditStatus(supabase: any, auditId: string, status: string, errorMessage?: string) {
  await supabase
    .from('replay_audit')
    .update({
      status,
      error_message: errorMessage || null
    })
    .eq('id', auditId);
}
