import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { query, filters } = await req.json();

    console.log('[GET-BUILDINGS] Query:', query);
    console.log('[GET-BUILDINGS] Filters:', filters);

    let dbQuery = supabase
      .from('buildings')
      .select(`
        id,
        nome,
        endereco,
        bairro,
        numero_andares,
        numero_unidades,
        numero_elevadores,
        publico_estimado,
        visualizacoes_mes,
        preco_base,
        image_urls,
        caracteristicas,
        amenities,
        padrao_publico
      `)
      .eq('status', 'ativo')
      .order('nome');

    // Aplicar filtros se existirem
    if (filters?.bairro) {
      dbQuery = dbQuery.eq('bairro', filters.bairro);
    }

    if (filters?.min_price) {
      dbQuery = dbQuery.gte('preco_base', filters.min_price);
    }

    if (filters?.max_price) {
      dbQuery = dbQuery.lte('preco_base', filters.max_price);
    }

    // Buscar por nome se query fornecida
    if (query) {
      dbQuery = dbQuery.ilike('nome', `%${query}%`);
    }

    const { data: buildings, error } = await dbQuery;

    if (error) {
      console.error('[GET-BUILDINGS] Error:', error);
      throw error;
    }

    console.log('[GET-BUILDINGS] Found', buildings?.length || 0, 'buildings');

    // Formatar resposta para ser mais legível pela IA
    const formattedBuildings = buildings?.map(b => ({
      id: b.id,
      nome: b.nome,
      endereco: b.endereco,
      bairro: b.bairro,
      detalhes: {
        andares: b.numero_andares,
        unidades: b.numero_unidades,
        elevadores: b.numero_elevadores,
        publico_estimado: b.publico_estimado,
        visualizacoes_mes: b.visualizacoes_mes,
      },
      preco: {
        base: b.preco_base,
        formatado: `R$ ${b.preco_base?.toFixed(2).replace('.', ',') || '0,00'}`
      },
      perfil: b.padrao_publico,
      caracteristicas: b.caracteristicas || [],
      amenities: b.amenities || []
    })) || [];

    return new Response(JSON.stringify({ 
      buildings: formattedBuildings,
      total: formattedBuildings.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GET-BUILDINGS] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
