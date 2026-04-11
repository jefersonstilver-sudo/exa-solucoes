import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('[EDGE FUNCTION] Body recebido:', JSON.stringify(body))
    
    const cliente_id = body?.cliente_id
    const cliente_name = body?.cliente_name

    if (!cliente_id || !cliente_name) {
      console.error('[EDGE FUNCTION] Campos faltando:', { cliente_id, cliente_name })
      throw new Error('Missing required fields: cliente_id or cliente_name')
    }

    const payload = {
      cliente_id,
      cliente_name
    }

    console.log('[EDGE FUNCTION] Enviando para API externa:', {
      url: 'http://18.228.252.149:8000/criar-cliente',
      payload
    })

    // Chamar API externa com timeout de 10 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch('http://18.228.252.149:8000/criar-cliente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('[EDGE FUNCTION] Status da resposta:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[EDGE FUNCTION] Erro na API externa:', errorText)
        throw new Error(`API externa falhou (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log('[EDGE FUNCTION] Sucesso:', result)

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Timeout: API externa não respondeu em 10 segundos')
      }
      
      throw fetchError
    }

  } catch (error: any) {
    console.error('[EDGE FUNCTION] Erro crítico:', error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao criar cliente externo'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
