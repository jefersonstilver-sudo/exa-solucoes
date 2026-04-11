// ============================================
// ⚠️ FUNÇÃO DESCONTINUADA - USE unified-email-service
// ============================================
// Esta função agora delega para unified-email-service
// que usa os templates oficiais do sistema

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS para OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('⚠️ [SEND-CONFIRMATION] FUNÇÃO DESCONTINUADA - Delegando para unified-email-service')
    console.log('🔄 [SEND-CONFIRMATION] AGORA USA TEMPLATES OFICIAIS DE /admin/comunicacoes')
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    const { user, email_data } = requestBody

    if (!user?.email || !email_data?.token_hash) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 [SEND-CONFIRMATION] Delegando para unified-email-service...')
    
    // Delegar para unified-email-service que usa templates oficiais
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://aakenoljsycyrcrchgxj.supabase.co'
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada')
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    // Chamar unified-email-service que usa templates oficiais
    const { data, error } = await supabase.functions.invoke('unified-email-service', {
      body: {
        action: 'signup',
        user,
        email_data
      }
    })

    if (error) {
      console.error('❌ [SEND-CONFIRMATION] Erro ao delegar:', error)
      throw error
    }

    console.log('✅ [SEND-CONFIRMATION] Delegado com sucesso - Template oficial usado!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmação enviado com sucesso',
        delegated_to: 'unified-email-service'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('💥 [SEND-CONFIRMATION] Erro fatal:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        user_can_continue: true, // Não bloquear o fluxo de cadastro
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, // 200 para não quebrar Auth Hook
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})