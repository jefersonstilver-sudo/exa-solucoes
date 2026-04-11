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
    const { cliente_id } = await req.json()

    if (!cliente_id) {
      throw new Error('Missing required field: cliente_id')
    }

    console.log('[DELETE EDGE FUNCTION] Deletando cliente externo:', {
      url: `http://18.228.252.149:8000/clientes/${cliente_id}`,
      cliente_id
    })

    // Chamar API externa DELETE com timeout de 10 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(`http://18.228.252.149:8000/clientes/${cliente_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('[DELETE EDGE FUNCTION] Status da resposta:', response.status)

      // DELETE pode retornar 200, 204 (No Content), ou 404 (Not Found - já deletado)
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text()
        console.error('[DELETE EDGE FUNCTION] Erro na API externa:', errorText)
        throw new Error(`API externa falhou (${response.status}): ${errorText}`)
      }

      let result = null
      if (response.status !== 204) {
        try {
          result = await response.json()
        } catch {
          result = { message: 'Cliente deletado com sucesso' }
        }
      }

      console.log('[DELETE EDGE FUNCTION] Sucesso:', result || 'No content')

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
    console.error('[DELETE EDGE FUNCTION] Erro crítico:', error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro ao deletar cliente externo'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
