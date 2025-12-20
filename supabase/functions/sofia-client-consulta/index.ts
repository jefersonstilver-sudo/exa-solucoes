import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`\n[SOFIA-CLIENT-CONSULTA] ${requestId} - Request received`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { tipo, user_id, user_email } = body;

    console.log(`[${requestId}] Query type: ${tipo}, User: ${user_email || user_id}`);

    if (!user_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuário não identificado. Faça login para continuar.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    let result: any = {};

    switch (tipo) {
      case 'pedidos': {
        // Fetch user's orders with building and video info
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select(`
            id,
            created_at,
            data_inicio,
            data_fim,
            status,
            valor_total,
            plano_meses,
            lista_paineis,
            painels:painels(
              id,
              predio:buildings(nome, bairro, endereco)
            ),
            pedido_videos(
              id,
              is_active,
              video:videos(id, nome, status, thumbnail_url)
            )
          `)
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error(`[${requestId}] Error fetching pedidos:`, error);
          throw error;
        }

        const pedidosFormatados = (pedidos || []).map((p: any) => {
          const statusLabels: Record<string, string> = {
            'pendente': 'Aguardando pagamento',
            'ativo': 'Ativo - Exibindo',
            'em_analise': 'Em análise',
            'cancelado': 'Cancelado',
            'expirado': 'Expirado',
          };

          return {
            id: p.id,
            status: statusLabels[p.status] || p.status,
            valor: `R$ ${(p.valor_total || 0).toFixed(2)}`,
            periodo: `${p.data_inicio} até ${p.data_fim}`,
            duracao_meses: p.plano_meses,
            predio: p.painels?.predio?.nome || 'Prédio não identificado',
            bairro: p.painels?.predio?.bairro || '',
            videos: (p.pedido_videos || []).map((pv: any) => ({
              nome: pv.video?.nome || 'Vídeo',
              status: pv.video?.status || 'pendente',
              ativo: pv.is_active,
            })),
          };
        });

        result = {
          tipo: 'pedidos',
          total: pedidosFormatados.length,
          pedidos: pedidosFormatados,
          resumo: pedidosFormatados.length > 0 
            ? `Você tem ${pedidosFormatados.length} pedido(s). ${pedidosFormatados.filter(p => p.status.includes('Ativo')).length} ativo(s).`
            : 'Você ainda não tem pedidos.',
        };
        break;
      }

      case 'videos': {
        // Fetch user's videos
        const { data: videos, error } = await supabase
          .from('videos')
          .select(`
            id,
            nome,
            status,
            thumbnail_url,
            url,
            tipo,
            created_at,
            updated_at
          `)
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error(`[${requestId}] Error fetching videos:`, error);
          throw error;
        }

        const statusLabels: Record<string, string> = {
          'pendente': 'Aguardando aprovação',
          'aprovado': 'Aprovado',
          'reprovado': 'Reprovado - Necessita ajustes',
          'em_analise': 'Em análise',
        };

        const videosFormatados = (videos || []).map((v: any) => ({
          id: v.id,
          nome: v.nome || 'Sem nome',
          status: statusLabels[v.status] || v.status,
          tipo: v.tipo || 'horizontal',
          criado_em: v.created_at,
        }));

        const pendentes = videosFormatados.filter(v => v.status.includes('Aguardando'));
        const aprovados = videosFormatados.filter(v => v.status.includes('Aprovado'));

        result = {
          tipo: 'videos',
          total: videosFormatados.length,
          videos: videosFormatados,
          resumo: `Você tem ${videosFormatados.length} vídeo(s): ${aprovados.length} aprovado(s), ${pendentes.length} pendente(s).`,
        };
        break;
      }

      case 'faturas': {
        // Fetch user's parcelas (payment installments)
        const { data: parcelas, error } = await supabase
          .from('parcelas')
          .select(`
            id,
            numero_parcela,
            valor,
            data_vencimento,
            status,
            pedido:pedidos(id, status)
          `)
          .eq('user_id', user_id)
          .order('data_vencimento', { ascending: true })
          .limit(20);

        if (error) {
          console.error(`[${requestId}] Error fetching parcelas:`, error);
          throw error;
        }

        const statusLabels: Record<string, string> = {
          'pendente': 'Pendente',
          'pago': 'Pago',
          'atrasado': 'Atrasado',
          'cancelado': 'Cancelado',
        };

        const parcelasFormatadas = (parcelas || []).map((p: any) => ({
          id: p.id,
          parcela: p.numero_parcela,
          valor: `R$ ${(p.valor || 0).toFixed(2)}`,
          vencimento: p.data_vencimento,
          status: statusLabels[p.status] || p.status,
          pedido_id: p.pedido?.id,
        }));

        const pendentes = parcelasFormatadas.filter(p => 
          p.status === 'Pendente' || p.status === 'Atrasado'
        );

        const valorTotal = pendentes.reduce((sum, p) => {
          const valor = parseFloat(p.valor.replace('R$ ', '').replace(',', '.'));
          return sum + valor;
        }, 0);

        result = {
          tipo: 'faturas',
          total: parcelasFormatadas.length,
          parcelas: parcelasFormatadas,
          pendentes: pendentes.length,
          valor_pendente: `R$ ${valorTotal.toFixed(2)}`,
          resumo: pendentes.length > 0 
            ? `Você tem ${pendentes.length} parcela(s) pendente(s) totalizando R$ ${valorTotal.toFixed(2)}.`
            : 'Todas as suas parcelas estão em dia!',
        };
        break;
      }

      case 'perfil': {
        // Fetch user profile
        const { data: user, error } = await supabase
          .from('users')
          .select(`
            id,
            nome,
            email,
            cpf_cnpj,
            telefone,
            created_at
          `)
          .eq('id', user_id)
          .single();

        if (error) {
          console.error(`[${requestId}] Error fetching profile:`, error);
          throw error;
        }

        result = {
          tipo: 'perfil',
          nome: user?.nome || 'Não informado',
          email: user?.email || user_email,
          telefone: user?.telefone || 'Não informado',
          documento: user?.cpf_cnpj ? '***' + user.cpf_cnpj.slice(-4) : 'Não informado',
          cliente_desde: user?.created_at,
        };
        break;
      }

      default:
        result = {
          error: 'Tipo de consulta inválido. Use: pedidos, videos, faturas ou perfil',
        };
    }

    console.log(`[${requestId}] ✅ Query completed:`, tipo);

    return new Response(JSON.stringify({
      success: true,
      data: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao consultar dados',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
