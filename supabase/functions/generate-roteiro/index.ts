// Edge Function: generate-roteiro
// Proxy transparente para a Anthropic Messages API.
// O frontend (GeradorRoteiros.tsx) já monta o body completo:
//   { model, max_tokens, messages: [{ role: 'user', content: prompt }] }
// Esta função apenas adiciona a API key e repassa para a Anthropic,
// retornando a resposta completa para que o frontend leia data?.content?.[0]?.text.

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

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Body JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const responseText = await anthropicResponse.text();

    return new Response(responseText, {
      status: anthropicResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[generate-roteiro] erro:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
