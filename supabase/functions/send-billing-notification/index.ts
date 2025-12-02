import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  parcela_id: string;
  pedido_id: string;
  client_id: string;
  tipo: string;
  dias_restantes?: number;
  dias_atraso?: number;
  valor: number;
  valor_multa?: number;
  valor_juros?: number;
  data_vencimento: string;
  cliente_email?: string;
  cliente_whatsapp?: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR');
};

const getMessageTemplate = (tipo: string, data: NotificationRequest): { whatsapp: string; email_subject: string; email_body: string } => {
  const valor = formatCurrency(data.valor);
  const vencimento = formatDate(data.data_vencimento);
  
  switch (tipo) {
    case 'lembrete_15_dias':
      return {
        whatsapp: `📢 *Lembrete EXA Painéis*\n\nOlá! Sua parcela de ${valor} vence em *15 dias* (${vencimento}).\n\nPague em dia e evite multas!`,
        email_subject: 'Lembrete: Sua parcela vence em 15 dias',
        email_body: `Sua parcela de ${valor} vence em 15 dias (${vencimento}). Pague em dia e evite multas.`
      };
    
    case 'lembrete_7_dias':
      return {
        whatsapp: `📢 *Lembrete EXA Painéis*\n\nOlá! Sua parcela de ${valor} vence em *7 dias* (${vencimento}).\n\nNão deixe para última hora!`,
        email_subject: 'Lembrete: Sua parcela vence em 7 dias',
        email_body: `Sua parcela de ${valor} vence em 7 dias (${vencimento}). Não deixe para última hora!`
      };
    
    case 'lembrete_3_dias':
      return {
        whatsapp: `⚠️ *Atenção EXA Painéis*\n\nSua parcela de ${valor} vence em *3 dias* (${vencimento}).\n\nGaranta seu pagamento em dia!`,
        email_subject: 'Atenção: Sua parcela vence em 3 dias',
        email_body: `Sua parcela de ${valor} vence em 3 dias (${vencimento}). Garanta seu pagamento em dia!`
      };
    
    case 'lembrete_1_dia':
      return {
        whatsapp: `🔔 *Urgente EXA Painéis*\n\nSua parcela de ${valor} vence *AMANHÃ* (${vencimento})!\n\nEvite multas e juros, pague hoje!`,
        email_subject: 'Urgente: Sua parcela vence amanhã!',
        email_body: `Sua parcela de ${valor} vence AMANHÃ (${vencimento})! Evite multas e juros, pague hoje!`
      };
    
    case 'vencimento_hoje':
      return {
        whatsapp: `🚨 *VENCIMENTO HOJE - EXA Painéis*\n\nSua parcela de ${valor} vence *HOJE*!\n\nPague agora para evitar multa de 2% + juros de 1% ao mês.`,
        email_subject: '🚨 Sua parcela vence HOJE!',
        email_body: `Sua parcela de ${valor} vence HOJE! Pague agora para evitar multa de 2% + juros de 1% ao mês.`
      };
    
    case 'atraso_1_dia':
    case 'atraso_3_dias':
    case 'atraso_5_dias':
    case 'atraso_7_dias':
      const diasAtraso = data.dias_atraso || 1;
      const multa = data.valor_multa ? formatCurrency(data.valor_multa) : '2%';
      const juros = data.valor_juros ? formatCurrency(data.valor_juros) : '';
      return {
        whatsapp: `⚠️ *PARCELA EM ATRASO - EXA Painéis*\n\nSua parcela está *${diasAtraso} dia(s) em atraso*.\n\n💰 Valor atualizado: ${valor}\n📌 Multa: ${multa}${juros ? `\n📌 Juros: ${juros}` : ''}\n\n⚠️ Após 10 dias, seu plano será *SUSPENSO*.\n\nRegularize agora!`,
        email_subject: `⚠️ Parcela em atraso há ${diasAtraso} dia(s)`,
        email_body: `Sua parcela está ${diasAtraso} dia(s) em atraso. Valor atualizado: ${valor}. Após 10 dias de atraso, seu plano será SUSPENSO.`
      };
    
    case 'atraso_10_dias':
    case 'suspensao':
      return {
        whatsapp: `🔴 *PLANO SUSPENSO - EXA Painéis*\n\nSeu plano foi *SUSPENSO* por inadimplência.\n\n💰 Valor da dívida: ${valor}\n\nAcesse sua área do anunciante para regularizar e reativar seu plano imediatamente.`,
        email_subject: '🔴 Seu plano foi SUSPENSO por inadimplência',
        email_body: `Seu plano foi SUSPENSO por inadimplência. Valor da dívida: ${valor}. Acesse sua área do anunciante para regularizar e reativar seu plano imediatamente.`
      };
    
    case 'pagamento_confirmado':
      return {
        whatsapp: `✅ *Pagamento Confirmado - EXA Painéis*\n\nRecebemos seu pagamento de ${valor}!\n\nObrigado por manter seu plano em dia. 🙏`,
        email_subject: '✅ Pagamento confirmado!',
        email_body: `Recebemos seu pagamento de ${valor}! Obrigado por manter seu plano em dia.`
      };
    
    case 'reativacao':
      return {
        whatsapp: `🟢 *Plano Reativado - EXA Painéis*\n\nSeu plano foi *REATIVADO* com sucesso!\n\nObrigado por regularizar sua situação. Continue aproveitando todos os benefícios!`,
        email_subject: '🟢 Seu plano foi reativado!',
        email_body: `Seu plano foi REATIVADO com sucesso! Obrigado por regularizar sua situação.`
      };
    
    default:
      return {
        whatsapp: `📢 *EXA Painéis*\n\nNotificação sobre sua parcela de ${valor} com vencimento em ${vencimento}.`,
        email_subject: 'Notificação EXA Painéis',
        email_body: `Notificação sobre sua parcela de ${valor} com vencimento em ${vencimento}.`
      };
  }
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

    const body: NotificationRequest = await req.json();
    console.log('[SEND-BILLING-NOTIFICATION] Recebido:', JSON.stringify(body, null, 2));

    const template = getMessageTemplate(body.tipo, body);
    const results = { whatsapp: false, email: false };

    // 1. Enviar via WhatsApp (EXA Alert)
    if (body.cliente_whatsapp) {
      try {
        const { error: whatsappError } = await supabase.functions.invoke('notify-exa-alert', {
          body: {
            type: 'billing_notification',
            lead: {
              contact_number: body.cliente_whatsapp,
              contact_name: body.cliente_email?.split('@')[0] || 'Cliente'
            },
            data: {
              message: template.whatsapp,
              notification_type: body.tipo
            }
          }
        });

        if (!whatsappError) {
          results.whatsapp = true;
          console.log('[SEND-BILLING-NOTIFICATION] WhatsApp enviado com sucesso');
        }
      } catch (whatsappErr) {
        console.error('[SEND-BILLING-NOTIFICATION] Erro WhatsApp:', whatsappErr);
      }
    }

    // 2. Enviar via Email (se tiver Resend configurado)
    if (body.cliente_email) {
      try {
        const { error: emailError } = await supabase.functions.invoke('unified-email-service', {
          body: {
            type: 'billing',
            to: body.cliente_email,
            subject: template.email_subject,
            body: template.email_body,
            template_data: {
              valor: formatCurrency(body.valor),
              vencimento: formatDate(body.data_vencimento),
              tipo: body.tipo
            }
          }
        });

        if (!emailError) {
          results.email = true;
          console.log('[SEND-BILLING-NOTIFICATION] Email enviado com sucesso');
        }
      } catch (emailErr) {
        console.error('[SEND-BILLING-NOTIFICATION] Erro Email:', emailErr);
      }
    }

    // 3. Registrar log de cobrança
    const { error: logError } = await supabase
      .from('cobranca_logs')
      .insert({
        parcela_id: body.parcela_id,
        pedido_id: body.pedido_id,
        client_id: body.client_id,
        tipo_notificacao: body.tipo,
        canal: results.whatsapp ? 'whatsapp' : (results.email ? 'email' : 'whatsapp'),
        destinatario: body.cliente_whatsapp || body.cliente_email,
        mensagem: template.whatsapp,
        status: (results.whatsapp || results.email) ? 'enviado' : 'erro',
        metadata: {
          whatsapp_sent: results.whatsapp,
          email_sent: results.email,
          valor: body.valor,
          data_vencimento: body.data_vencimento
        }
      });

    if (logError) {
      console.error('[SEND-BILLING-NOTIFICATION] Erro ao registrar log:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SEND-BILLING-NOTIFICATION] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
