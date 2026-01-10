import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPixCharge } from '../_shared/asaas-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: generate-pix-automatico-parcelas
 * 
 * Gera PIX automaticamente para parcelas de planos de fidelidade
 * que vencem nos próximos X dias e ainda não possuem PIX gerado.
 * 
 * Executado via CRON diariamente às 6h da manhã.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const logs: string[] = [];
  const log = (msg: string) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    logs.push(entry);
    console.log(entry);
  };

  try {
    log('🚀 Iniciando geração automática de PIX para parcelas');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se Asaas está configurado
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // Parâmetros opcionais do body
    let diasAntecedencia = 3; // Gerar PIX 3 dias antes do vencimento por padrão
    let forceRegenerate = false;

    try {
      const body = await req.json();
      if (body.dias_antecedencia) diasAntecedencia = body.dias_antecedencia;
      if (body.force_regenerate) forceRegenerate = body.force_regenerate;
    } catch {
      // Sem body, usa defaults
    }

    log(`📅 Buscando parcelas com vencimento nos próximos ${diasAntecedencia} dias`);

    // Calcular data limite
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + diasAntecedencia);

    // Buscar parcelas pendentes que:
    // 1. Estão com status 'pendente' ou 'aguardando_pagamento'
    // 2. Vencem dentro do período
    // 3. NÃO possuem PIX gerado (ou force_regenerate = true)
    // 4. Pertencem a pedidos com plano de fidelidade
    let query = supabase
      .from('parcelas')
      .select(`
        *,
        pedidos!inner(
          id,
          status,
          plano_tipo,
          client_id,
          users:client_id(
            id,
            nome,
            email,
            cpf,
            empresa_documento,
            telefone
          )
        )
      `)
      .in('status', ['pendente', 'aguardando_pagamento'])
      .gte('data_vencimento', hoje.toISOString().split('T')[0])
      .lte('data_vencimento', dataLimite.toISOString().split('T')[0])
      .in('pedidos.status', ['ativo', 'aguardando_pagamento', 'pago'])
      .order('data_vencimento', { ascending: true });

    // Se não for forçar, só buscar parcelas sem PIX
    if (!forceRegenerate) {
      query = query.is('pix_qr_code', null);
    }

    const { data: parcelas, error: parcelasError } = await query;

    if (parcelasError) {
      throw new Error(`Erro ao buscar parcelas: ${parcelasError.message}`);
    }

    log(`📊 Encontradas ${parcelas?.length || 0} parcelas para gerar PIX`);

    if (!parcelas || parcelas.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Nenhuma parcela pendente para gerar PIX',
        processed: 0,
        duration_ms: Date.now() - startTime,
        logs
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Processar cada parcela
    const results: Array<{
      parcela_id: string;
      numero_parcela: number;
      success: boolean;
      payment_id?: string;
      error?: string;
    }> = [];

    for (const parcela of parcelas) {
      try {
        log(`💳 Processando parcela ${parcela.numero_parcela} - ID: ${parcela.id}`);

        const user = parcela.pedidos?.users;
        if (!user) {
          log(`⚠️ Parcela ${parcela.id} sem dados do usuário - pulando`);
          results.push({
            parcela_id: parcela.id,
            numero_parcela: parcela.numero_parcela,
            success: false,
            error: 'Dados do usuário não encontrados'
          });
          continue;
        }

        // Preparar dados do cliente para Asaas
        const cpfCnpj = (user.cpf || user.empresa_documento)?.replace(/\D/g, '');
        
        const customerData = {
          name: user.nome || 'Cliente EXA',
          email: user.email || undefined,
          cpfCnpj: cpfCnpj || undefined,
          mobilePhone: user.telefone?.replace(/\D/g, '') || undefined,
        };

        // Descrição da cobrança
        const descricao = `Parcela ${parcela.numero_parcela}/${parcela.pedidos?.plano_tipo || ''} - EXA Painéis Digitais`;

        // Gerar PIX via Asaas
        const pixResult = await createPixCharge(
          customerData,
          parcela.valor,
          descricao,
          parcela.id // external_reference = parcela_id
        );

        log(`✅ PIX gerado para parcela ${parcela.id}: ${pixResult.paymentId}`);

        // Atualizar parcela com dados do PIX
        const { error: updateError } = await supabase
          .from('parcelas')
          .update({
            asaas_payment_id: pixResult.paymentId,
            pix_qr_code: pixResult.qrCodeBase64,
            pix_copia_cola: pixResult.pixCopiaECola,
            status: 'aguardando_pagamento',
            metodo_pagamento: 'pix',
            updated_at: new Date().toISOString()
          })
          .eq('id', parcela.id);

        if (updateError) {
          log(`⚠️ Erro ao atualizar parcela ${parcela.id}: ${updateError.message}`);
        }

        // Registrar log de cobrança
        await supabase.from('cobranca_logs').insert({
          tipo_notificacao: 'pix_gerado_automatico',
          canal: 'sistema',
          status: 'enviado',
          parcela_id: parcela.id,
          pedido_id: parcela.pedido_id,
          client_id: user.id,
          mensagem: `PIX automático gerado para parcela ${parcela.numero_parcela}`,
          metadata: {
            asaas_payment_id: pixResult.paymentId,
            valor: parcela.valor,
            vencimento: parcela.data_vencimento,
            generated_at: new Date().toISOString()
          }
        });

        results.push({
          parcela_id: parcela.id,
          numero_parcela: parcela.numero_parcela,
          success: true,
          payment_id: pixResult.paymentId
        });

      } catch (parcelaError: any) {
        log(`❌ Erro ao processar parcela ${parcela.id}: ${parcelaError.message}`);
        
        results.push({
          parcela_id: parcela.id,
          numero_parcela: parcela.numero_parcela,
          success: false,
          error: parcelaError.message
        });

        // Registrar erro
        await supabase.from('cobranca_logs').insert({
          tipo_notificacao: 'pix_gerado_automatico',
          canal: 'sistema',
          status: 'erro',
          parcela_id: parcela.id,
          pedido_id: parcela.pedido_id,
          erro: parcelaError.message,
          metadata: {
            attempted_at: new Date().toISOString()
          }
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    log(`🏁 Processamento concluído: ${successCount} sucesso, ${errorCount} erros`);

    return new Response(JSON.stringify({
      success: true,
      message: `PIX automático processado: ${successCount} gerados, ${errorCount} erros`,
      processed: results.length,
      success_count: successCount,
      error_count: errorCount,
      results,
      duration_ms: Date.now() - startTime,
      logs
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    log(`❌ Erro fatal: ${error.message}`);
    console.error('[GENERATE-PIX-AUTOMATICO] Erro:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime,
      logs
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
