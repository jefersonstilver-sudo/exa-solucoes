/**
 * Edge Function: notify-upcoming-pix
 * 
 * Cron job para notificar clientes sobre parcelas PIX próximas do vencimento.
 * Envia WhatsApp e Email com o link para pagar.
 * 
 * Executado diariamente às 9h (BRT)
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { getPixQrCode, listPaymentsBySubscription } from '../_shared/asaas-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========================================
// CONFIGURAÇÃO
// ========================================

const DIAS_ANTES_VENCIMENTO = 3; // Notificar 3 dias antes
const MAX_NOTIFICACOES_POR_EXECUCAO = 50;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔔 [NOTIFY-PIX] Iniciando notificação de parcelas próximas...');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Calcular data limite (3 dias a partir de hoje)
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + DIAS_ANTES_VENCIMENTO);
    
    const hojeStr = hoje.toISOString().split('T')[0];
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];
    
    console.log(`📅 [NOTIFY-PIX] Buscando parcelas com vencimento entre ${hojeStr} e ${dataLimiteStr}`);
    
    // Buscar parcelas pendentes próximas do vencimento
    const { data: parcelas, error: parcelasError } = await supabase
      .from('parcelas')
      .select(`
        id,
        pedido_id,
        numero_parcela,
        valor,
        data_vencimento,
        status,
        pix_qr_code,
        pix_copia_cola,
        notificacao_enviada_em,
        pedidos!inner (
          id,
          client_id,
          asaas_subscription_id,
          plano_meses,
          users:client_id (
            id,
            nome,
            email,
            telefone
          )
        )
      `)
      .in('status', ['pendente', 'aguardando_pagamento'])
      .gte('data_vencimento', hojeStr)
      .lte('data_vencimento', dataLimiteStr)
      .is('notificacao_enviada_em', null)
      .limit(MAX_NOTIFICACOES_POR_EXECUCAO);
    
    if (parcelasError) {
      console.error('❌ [NOTIFY-PIX] Erro ao buscar parcelas:', parcelasError);
      throw parcelasError;
    }
    
    console.log(`✅ [NOTIFY-PIX] Encontradas ${parcelas?.length || 0} parcelas para notificar`);
    
    if (!parcelas || parcelas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma parcela para notificar',
          notified: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let notificacoesEnviadas = 0;
    let erros = 0;
    
    for (const parcela of parcelas) {
      try {
        const pedido = parcela.pedidos as any;
        const user = pedido?.users;
        
        if (!user) {
          console.warn(`⚠️ [NOTIFY-PIX] Parcela ${parcela.id} sem usuário vinculado`);
          continue;
        }
        
        console.log(`📧 [NOTIFY-PIX] Processando parcela ${parcela.numero_parcela} do pedido ${pedido.id}`);
        
        // Tentar obter QR Code atualizado se tiver subscription
        let pixData = {
          qrCode: parcela.pix_copia_cola,
          qrCodeBase64: parcela.pix_qr_code
        };
        
        // Se tiver subscription, buscar pagamento mais recente
        if (pedido.asaas_subscription_id) {
          try {
            const payments = await listPaymentsBySubscription(pedido.asaas_subscription_id);
            const pendingPayment = payments.find(p => p.status === 'PENDING');
            
            if (pendingPayment) {
              const qrCode = await getPixQrCode(pendingPayment.id);
              pixData = {
                qrCode: qrCode.payload,
                qrCodeBase64: qrCode.encodedImage
              };
              
              // Atualizar parcela com novo QR Code
              await supabase
                .from('parcelas')
                .update({
                  pix_copia_cola: qrCode.payload,
                  pix_qr_code: qrCode.encodedImage,
                  asaas_payment_id: pendingPayment.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', parcela.id);
            }
          } catch (qrError) {
            console.warn(`⚠️ [NOTIFY-PIX] Erro ao obter QR Code atualizado:`, qrError);
          }
        }
        
        // Calcular dias até vencimento
        const vencimento = new Date(parcela.data_vencimento);
        const diffTime = vencimento.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const diasTexto = diffDays === 0 ? 'HOJE' : 
                          diffDays === 1 ? 'amanhã' : 
                          `em ${diffDays} dias`;
        
        // Preparar mensagem
        const mensagem = `Olá ${user.nome?.split(' ')[0] || 'Cliente'}! 🎯

Sua parcela ${parcela.numero_parcela}/${pedido.plano_meses} da EXA Mídia vence ${diasTexto} (${new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}).

💰 Valor: R$ ${parcela.valor.toFixed(2)}

${pixData.qrCode ? `📱 Pix Copia e Cola:
${pixData.qrCode}` : ''}

Acesse sua área do cliente para ver o QR Code ou pagar: https://examidia.com.br/anunciante/pedidos

Dúvidas? Estamos à disposição! 🚀`;
        
        // Enviar WhatsApp se tiver telefone
        if (user.telefone) {
          try {
            const telefone = user.telefone.replace(/\D/g, '');
            if (telefone.length >= 10) {
              await supabase.functions.invoke('exa-messaging-proxy', {
                body: {
                  action: 'send_whatsapp',
                  phone: telefone,
                  message: mensagem,
                  agent: 'exa_alert'
                }
              });
              console.log(`✅ [NOTIFY-PIX] WhatsApp enviado para ${telefone}`);
            }
          } catch (whatsappError) {
            console.warn(`⚠️ [NOTIFY-PIX] Erro ao enviar WhatsApp:`, whatsappError);
          }
        }
        
        // Enviar Email se tiver
        if (user.email) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: user.email,
                subject: `EXA Mídia - Parcela ${parcela.numero_parcela} vence ${diasTexto}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #7D1818, #4a0f0f); padding: 20px; text-align: center;">
                      <h1 style="color: white; margin: 0;">EXA Mídia</h1>
                    </div>
                    <div style="padding: 30px; background: #f5f5f5;">
                      <h2 style="color: #333;">Olá ${user.nome?.split(' ')[0] || 'Cliente'}!</h2>
                      <p style="color: #666; font-size: 16px;">
                        Sua parcela <strong>${parcela.numero_parcela}/${pedido.plano_meses}</strong> vence <strong>${diasTexto}</strong>.
                      </p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #333;">
                          <strong>Valor:</strong> R$ ${parcela.valor.toFixed(2)}<br/>
                          <strong>Vencimento:</strong> ${new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      ${pixData.qrCode ? `
                        <div style="background: #fff; padding: 15px; border: 1px dashed #ccc; border-radius: 8px; margin: 20px 0;">
                          <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">📱 PIX Copia e Cola:</p>
                          <code style="word-break: break-all; font-size: 12px; color: #666;">${pixData.qrCode}</code>
                        </div>
                      ` : ''}
                      <a href="https://examidia.com.br/anunciante/pedidos" 
                         style="display: inline-block; background: #7D1818; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Acessar Minha Área
                      </a>
                    </div>
                    <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                      © ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.
                    </div>
                  </div>
                `
              }
            });
            console.log(`✅ [NOTIFY-PIX] Email enviado para ${user.email}`);
          } catch (emailError) {
            console.warn(`⚠️ [NOTIFY-PIX] Erro ao enviar Email:`, emailError);
          }
        }
        
        // Marcar parcela como notificada
        await supabase
          .from('parcelas')
          .update({
            notificacao_enviada_em: new Date().toISOString()
          })
          .eq('id', parcela.id);
        
        // Log da cobrança
        await supabase
          .from('cobranca_logs')
          .insert({
            pedido_id: pedido.id,
            parcela_id: parcela.id,
            client_id: user.id,
            tipo_notificacao: 'lembrete_vencimento',
            canal: user.telefone ? 'whatsapp_email' : 'email',
            destinatario: user.email || user.telefone,
            status: 'enviado',
            mensagem: `Parcela ${parcela.numero_parcela}/${pedido.plano_meses} - R$ ${parcela.valor.toFixed(2)} - Vence ${diasTexto}`
          });
        
        notificacoesEnviadas++;
        
      } catch (parcelaError) {
        console.error(`❌ [NOTIFY-PIX] Erro ao processar parcela ${parcela.id}:`, parcelaError);
        erros++;
      }
    }
    
    console.log(`🎉 [NOTIFY-PIX] Concluído. Notificações: ${notificacoesEnviadas}, Erros: ${erros}`);
    
    // Log do evento
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'notify_upcoming_pix_completed',
        descricao: `Notificação de parcelas concluída`,
        detalhes: {
          total_parcelas: parcelas.length,
          notificacoes_enviadas: notificacoesEnviadas,
          erros,
          data_limite: dataLimiteStr,
          timestamp: new Date().toISOString()
        }
      });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Notificações enviadas: ${notificacoesEnviadas}`,
        notified: notificacoesEnviadas,
        errors: erros,
        total: parcelas.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('❌ [NOTIFY-PIX] Erro fatal:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
