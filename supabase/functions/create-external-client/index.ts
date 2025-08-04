import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, userName } = await req.json()

    if (!userId || !userName) {
      throw new Error('Missing required fields: userId or userName')
    }

    // Extract cliente_id from UUID (first 4 characters)
    const clienteId = userId.substring(0, 4)

    const payload = {
      cliente_id: clienteId,
      cliente_name: userName
    }

    console.log('Sending to webhook:', {
      url: 'https://webhook.inoovaweb.com.br/webhook/criar_usuario_externo',
      payload
    })

    // Send to external webhook
    const response = await fetch('https://webhook.inoovaweb.com.br/webhook/criar_usuario_externo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Webhook response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', errorText)
      throw new Error(`Webhook request failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Webhook success response:', result)

    // Log success to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'WEBHOOK_INOOVAWEB_CLIENT_CREATION_SUCCESS',
      descricao: JSON.stringify({
        userId,
        clienteId,
        userName,
        webhookResponse: result,
        timestamp: new Date().toISOString()
      })
    })

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in create-external-client function:', error)

    // Log error to Supabase
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'WEBHOOK_INOOVAWEB_CLIENT_CREATION_ERROR',
        descricao: JSON.stringify({
          error: error.message,
          timestamp: new Date().toISOString()
        })
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})