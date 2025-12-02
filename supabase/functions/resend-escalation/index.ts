import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { escalacaoId, vendedorIds } = await req.json();

    console.log('[RESEND-ESCALATION] 🚀 Reenviando escalação:', {
      escalacaoId,
      vendedorIds,
      timestamp: new Date().toISOString()
    });

    if (!escalacaoId || !vendedorIds || vendedorIds.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'escalacaoId e vendedorIds são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Buscar a escalação
    const { data: escalacao, error: escError } = await supabase
      .from('escalacoes_comerciais')
      .select('*')
      .eq('id', escalacaoId)
      .single();

    if (escError || !escalacao) {
      console.error('[RESEND-ESCALATION] ❌ Escalação não encontrada:', escError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Escalação não encontrada' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Buscar vendedores selecionados
    const { data: vendedores, error: vendError } = await supabase
      .from('escalacao_vendedores')
      .select('*')
      .in('id', vendedorIds);

    if (vendError || !vendedores || vendedores.length === 0) {
      console.error('[RESEND-ESCALATION] ❌ Vendedores não encontrados:', vendError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nenhum vendedor encontrado' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Buscar config Z-API
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'sofia')
      .single();

    if (agentError || !agent?.zapi_config) {
      console.error('[RESEND-ESCALATION] ❌ Config Z-API não encontrada:', agentError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Configuração Z-API não encontrada' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const zapiConfig = agent.zapi_config as { instance_id?: string; token?: string };
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiConfig.instance_id || !zapiConfig.token || !zapiClientToken) {
      console.error('[RESEND-ESCALATION] ❌ Credenciais Z-API incompletas');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Credenciais Z-API incompletas' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Montar mensagem
    const formatPhoneDisplay = (phone: string) => {
      const clean = phone.replace(/\D/g, '');
      if (clean.length === 13) {
        return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
      }
      return phone;
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const cleanPhoneForLink = escalacao.phone_number.replace(/\D/g, '');

    let message = `🔔 *ESCALAÇÃO COMERCIAL (REENVIO)*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📅 *Reenviado em:* ${dateStr} às ${timeStr}\n\n`;
    message += `👤 *Lead:* ${escalacao.lead_name || 'Não identificado'}\n`;
    message += `📱 *Telefone:* ${formatPhoneDisplay(escalacao.phone_number)}\n`;
    message += `📲 *WhatsApp:* https://wa.me/${cleanPhoneForLink}\n`;
    
    if (escalacao.lead_segment) {
      message += `🏢 *Segmento:* ${escalacao.lead_segment}\n`;
    }
    
    if (escalacao.plans_interested && escalacao.plans_interested.length > 0) {
      message += `📊 *Planos:* ${escalacao.plans_interested.join(', ')}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (escalacao.first_message) {
      message += `\n💬 *Primeira mensagem:*\n"${escalacao.first_message.substring(0, 200)}${escalacao.first_message.length > 200 ? '...' : ''}"\n`;
    }

    if (escalacao.conversation_summary) {
      message += `\n📝 *Resumo:*\n${escalacao.conversation_summary.substring(0, 500)}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━`;
    message += `\n⚡ Cliente solicitou condição especial`;
    message += `\n💼 *Clique no botão abaixo após responder!*`;

    // 5. Enviar para cada vendedor COM BOTÕES
    let successCount = 0;
    const errors: string[] = [];
    
    for (const vendedor of vendedores) {
      try {
        const vendedorPhone = vendedor.telefone.startsWith('55') 
          ? vendedor.telefone 
          : `55${vendedor.telefone}`;

        const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-button-actions`;
        const fullMessage = `Olá ${vendedor.nome}!\n\n${message}`;
        
        // Botões com ID da escalação
        const buttonJaRespondi = `escalacao_respondida_${escalacao.id}`;
        const buttonVouResponder = `escalacao_depois_${escalacao.id}`;
        
        console.log(`[RESEND-ESCALATION] 📤 Enviando para ${vendedor.nome}:`, {
          phone: vendedorPhone,
          messageLength: fullMessage.length,
          buttons: [buttonJaRespondi, buttonVouResponder]
        });
        
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken
          },
          body: JSON.stringify({
            phone: vendedorPhone,
            message: fullMessage,
            buttonActions: [
              {
                id: buttonJaRespondi,
                label: "✅ Já respondi"
              },
              {
                id: buttonVouResponder,
                label: "⏰ Vou responder depois"
              }
            ]
          })
        });

        const responseText = await response.text();
        console.log(`[RESEND-ESCALATION] 📥 Resposta Z-API para ${vendedor.nome}:`, {
          status: response.status,
          ok: response.ok,
          body: responseText.substring(0, 200)
        });

        if (response.ok) {
          successCount++;
          console.log(`[RESEND-ESCALATION] ✅ Enviado com sucesso para ${vendedor.nome}`);
        } else {
          // Fallback para texto simples se botões falharem
          console.log(`[RESEND-ESCALATION] ⚠️ Botões falharam, tentando texto simples...`);
          
          const textUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
          const fallbackMessage = fullMessage + `\n\n⚠️ Responda "OK" quando atender ou "DEPOIS" para lembrete.`;
          
          const textResponse = await fetch(textUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Client-Token': zapiClientToken
            },
            body: JSON.stringify({
              phone: vendedorPhone,
              message: fallbackMessage
            })
          });

          if (textResponse.ok) {
            successCount++;
            console.log(`[RESEND-ESCALATION] ✅ Fallback texto enviado para ${vendedor.nome}`);
          } else {
            errors.push(`Falha ao enviar para ${vendedor.nome}`);
          }
        }
      } catch (err) {
        console.error(`[RESEND-ESCALATION] ❌ Erro ao enviar para ${vendedor.nome}:`, err);
        errors.push(`Erro ao enviar para ${vendedor.nome}: ${err.message}`);
      }
    }

    console.log('[RESEND-ESCALATION] ✅ Concluído:', {
      total: vendedores.length,
      successCount,
      errors: errors.length
    });

    return new Response(JSON.stringify({ 
      success: true,
      sent: successCount,
      total: vendedores.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[RESEND-ESCALATION] ❌ Erro:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
