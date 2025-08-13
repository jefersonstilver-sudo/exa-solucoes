import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SindicoLead {
  nomeCompleto: string
  nomePredio: string
  endereco: string
  numeroAndares: number
  numeroUnidades: number
  email: string
  celular: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { nomeCompleto, nomePredio, endereco, numeroAndares, numeroUnidades, email, celular }: SindicoLead = body

    // Input validation
    if (!nomeCompleto || !nomePredio || !endereco || !numeroAndares || !numeroUnidades || !email || !celular) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10,11}$/
    const cleanPhone = celular.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'Celular inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting: Check for recent submissions from same IP/email
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count: emailCount } = await supabaseClient
      .from('sindicos_interessados')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', oneHourAgo)

    if (emailCount && emailCount >= 3) {
      console.log(`Rate limit exceeded for email: ${email}`)
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize and insert data
    const { data, error } = await supabaseClient
      .from('sindicos_interessados')
      .insert({
        nome_completo: nomeCompleto.trim(),
        nome_predio: nomePredio.trim(),
        endereco: endereco.trim(),
        numero_andares: parseInt(String(numeroAndares)),
        numero_unidades: parseInt(String(numeroUnidades)),
        email: email.toLowerCase().trim(),
        celular: cleanPhone,
        status: 'novo'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`New sindico lead submitted: ${email} from IP: ${clientIP}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Formulário enviado com sucesso! Nossa equipe entrará em contato em breve.',
        id: data[0]?.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro inesperado. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})