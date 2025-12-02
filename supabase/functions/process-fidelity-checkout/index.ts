import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FidelityCheckoutRequest {
  cartItems: any[];
  selectedPlan: number;
  totalPrice: number;
  couponId?: string;
  paymentMethod: 'pix_fidelidade' | 'boleto_fidelidade';
  diaVencimento: 5 | 10 | 15;
  dadosEmpresa: {
    cnpj: string;
    razao_social: string;
    endereco: {
      cep: string;
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
    };
    representante_legal?: string;
  };
  aceiteTermoFidelidade: boolean;
  ipAddress?: string;
  userAgent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    const body: FidelityCheckoutRequest = await req.json();
    console.log('[FIDELITY-CHECKOUT] Iniciando para user:', user.id);
    console.log('[FIDELITY-CHECKOUT] Dados:', JSON.stringify(body, null, 2));

    // Validações
    if (!body.aceiteTermoFidelidade) {
      throw new Error('É necessário aceitar o termo de fidelidade');
    }

    if (!body.dadosEmpresa?.cnpj) {
      throw new Error('CNPJ é obrigatório para planos de fidelidade');
    }

    if (![5, 10, 15].includes(body.diaVencimento)) {
      throw new Error('Dia de vencimento inválido');
    }

    // Calcular valor mensal
    const valorMensal = body.totalPrice / body.selectedPlan;
    
    // Criar pedido
    const listaPaineis = body.cartItems.map(item => ({
      painel_id: item.panel?.id,
      building_id: item.panel?.buildings?.id,
      building_name: item.panel?.buildings?.nome
    }));

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + body.selectedPlan);

    // Calcular próximo vencimento
    const hoje = new Date();
    let proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), body.diaVencimento);
    if (proximoVencimento <= hoje) {
      proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_id: user.id,
        lista_paineis: listaPaineis,
        valor: body.totalPrice,
        status: 'aguardando_pagamento',
        tipo_pagamento: body.paymentMethod,
        is_fidelidade: true,
        dia_vencimento: body.diaVencimento,
        parcela_atual: 1,
        total_parcelas: body.selectedPlan,
        status_adimplencia: 'em_dia',
        dias_atraso: 0,
        contrato_status: 'pendente_envio',
        proxima_cobranca: proximoVencimento.toISOString().split('T')[0],
        duracao_meses: body.selectedPlan,
        data_inicio: startDate.toISOString(),
        data_fim: endDate.toISOString(),
        coupon_id: body.couponId || null
      })
      .select()
      .single();

    if (pedidoError || !pedido) {
      console.error('[FIDELITY-CHECKOUT] Erro ao criar pedido:', pedidoError);
      throw new Error('Erro ao criar pedido');
    }

    console.log('[FIDELITY-CHECKOUT] Pedido criado:', pedido.id);

    // Criar parcelas
    const parcelas = [];
    for (let i = 0; i < body.selectedPlan; i++) {
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
        metodo_pagamento: body.paymentMethod === 'boleto_fidelidade' ? 'boleto' : 'pix'
      });
    }

    const { error: parcelasError } = await supabase
      .from('parcelas')
      .insert(parcelas);

    if (parcelasError) {
      console.error('[FIDELITY-CHECKOUT] Erro ao criar parcelas:', parcelasError);
    }

    console.log('[FIDELITY-CHECKOUT] Parcelas criadas:', parcelas.length);

    // Registrar aceite do termo
    const { error: termoError } = await supabase
      .from('termos_fidelidade_aceites')
      .insert({
        client_id: user.id,
        pedido_id: pedido.id,
        versao_termo: 'v1.0',
        ip_address: body.ipAddress,
        user_agent: body.userAgent,
        dados_empresa: body.dadosEmpresa
      });

    if (termoError) {
      console.error('[FIDELITY-CHECKOUT] Erro ao registrar aceite:', termoError);
    }

    // Buscar primeira parcela para gerar pagamento
    const { data: primeiraParcela } = await supabase
      .from('parcelas')
      .select('*')
      .eq('pedido_id', pedido.id)
      .eq('numero_parcela', 1)
      .single();

    console.log('[FIDELITY-CHECKOUT] Checkout concluído com sucesso');

    return new Response(JSON.stringify({
      success: true,
      pedido_id: pedido.id,
      primeira_parcela: primeiraParcela,
      total_parcelas: body.selectedPlan,
      valor_mensal: valorMensal,
      proximo_vencimento: proximoVencimento.toISOString().split('T')[0]
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
