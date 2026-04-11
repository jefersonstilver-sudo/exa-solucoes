import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BehaviorData {
  user_id: string;
  total_time_spent: number;
  pages_visited: Record<string, number>;
  buildings_viewed: Array<{
    building_id: string;
    time_spent: number;
    views_count: number;
  }>;
  videos_watched: Array<{
    video_id: string;
    watch_duration: number;
    completed: boolean;
  }>;
  cart_abandonments: number;
  checkout_starts: number;
  total_orders: number;
  total_spent: number;
  total_attempts: number;
  abandoned_value: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🧠 Starting AI analysis for user:', user_id);

    // Buscar dados comportamentais
    const { data: behaviorData, error: behaviorError } = await supabase
      .from('client_behavior_analytics')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (behaviorError && behaviorError.code !== 'PGRST116') {
      console.error('❌ Error fetching behavior data:', behaviorError);
      throw behaviorError;
    }

    // Buscar dados de atividade na plataforma
    const { data: platformActivity, error: platformError } = await supabase
      .from('client_platform_activity')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (platformError && platformError.code !== 'PGRST116') {
      console.error('⚠️ No platform activity data for user:', user_id);
    }

    // Buscar dados de pedidos
    const { data: ordersData, error: ordersError } = await supabase
      .from('pedidos')
      .select('id, status, valor_total, created_at, lista_predios, plano_meses, data_inicio, data_fim')
      .eq('client_id', user_id)
      .in('status', ['pago', 'ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado']);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      throw ordersError;
    }

    // Buscar tentativas de compra
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('tentativas_compra')
      .select('id, valor_total, created_at, predios_selecionados')
      .eq('id_user', user_id);

    if (attemptsError) {
      console.error('❌ Error fetching attempts:', attemptsError);
      throw attemptsError;
    }

    // Calcular métricas agregadas
    const totalOrders = ordersData?.length || 0;
    const totalSpent = ordersData?.reduce((sum, order) => sum + (order.valor_total || 0), 0) || 0;
    const totalAttempts = attemptsData?.length || 0;
    const abandonedValue = attemptsData?.reduce((sum, attempt) => sum + (attempt.valor_total || 0), 0) || 0;

    // Preparar dados para análise
    const analysisData: BehaviorData = {
      user_id,
      total_time_spent: behaviorData?.total_time_spent || 0,
      pages_visited: behaviorData?.pages_visited || {},
      buildings_viewed: behaviorData?.buildings_viewed || [],
      videos_watched: behaviorData?.videos_watched || [],
      cart_abandonments: behaviorData?.cart_abandonments || 0,
      checkout_starts: behaviorData?.checkout_starts || 0,
      total_orders: totalOrders,
      total_spent: totalSpent,
      total_attempts: totalAttempts,
      abandoned_value: abandonedValue,
    };

    console.log('📊 Analysis data prepared:', {
      total_time_spent: analysisData.total_time_spent,
      buildings_viewed_count: analysisData.buildings_viewed.length,
      videos_watched_count: analysisData.videos_watched.length,
      total_orders: analysisData.total_orders,
    });

    // Determinar se cliente tem plano ativo
    const hasActivePlan = ordersData && ordersData.length > 0;
    const activeOrders = ordersData?.filter(o => 
      o.data_fim && new Date(o.data_fim) >= new Date()
    ) || [];
    
    const nearestRenewal = activeOrders.length > 0 
      ? activeOrders.sort((a, b) => new Date(a.data_fim).getTime() - new Date(b.data_fim).getTime())[0]
      : null;

    const daysUntilRenewal = nearestRenewal
      ? Math.floor((new Date(nearestRenewal.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    // Criar prompt para IA com CONTEXTO DE CICLO DE VIDA
    const prompt = `
Você é um analista de CRM especializado em publicidade digital e comportamento de clientes B2B.

Analise o comportamento do cliente abaixo e forneça insights acionáveis para a equipe de vendas.

⚠️ CONTEXTO CRÍTICO DO CICLO DE VIDA:
- Lifecycle Stage: ${behaviorData?.lifecycle_stage || 'prospect'}
- TEM PLANO ATIVO: ${hasActivePlan ? 'SIM' : 'NÃO'}
${hasActivePlan ? `
  - Número de planos ativos: ${activeOrders.length}
  - Plano mais antigo termina em: ${nearestRenewal?.data_fim}
  - Dias até renovação: ${daysUntilRenewal} dias
  - Duração do plano: ${nearestRenewal?.plano_meses} meses
  - ⚠️ IMPORTANTE: Cliente JÁ É PAGANTE! Não tem baixo interesse por não comprar de novo.
` : ''}

📊 ATIVIDADE NA PLATAFORMA:
${platformActivity ? `
- Total de logins: ${platformActivity.total_logins || 0}
- Último login: ${platformActivity.last_login ? new Date(platformActivity.last_login).toLocaleDateString('pt-BR') : 'Nunca'}
- Frequência de acesso: ${(platformActivity.login_frequency || 0).toFixed(1)} logins/semana
- Total de vídeos enviados: ${platformActivity.total_videos_uploaded || 0}
- Total de trocas de vídeos: ${platformActivity.total_videos_swapped || 0}
- Vídeos aguardando aprovação: ${platformActivity.videos_pending_approval || 0}
- Vídeos aprovados: ${platformActivity.videos_approved || 0}
- Último vídeo enviado: ${platformActivity.last_video_upload ? new Date(platformActivity.last_video_upload).toLocaleDateString('pt-BR') : 'Nunca'}
- Visualizações de pedidos ativos: ${platformActivity.active_orders_views || 0}
- Engagement Score: ${platformActivity.platform_engagement_score || 0}/100
` : '- Sem dados de atividade na plataforma ainda'}

📈 DADOS DE NAVEGAÇÃO:
- Tempo total no site: ${Math.floor(analysisData.total_time_spent / 60)} minutos
- Páginas visitadas: ${JSON.stringify(analysisData.pages_visited, null, 2)}
- Prédios visualizados: ${analysisData.buildings_viewed.length} (tempo total: ${analysisData.buildings_viewed.reduce((sum, b) => sum + b.time_spent, 0)} segundos)
- Top 3 prédios mais vistos: ${JSON.stringify(
  analysisData.buildings_viewed
    .sort((a, b) => b.time_spent - a.time_spent)
    .slice(0, 3)
    .map(b => ({ building_id: b.building_id, time_spent: b.time_spent, views: b.views_count }))
)}
- Vídeos assistidos: ${analysisData.videos_watched.length} (${analysisData.videos_watched.filter(v => v.completed).length} completos)
- Taxa de conclusão de vídeos: ${analysisData.videos_watched.length > 0 ? Math.round((analysisData.videos_watched.filter(v => v.completed).length / analysisData.videos_watched.length) * 100) : 0}%

💰 DADOS COMERCIAIS:
- Carrinhos abandonados: ${analysisData.cart_abandonments}
- Checkouts iniciados: ${analysisData.checkout_starts}
- Pedidos completados: ${analysisData.total_orders}
- Valor total gasto: R$ ${analysisData.total_spent.toFixed(2)}
- Tentativas de compra: ${analysisData.total_attempts}
- Valor abandonado: R$ ${analysisData.abandoned_value.toFixed(2)}

FORNEÇA A ANÁLISE NO SEGUINTE FORMATO JSON (responda APENAS com JSON válido, sem texto adicional):

{
  "interest_score": <número de 0 a 100>,
  "interest_level": "<low|medium|high|very_high>",
  "behavior_summary": "<resumo do comportamento em 150-200 palavras, focando em padrões identificados, interesses principais e sinais de intenção de compra>",
  "main_interests": [
    "<interesse principal 1>",
    "<interesse principal 2>",
    "<interesse principal 3>"
  ],
  "conversion_probability": "<low|medium|high|very_high>",
  "conversion_probability_percent": <número de 0 a 100>,
  "recommended_actions": [
    {
      "action": "<ação recomendada 1>",
      "priority": "<high|medium|low>",
      "reasoning": "<por que esta ação é recomendada>"
    },
    {
      "action": "<ação recomendada 2>",
      "priority": "<high|medium|low>",
      "reasoning": "<por que esta ação é recomendada>"
    },
    {
      "action": "<ação recomendada 3>",
      "priority": "<high|medium|low>",
      "reasoning": "<por que esta ação é recomendada>"
    }
  ],
  "next_best_action": "<melhor próxima ação para aumentar conversão>",
  "churn_risk": "<low|medium|high>",
  "insights": [
    "<insight importante 1>",
    "<insight importante 2>",
    "<insight importante 3>"
  ]
}

🎯 INSTRUÇÕES CRÍTICAS DE ANÁLISE:

1. **CLIENTES COM PLANO ATIVO E USO FREQUENTE:**
   - Se tem plano ativo + logins recentes (< 7 dias) + envia/troca vídeos:
   - ✅ NÃO dar baixo score de intenção! Cliente JÁ É PAGANTE e ATIVO
   - ✅ Score deve ser ALTO (80-100)
   - ✅ Foco em UPSELL e RENOVAÇÃO, não em "converter"

2. **CLIENTES COM PLANO ATIVO MAS SEM USO:**
   - Se tem plano ativo MAS último login > 30 dias:
   - ⚠️ RISCO DE CHURN ALTO
   - ⚠️ Ações urgentes de reengajamento
   - ⚠️ Ligar para entender problemas

3. **CLIENTES PRÓXIMOS DE RENOVAR:**
   - Se dias_até_renovação < 30:
   - 🔔 PRIORIDADE MÁXIMA para contato
   - 🔔 Oferecer incentivo de renovação antecipada
   - 🔔 Verificar satisfação

4. **VALORIZE ENGAGEMENT NA PLATAFORMA:**
   - Logins frequentes = cliente engajado
   - Trocas de vídeos = cliente ativo e satisfeito
   - Vídeos aprovados = cliente produtivo
   - Use esses dados no score!

5. **DIFERENCIE CLARAMENTE:**
   - Cliente que NÃO COMPRA porque JÁ TEM PLANO (✅ BOM!)
   - Cliente que NÃO COMPRA porque ABANDONOU (❌ RUIM!)

CRITÉRIOS PARA AVALIAÇÃO:
- Interest Score: Para clientes ATIVOS, considere uso da plataforma > navegação
- Conversion Probability: Se JÁ É CLIENTE, foque em renovação/upsell
- Recommended Actions: Ações ESPECÍFICAS baseadas no lifecycle stage
- Main Interests: Identifique padrões e preferências
- Churn Risk: CRÍTICO para clientes com plano mas sem uso
`;

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🤖 Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content in AI response');
    }

    console.log('✅ AI response received');

    // Parse JSON da resposta da IA
    let analysis;
    try {
      // Remover possível markdown code block
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      console.log('Raw AI response:', aiContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Atualizar dados comportamentais com análise da IA
    const { error: updateError } = await supabase
      .from('client_behavior_analytics')
      .update({
        purchase_intent_score: analysis.interest_score || 0,
        ai_interest_level: analysis.interest_level || 'low',
        ai_behavior_summary: analysis.behavior_summary || '',
        ai_recommended_actions: analysis.recommended_actions || [],
        last_ai_analysis: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('❌ Error updating analytics:', updateError);
      throw updateError;
    }

    console.log('✅ AI analysis completed and saved');

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          ...analysis,
          analyzed_at: new Date().toISOString(),
          user_id,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in analyze-user-behavior:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
