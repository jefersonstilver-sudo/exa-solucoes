import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { messageId, fromEmail, fromName, subject, candidateData, hrAnalysis, receivedAt } = await req.json();
    
    console.log('Sending curriculum notification:', { messageId, fromEmail });

    // Get alert recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('curriculum_alert_config')
      .select('*')
      .eq('is_active', true);

    if (recipientsError || !recipients || recipients.length === 0) {
      console.log('No active recipients configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Nenhum destinatário configurado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build notification message
    const receivedDate = receivedAt ? new Date(receivedAt) : new Date();
    const formattedDate = receivedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const candidate = candidateData || {};
    const analysis = hrAnalysis || {};

    let message = `📄 *NOVO CURRÍCULO RECEBIDO*\n\n`;
    message += `👤 *Candidato:* ${candidate.nome || fromName || 'Não identificado'}\n`;
    if (candidate.telefone) message += `📱 *Telefone:* ${candidate.telefone}\n`;
    message += `📧 *Email:* ${candidate.email || fromEmail}\n`;
    if (candidate.cidade) message += `📍 *Cidade:* ${candidate.cidade}\n`;
    message += `\n`;
    if (candidate.formacao) message += `🎓 *Formação:* ${candidate.formacao}\n`;
    if (candidate.experiencia_anos) message += `⏱️ *Experiência:* ${candidate.experiencia_anos} anos\n`;
    if (candidate.ultimo_cargo) message += `💼 *Último cargo:* ${candidate.ultimo_cargo}\n`;
    if (candidate.ultima_empresa) message += `🏢 *Última empresa:* ${candidate.ultima_empresa}\n`;
    if (candidate.pretensao_salarial) message += `💰 *Pretensão:* ${candidate.pretensao_salarial}\n`;
    if (candidate.disponibilidade) message += `📅 *Disponibilidade:* ${candidate.disponibilidade}\n`;
    if (candidate.habilidades && candidate.habilidades.length > 0) {
      message += `\n🛠️ *Habilidades:* ${candidate.habilidades.slice(0, 5).join(', ')}\n`;
    }
    message += `\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n📊 *ANÁLISE DE RH*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (analysis.resumo) message += `📝 *Resumo:*\n${analysis.resumo}\n\n`;
    if (analysis.pontos_fortes?.length) {
      message += `✅ *Pontos Fortes:*\n`;
      analysis.pontos_fortes.slice(0, 4).forEach((p: string) => { message += `  • ${p}\n`; });
      message += `\n`;
    }
    if (analysis.areas_desenvolvimento?.length) {
      message += `📈 *Áreas de Desenvolvimento:*\n`;
      analysis.areas_desenvolvimento.slice(0, 3).forEach((a: string) => { message += `  • ${a}\n`; });
      message += `\n`;
    }
    if (analysis.adequacao_areas?.length) {
      message += `🎯 *Adequado para:* ${analysis.adequacao_areas.join(', ')}\n`;
    }
    if (analysis.recomendacao) {
      const recomEmoji = analysis.recomendacao === 'Recomendado' ? '👍'
        : analysis.recomendacao === 'Não Recomendado' ? '👎' : '🤔';
      message += `\n${recomEmoji} *Recomendação:* ${analysis.recomendacao}`;
      if (analysis.nota_geral) message += ` (${analysis.nota_geral}/10)`;
      message += `\n`;
    }
    message += `\n━━━━━━━━━━━━━━━━━━━━━\n📬 *Recebido:* ${formattedDate}\n📌 *Assunto:* ${subject || 'Sem assunto'}`;

    // Send to each recipient via Evolution shim
    let successCount = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        const { data: sendData, error: sendError } = await supabase.functions.invoke('zapi-send-message', {
          body: { agentKey: 'exa_alert', phone: recipient.recipient_phone, message, skipSplit: true },
        });
        if (sendError || (sendData && (sendData as any).error)) {
          errors.push(`${recipient.recipient_phone}: ${sendError?.message || (sendData as any).error}`);
        } else {
          successCount++;
          await supabase
            .from('email_processing_log')
            .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
            .eq('message_id', messageId);
        }
      } catch (e: any) {
        console.error(`Error sending to ${recipient.recipient_phone}:`, e);
        errors.push(`${recipient.recipient_phone}: ${e.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        sent: successCount,
        total: recipients.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-curriculum-received:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
