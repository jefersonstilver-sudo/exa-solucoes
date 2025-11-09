import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateOrderRequest {
  order_id: string;
  cpf: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, message: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Importar e validar entrada
    const { validateOrderRequest } = await import('./validation.ts');
    const { order_id, cpf }: ValidateOrderRequest = validateOrderRequest(body);

    console.log('Validating order:', { order_id, cpf_provided: !!cpf });

    // Validar entrada
    if (!order_id || !cpf) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'ID do pedido e CPF são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Limpar CPF (remover pontos e traços)
    const cleanCpf = cpf.replace(/[.-]/g, '');

    // Buscar pedido com informações do cliente - ONLY for authenticated user's orders
    const { data: order, error: orderError } = await supabaseClient
      .from('pedidos')
      .select(`
        id,
        created_at,
        status,
        valor_total,
        plano_meses,
        data_inicio,
        data_fim,
        client_id,
        clientes!inner (
          nome,
          email,
          cpf
        )
      `)
      .eq('id', order_id)
      .eq('client_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Pedido não encontrado' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar CPF
    const clientCpf = order.clientes.cpf?.replace(/[.-]/g, '');
    
    if (clientCpf !== cleanCpf) {
      console.log('CPF mismatch');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'CPF inválido' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar painéis do pedido
    const { data: panels } = await supabaseClient
      .from('pedido_paineis')
      .select(`
        predios (
          nome,
          endereco,
          bairro
        )
      `)
      .eq('pedido_id', order_id);

    // Retornar dados do pedido validado
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pedido validado com sucesso',
        order: {
          id: order.id,
          created_at: order.created_at,
          status: order.status,
          valor_total: order.valor_total,
          plano_meses: order.plano_meses,
          data_inicio: order.data_inicio,
          data_fim: order.data_fim,
          client_name: order.clientes.nome,
          client_email: order.clientes.email,
          panels: panels?.map(p => p.predios) || []
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error validating order:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erro ao validar pedido',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});