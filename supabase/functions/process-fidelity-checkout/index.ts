import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const body = await req.json();
    console.log('[FIDELITY-CHECKOUT] Iniciando para user:', user.id);
    console.log('[FIDELITY-CHECKOUT] Dados recebidos:', JSON.stringify(body, null, 2));

    // Extrair dados com suporte a ambos os formatos
    const cartItems = body.cartItems || [];
    const selectedPlan = body.selectedPlan || 1;
    const totalPrice = body.totalAmount || body.totalPrice || 0;
    const paymentMethod = body.paymentMethod || 'pix_fidelidade';
    const diaVencimento = body.diaVencimento || 10;
    const couponId = body.couponId || null;
    
    // Dados da empresa - suporte a ambos os formatos
    const userData = body.userData || body.dadosEmpresa || {};
    const cnpj = userData.cnpj || userData.documento || '';
    const nomeEmpresa = userData.nomeEmpresa || userData.razao_social || '';

    // Validações básicas
    if (cartItems.length === 0) {
      throw new Error('Carrinho vazio');
    }

    if (!cnpj) {
      throw new Error('CNPJ é obrigatório para planos de fidelidade');
    }

    if (![5, 10, 15].includes(diaVencimento)) {
      throw new Error('Dia de vencimento inválido');
    }

    // Calcular valor mensal
    const valorMensal = totalPrice / selectedPlan;
    
    console.log('[FIDELITY-CHECKOUT] Valores calculados:', {
      totalPrice,
      selectedPlan,
      valorMensal,
      diaVencimento,
      cnpj,
      nomeEmpresa
    });

    // Criar pedido
    const listaPaineis = cartItems.map((item: any) => ({
      painel_id: item.panel?.id,
      building_id: item.panel?.buildings?.id || item.panel?.id,
      building_name: item.panel?.buildings?.nome
    }));

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + selectedPlan);

    // Calcular próximo vencimento
    const hoje = new Date();
    let proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento);
    if (proximoVencimento <= hoje) {
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
    }

    console.log('[FIDELITY-CHECKOUT] Criando pedido...');

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_id: user.id,
        lista_paineis: listaPaineis,
        valor_total: totalPrice,
        status: 'pendente',
        tipo_pagamento: paymentMethod,
        is_fidelidade: true,
        dia_vencimento: diaVencimento,
        parcela_atual: 1,
        total_parcelas: selectedPlan,
        status_adimplencia: 'em_dia',
        dias_atraso: 0,
        contrato_status: 'pendente_envio',
        proxima_cobranca: proximoVencimento.toISOString().split('T')[0],
        plano_meses: selectedPlan,
        data_inicio: startDate.toISOString(),
        data_fim: endDate.toISOString(),
        cupom_id: couponId
      })
      .select()
      .single();

    if (pedidoError || !pedido) {
      console.error('[FIDELITY-CHECKOUT] Erro ao criar pedido:', pedidoError);
      throw new Error(`Erro ao criar pedido: ${pedidoError?.message || 'Erro desconhecido'}`);
    }

    console.log('[FIDELITY-CHECKOUT] Pedido criado:', pedido.id);

    // Criar parcelas
    const parcelas = [];
    for (let i = 0; i < selectedPlan; i++) {
      const dataVencimento = new Date(proximoVencimento);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);

      parcelas.push({
        pedido_id: pedido.id,
        numero_parcela: i + 1,
        valor_original: valorMensal,
        valor_desconto: 0,
        valor_multa: 0,
        valor_juros: 0,
        valor_final: valorMensal,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        status: i === 0 ? 'aguardando_pagamento' : 'pendente',
        metodo_pagamento: paymentMethod === 'boleto_fidelidade' ? 'boleto' : 'pix'
      });
    }

    const { error: parcelasError } = await supabase
      .from('parcelas')
      .insert(parcelas);

    if (parcelasError) {
      console.error('[FIDELITY-CHECKOUT] Erro ao criar parcelas:', parcelasError);
      // Não falha o processo por erro nas parcelas
    } else {
      console.log('[FIDELITY-CHECKOUT] Parcelas criadas:', parcelas.length);
    }

    // Registrar aceite do termo (opcional)
    try {
      await supabase
        .from('termos_fidelidade_aceites')
        .insert({
          client_id: user.id,
          pedido_id: pedido.id,
          versao_termo: 'v1.0',
          ip_address: body.ipAddress || req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: body.userAgent || req.headers.get('user-agent') || 'unknown',
          dados_empresa: {
            cnpj,
            razao_social: nomeEmpresa
          }
        });
      console.log('[FIDELITY-CHECKOUT] Termo de fidelidade registrado');
    } catch (termoError) {
      console.error('[FIDELITY-CHECKOUT] Erro ao registrar aceite (não crítico):', termoError);
    }

    // Buscar primeira parcela para gerar pagamento
    const { data: primeiraParcela } = await supabase
      .from('parcelas')
      .select('*')
      .eq('pedido_id', pedido.id)
      .eq('numero_parcela', 1)
      .single();

    // GERAR BOLETO DA PRIMEIRA PARCELA (se for boleto_fidelidade)
    let boletoData = null;
    if (paymentMethod === 'boleto_fidelidade' && primeiraParcela && MERCADOPAGO_ACCESS_TOKEN) {
      console.log('[FIDELITY-CHECKOUT] Gerando boleto da primeira parcela...');
      
      try {
        // Buscar dados do usuário
        const { data: userDataFromDb } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        const externalReference = `PARCELA_${primeiraParcela.id}_${Date.now()}`;
        
        const paymentData = {
          transaction_amount: valorMensal,
          description: `Parcela 1/${selectedPlan} - Plano Fidelidade EXA Painéis`,
          payment_method_id: 'bolbradesco',
          date_of_expiration: new Date(proximoVencimento.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 dias
          external_reference: externalReference,
          payer: {
            email: userDataFromDb?.email || user.email,
            first_name: nomeEmpresa?.split(' ')[0] || 'Cliente',
            last_name: nomeEmpresa?.split(' ').slice(1).join(' ') || 'EXA',
            identification: {
              type: 'CNPJ',
              number: cnpj.replace(/\D/g, '')
            },
            address: {
              zip_code: userDataFromDb?.cep || '01310100',
              street_name: userDataFromDb?.endereco || 'Av. Paulista',
              street_number: userDataFromDb?.numero || '1000',
              neighborhood: userDataFromDb?.bairro || 'Bela Vista',
              city: userDataFromDb?.cidade || 'São Paulo',
              federal_unit: userDataFromDb?.estado || 'SP'
            }
          }
        };

        console.log('[FIDELITY-CHECKOUT] Enviando para Mercado Pago:', JSON.stringify(paymentData, null, 2));

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': externalReference
          },
          body: JSON.stringify(paymentData)
        });

        const mpData = await mpResponse.json();
        console.log('[FIDELITY-CHECKOUT] Resposta MP:', JSON.stringify(mpData, null, 2));

        if (mpResponse.ok) {
          const boletoUrl = mpData.transaction_details?.external_resource_url;
          const boletoBarcode = mpData.barcode?.content;

          // Atualizar parcela com dados do boleto
          await supabase
            .from('parcelas')
            .update({
              mercadopago_payment_id: String(mpData.id),
              mercadopago_external_reference: externalReference,
              boleto_url: boletoUrl,
              boleto_barcode: boletoBarcode,
              updated_at: new Date().toISOString()
            })
            .eq('id', primeiraParcela.id);

          boletoData = {
            payment_id: mpData.id,
            boleto_url: boletoUrl,
            boleto_barcode: boletoBarcode,
            status: mpData.status
          };

          console.log('[FIDELITY-CHECKOUT] Boleto gerado com sucesso:', boletoData);
        } else {
          console.error('[FIDELITY-CHECKOUT] Erro ao gerar boleto:', mpData);
        }
      } catch (boletoError) {
        console.error('[FIDELITY-CHECKOUT] Erro ao gerar boleto (não crítico):', boletoError);
      }
    }

    console.log('[FIDELITY-CHECKOUT] Checkout concluído com sucesso');

    return new Response(JSON.stringify({
      success: true,
      pedidoId: pedido.id,
      pedido_id: pedido.id,
      primeiraParcela: primeiraParcela,
      primeira_parcela: primeiraParcela,
      totalParcelas: selectedPlan,
      total_parcelas: selectedPlan,
      valorMensal: valorMensal,
      valor_mensal: valorMensal,
      proximoVencimento: proximoVencimento.toISOString().split('T')[0],
      proximo_vencimento: proximoVencimento.toISOString().split('T')[0],
      // Dados do boleto (se gerado)
      boletoUrl: boletoData?.boleto_url || null,
      boletoBarcode: boletoData?.boleto_barcode || null,
      boletoStatus: boletoData?.status || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[FIDELITY-CHECKOUT] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
