import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar CNPJ (remover pontuação)
    const cleanCnpj = cnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CONSULTAR-CNPJ] Consultando CNPJ: ${cleanCnpj}`);

    // Consultar API CNPJá (pública, sem auth, limite 5 req/min)
    const response = await fetch(`https://open.cnpja.com/office/${cleanCnpj}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`[CONSULTAR-CNPJ] Erro na API: ${response.status}`);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'CNPJ não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de consultas excedido. Aguarde 1 minuto.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar CNPJ' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`[CONSULTAR-CNPJ] Dados recebidos:`, JSON.stringify(data).slice(0, 500));

    // Formatar endereço completo
    const endereco = data.address 
      ? [
          data.address.street,
          data.address.number,
          data.address.details,
          data.address.district,
          data.address.city,
          data.address.state
        ].filter(Boolean).join(', ')
      : '';

    // Formatar telefone
    const telefone = data.phones?.[0] 
      ? `(${data.phones[0].area}) ${data.phones[0].number}`
      : '';

    // Retornar dados formatados
    const resultado = {
      razaoSocial: data.company?.name || '',
      nomeFantasia: data.alias || '',
      endereco: endereco,
      bairro: data.address?.district || '',
      cidade: data.address?.city || '',
      estado: data.address?.state || '',
      cep: data.address?.zip || '',
      telefone: telefone,
      email: data.emails?.[0]?.address || '',
      segmento: data.mainActivity?.text || '',
      situacao: data.status?.text || '',
      naturezaJuridica: data.company?.nature?.text || '',
      capitalSocial: data.company?.equity || 0,
      dataAbertura: data.founded || '',
    };

    console.log(`[CONSULTAR-CNPJ] Retornando:`, resultado);

    return new Response(
      JSON.stringify(resultado),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CONSULTAR-CNPJ] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
