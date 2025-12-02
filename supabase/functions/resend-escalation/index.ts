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
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'sofia')
      .single();

    const zapiConfig = agent?.zapi_config as { instance_id?: string; token?: string } | null;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiConfig?.instance_id || !zapiConfig?.token || !zapiClientToken) {
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
    
    if (escalacao.lead_segment) message += `🏢 *Segmento:* ${escalacao.lead_segment}\n`;
    if (escalacao.plans_interested?.length > 0) message += `📊 *Planos:* ${escalacao.plans_interested.join(', ')}\n`;

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (escalacao.first_message) {
      message += `\n💬 *Primeira mensagem:*\n"${escalacao.first_message.substring(0, 200)}${escalacao.first_message.length > 200 ? '...' : ''}"\n`;
    }

    if (escalacao.conversation_summary) {
      message += `\n📝 *Resumo:*\n${escalacao.conversation_summary.substring(0, 500)}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━`;
    message += `\n⚡ Cliente solicitou condição especial`;

    // 5. NOVA ESTRATÉGIA: TEXTO PRIMEIRO (garantido) + BOTÕES DEPOIS (opcional)
    let successCount = 0;
    const errors: string[] = [];
    const textUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
    const buttonUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-button-actions`;
    
    for (const vendedor of vendedores) {
      try {
        const vendedorPhone = vendedor.telefone.startsWith('55') 
          ? vendedor.telefone 
          : `55${vendedor.telefone}`;

        // ✅ PASSO 1: SEMPRE enviar TEXTO PRIMEIRO (100% garantido funcionar)
        const fullTextMessage = `Olá ${vendedor.nome}!\n\n${message}\n\n📌 *RESPONDA:*\n• "OK" ou "ATENDI" = Já respondi ao lead\n• "DEPOIS" = Vou responder depois`;
        
        console.log(`[RESEND-ESCALATION] 📤 Sending TEXT to ${vendedor.nome}...`);
        
        const textResponse = await fetch(textUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Client-Token': zapiClientToken
          },
          body: JSON.stringify({
            phone: vendedorPhone,
            message: fullTextMessage
          })
        });

        const textResult = await textResponse.text();
        console.log(`[RESEND-ESCALATION] 📥 Text response for ${vendedor.nome}:`, {
          status: textResponse.status,
          ok: textResponse.ok
        });

        if (textResponse.ok) {
          successCount++;
          console.log(`[RESEND-ESCALATION] ✅ TEXT sent to ${vendedor.nome}`);
          
          // ✅ PASSO 2: TENTAR botões como bônus
          try {
            const buttonJaRespondi = `escalacao_respondida_${escalacao.id}`;
            const buttonVouResponder = `escalacao_depois_${escalacao.id}`;
            
            const buttonResponse = await fetch(buttonUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Client-Token': zapiClientToken
              },
              body: JSON.stringify({
                phone: vendedorPhone,
                message: "👆 Ou clique em um botão:",
                buttonActions: [
                  { id: buttonJaRespondi, label: "✅ Já respondi" },
                  { id: buttonVouResponder, label: "⏰ Vou responder depois" }
                ]
              })
            });

            if (buttonResponse.ok) {
              console.log(`[RESEND-ESCALATION] ✅ BUTTONS also sent to ${vendedor.nome}`);
            } else {
              console.log(`[RESEND-ESCALATION] ⚠️ Buttons failed for ${vendedor.nome}, text was sent`);
            }
          } catch (buttonError) {
            console.log(`[RESEND-ESCALATION] ⚠️ Button attempt failed, text was sent`);
          }
        } else {
          errors.push(`Falha ao enviar para ${vendedor.nome}`);
        }
      } catch (err) {
        console.error(`[RESEND-ESCALATION] ❌ Erro ao enviar para ${vendedor.nome}:`, err);
        errors.push(`Erro ao enviar para ${vendedor.nome}: ${err.message}`);
      }
    }

    console.log('[RESEND-ESCALATION] ✅ Concluído:', {
      total: vendedores.length,
      successCount,
      errors: errors.length,
      strategy: 'text_first_buttons_optional'
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
