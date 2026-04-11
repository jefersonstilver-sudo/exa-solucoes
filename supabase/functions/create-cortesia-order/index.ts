import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Rate limiting: 5 courtesy orders per hour per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 5,
    windowMs: 3600000, // 1 hour
    blockDurationMs: 3600000 // 1 hour block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [CORTESIA] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body
    const { cartItems, selectedPlan, startDate, endDate, couponId } = await req.json()

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart items are required')
    }

    console.log('🎁 [CORTESIA] Creating courtesy order:', {
      userId: user.id,
      cartItemsCount: cartItems.length,
      selectedPlan
    })

    // ✅ CORREÇÃO: Extrair IDs dos painéis e prédios
    const panelIds = cartItems.map((item: any) => item.panel?.id).filter(Boolean)
    const buildingIds = cartItems.map((item: any) => item.panel?.buildings?.id).filter(Boolean)

    console.log('📋 [CORTESIA] Panel IDs extraídos:', panelIds)
    console.log('🏢 [CORTESIA] Building IDs extraídos:', buildingIds)

    if (panelIds.length === 0) {
      throw new Error('Nenhum painel válido encontrado no carrinho')
    }

    // Create order
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        client_id: user.id,
        valor_total: 0,
        status: 'ativo',
        plano_meses: selectedPlan,
        data_inicio: startDate,
        data_fim: endDate,
        cupom_id: couponId,
        metodo_pagamento: 'cortesia',
        lista_paineis: panelIds,
        lista_predios: buildingIds,
        log_pagamento: {
          tipo: 'CORTESIA',
          admin_id: user.id,
          timestamp: new Date().toISOString(),
          panel_ids: panelIds,
          building_ids: buildingIds
        }
      })
      .select()
      .single()

    if (pedidoError) {
      console.error('❌ Error creating courtesy order:', pedidoError)
      throw pedidoError
    }

    console.log('✅ [CORTESIA] Order created:', pedido.id)

    // Create contracts for each panel
    const contratos = cartItems.map((item: any) => ({
      pedido_id: pedido.id,
      painel_id: item.panel.id,
      user_id: user.id,
      predio_id: item.panel.buildings?.id,
      data_inicio: startDate,
      data_fim: endDate,
      status: 'ativo',
      plano_meses: selectedPlan,
      valor_mensal: 0,
      valor_total: 0
    }))

    const { error: contratosError } = await supabase
      .from('contratos')
      .insert(contratos)

    if (contratosError) {
      console.error('❌ Error creating contracts:', contratosError)
      throw contratosError
    }

    console.log('✅ [CORTESIA] Contracts created:', contratos.length)

    // Log system event
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'PEDIDO_CORTESIA_CRIADO',
      user_id: user.id,
      metadata: {
        pedido_id: pedido.id,
        admin_id: user.id,
        cartItemsCount: cartItems.length,
        selectedPlan
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        pedidoId: pedido.id,
        message: 'Pedido cortesia criado com sucesso!'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ [CORTESIA] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})