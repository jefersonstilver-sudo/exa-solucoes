// Edge Function: generate-roteiro
// Proxy para a Anthropic Messages API.
// IMPORTANTE: sempre retorna HTTP 200 para que o supabase-js
// não trate a resposta como erro — erros da Anthropic ficam
// dentro do JSON retornado em { error: { message } }.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    console.error('[generate-roteiro] ANTHROPIC_API_KEY ausente');
    return new Response(
      JSON.stringify({ error: { message: 'Secret ANTHROPIC_API_KEY não configurado no Supabase. Vá em Project Settings > Edge Functions > Secrets e adicione a chave.' } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    console.error('[generate-roteiro] body inválido');
    return new Response(
      JSON.stringify({ error: { message: 'Body inválido — envie JSON.' } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // Garante um modelo válido
  const safeModel = (body.model as string) || 'claude-3-5-haiku-20241022';
  const payload = { ...body, model: safeModel };

  console.log('[generate-roteiro] >>> chamando Anthropic | model:', safeModel, '| max_tokens:', body.max_tokens);

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      console.error('[generate-roteiro] <<< Anthropic ERRO', anthropicRes.status, JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ error: { message: `Anthropic ${anthropicRes.status}: ${data?.error?.message || JSON.stringify(data)}` } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[generate-roteiro] <<< Anthropic OK', anthropicRes.status);
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[generate-roteiro] EXCEPTION:', err);
    return new Response(
      JSON.stringify({ error: { message: err instanceof Error ? err.message : 'Erro interno na Edge Function.' } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
