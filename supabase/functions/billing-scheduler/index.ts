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

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    console.log('[BILLING-SCHEDULER] Iniciando processamento:', hojeStr);

    const results = {
      lembretes_enviados: 0,
      atrasos_atualizados: 0,
      suspensoes: 0,
      erros: []
    };

    // 1. BUSCAR PARCELAS PENDENTES OU ATRASADAS
    const { data: parcelas, error: parcelasError } = await supabase
      .from('parcelas')
      .select(`
        *,
        pedidos!inner(
          id,
          client_id,
          status_adimplencia,
          dias_atraso,
          is_fidelidade
        )
      `)
      .in('status', ['pendente', 'aguardando_pagamento', 'atrasado'])
      .eq('pedidos.is_fidelidade', true);

    if (parcelasError) {
      console.error('[BILLING-SCHEDULER] Erro ao buscar parcelas:', parcelasError);
      throw parcelasError;
    }

    console.log('[BILLING-SCHEDULER] Parcelas encontradas:', parcelas?.length || 0);

    for (const parcela of (parcelas || [])) {
      try {
        const dataVencimento = new Date(parcela.data_vencimento);
        const diffDias = Math.floor((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        // Buscar dados do cliente
        const { data: cliente } = await supabase
          .from('users')
          .select('email, whatsapp')
          .eq('id', parcela.pedidos.client_id)
          .single();

        // LEMBRETES ANTES DO VENCIMENTO
        if (diffDias === 15 || diffDias === 7 || diffDias === 3 || diffDias === 1) {
          const tipoNotificacao = `lembrete_${Math.abs(diffDias)}_dia${Math.abs(diffDias) > 1 ? 's' : ''}`;
          
          // Verificar se já enviou hoje
          const { data: jaEnviou } = await supabase
            .from('cobranca_logs')
            .select('id')
            .eq('parcela_id', parcela.id)
            .eq('tipo_notificacao', tipoNotificacao)
            .gte('created_at', hojeStr)
            .limit(1);

          if (!jaEnviou || jaEnviou.length === 0) {
            // Enviar notificação via EXA Alert
            await supabase.functions.invoke('send-billing-notification', {
              body: {
                parcela_id: parcela.id,
                pedido_id: parcela.pedido_id,
                client_id: parcela.pedidos.client_id,
                tipo: tipoNotificacao,
                dias_restantes: diffDias,
                valor: parcela.valor_final,
                data_vencimento: parcela.data_vencimento,
                cliente_email: cliente?.email,
                cliente_whatsapp: cliente?.whatsapp
              }
            });

            results.lembretes_enviados++;
          }
        }

        // VENCIMENTO HOJE
        if (diffDias === 0) {
          const { data: jaEnviou } = await supabase
            .from('cobranca_logs')
            .select('id')
            .eq('parcela_id', parcela.id)
            .eq('tipo_notificacao', 'vencimento_hoje')
            .gte('created_at', hojeStr)
            .limit(1);

          if (!jaEnviou || jaEnviou.length === 0) {
            await supabase.functions.invoke('send-billing-notification', {
              body: {
                parcela_id: parcela.id,
                pedido_id: parcela.pedido_id,
                client_id: parcela.pedidos.client_id,
                tipo: 'vencimento_hoje',
                valor: parcela.valor_final,
                data_vencimento: parcela.data_vencimento,
                cliente_email: cliente?.email,
                cliente_whatsapp: cliente?.whatsapp
              }
            });

            results.lembretes_enviados++;
          }
        }

        // ATRASO (após vencimento)
        if (diffDias < 0) {
          const diasAtraso = Math.abs(diffDias);

          // Atualizar status da parcela
          await supabase
            .from('parcelas')
            .update({ status: 'atrasado' })
            .eq('id', parcela.id);

          // Calcular multa e juros
          const { data: multaJuros } = await supabase
            .rpc('calcular_multa_juros', {
              p_valor_original: parcela.valor_original,
              p_data_vencimento: parcela.data_vencimento
            });

          if (multaJuros && multaJuros[0]) {
            await supabase
              .from('parcelas')
              .update({
                valor_multa: multaJuros[0].valor_multa,
                valor_juros: multaJuros[0].valor_juros,
                valor_final: multaJuros[0].valor_total
              })
              .eq('id', parcela.id);
          }

          // Atualizar pedido
          const novoStatus = diasAtraso >= 10 ? 'suspenso' : 'atrasado';
          await supabase
            .from('pedidos')
            .update({
              status_adimplencia: novoStatus,
              dias_atraso: diasAtraso,
              data_suspensao: diasAtraso >= 10 ? new Date().toISOString() : null
            })
            .eq('id', parcela.pedido_id);

          results.atrasos_atualizados++;

          // Enviar notificações de atraso em dias específicos
          const diasNotificacao = [1, 3, 5, 7, 10];
          if (diasNotificacao.includes(diasAtraso)) {
            const tipoAtraso = diasAtraso === 10 ? 'suspensao' : `atraso_${diasAtraso}_dia${diasAtraso > 1 ? 's' : ''}`;
            
            const { data: jaEnviou } = await supabase
              .from('cobranca_logs')
              .select('id')
              .eq('parcela_id', parcela.id)
              .eq('tipo_notificacao', tipoAtraso)
              .limit(1);

            if (!jaEnviou || jaEnviou.length === 0) {
              await supabase.functions.invoke('send-billing-notification', {
                body: {
                  parcela_id: parcela.id,
                  pedido_id: parcela.pedido_id,
                  client_id: parcela.pedidos.client_id,
                  tipo: tipoAtraso,
                  dias_atraso: diasAtraso,
                  valor: multaJuros?.[0]?.valor_total || parcela.valor_final,
                  valor_multa: multaJuros?.[0]?.valor_multa || 0,
                  valor_juros: multaJuros?.[0]?.valor_juros || 0,
                  data_vencimento: parcela.data_vencimento,
                  cliente_email: cliente?.email,
                  cliente_whatsapp: cliente?.whatsapp
                }
              });

              if (diasAtraso >= 10) {
                results.suspensoes++;
              }
            }
          }
        }

      } catch (parcelaError: any) {
        console.error('[BILLING-SCHEDULER] Erro ao processar parcela:', parcela.id, parcelaError);
        results.erros.push({ parcela_id: parcela.id, erro: parcelaError.message });
      }
    }

    console.log('[BILLING-SCHEDULER] Processamento concluído:', results);

    return new Response(JSON.stringify({
      success: true,
      data: hojeStr,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[BILLING-SCHEDULER] Erro geral:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
