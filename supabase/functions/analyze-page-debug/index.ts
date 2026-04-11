import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      pagePath,
      pageUrl,
      components,
      hooks,
      services,
      pageState,
      consoleLogs,
      networkCalls,
      performanceMetrics,
      userAgent,
      screenResolution,
      browserInfo
    } = await req.json();

    console.log(`[AI Debug] Analyzing page: ${pagePath} for user: ${user.email}`);

    const startTime = Date.now();

    // Preparar prompt para IA
    const systemPrompt = `Você é um especialista em análise de código React/TypeScript e debugging de aplicações web.
Sua missão é analisar profundamente o código e estado da página fornecidos e identificar TODOS os problemas, bugs, erros e oportunidades de melhoria.

IMPORTANTE: Seja EXTREMAMENTE detalhado e técnico. Não omita nenhum problema, por menor que seja.`;

    const userPrompt = `Analise esta página e retorne um JSON estruturado:

**PÁGINA**: ${pagePath}
**URL**: ${pageUrl}

**COMPONENTES DETECTADOS**:
${JSON.stringify(components, null, 2)}

**HOOKS UTILIZADOS**:
${JSON.stringify(hooks, null, 2)}

**SERVICES/APIS**:
${JSON.stringify(services, null, 2)}

**ESTADO DA PÁGINA**:
${JSON.stringify(pageState, null, 2)}

**ÚLTIMOS 50 LOGS DO CONSOLE**:
${JSON.stringify(consoleLogs, null, 2)}

**ÚLTIMAS 20 REQUISIÇÕES DE REDE**:
${JSON.stringify(networkCalls, null, 2)}

**MÉTRICAS DE PERFORMANCE**:
${JSON.stringify(performanceMetrics, null, 2)}

Retorne um JSON com a seguinte estrutura EXATA:
{
  "summary": {
    "totalIssues": number,
    "criticalCount": number,
    "highCount": number,
    "mediumCount": number,
    "lowCount": number
  },
  "detectedComponents": [
    {
      "name": "string",
      "path": "string",
      "type": "component|hook|service",
      "dependencies": ["string"]
    }
  ],
  "detectedHooks": [
    {
      "name": "string",
      "usage": "string",
      "potentialIssues": ["string"]
    }
  ],
  "detectedApis": [
    {
      "endpoint": "string",
      "method": "string",
      "status": "success|error|pending"
    }
  ],
  "errors": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "severity": "critical|high|medium|low",
      "category": "state|hook|api|performance|memory|security|accessibility",
      "affectedFiles": ["string"],
      "errorDetails": "string",
      "suggestedFix": "string",
      "codeExample": "string",
      "sqlQuickFix": "string (optional)"
    }
  ],
  "suggestions": [
    {
      "title": "string",
      "description": "string",
      "priority": "high|medium|low",
      "implementation": "string"
    }
  ],
  "performanceIssues": [
    {
      "issue": "string",
      "impact": "string",
      "recommendation": "string"
    }
  ],
  "securityConcerns": [
    {
      "concern": "string",
      "risk": "string",
      "mitigation": "string"
    }
  ]
}

**CATEGORIAS DE ERROS A VERIFICAR**:
1. **Estado não inicializado** - variáveis undefined ou null
2. **Missing error handling** - try-catch ausentes, .catch() faltando
3. **Memory leaks** - useEffect sem cleanup, event listeners não removidos
4. **Missing useEffect dependencies** - dependências faltando no array
5. **API errors** - requisições falhando, status codes de erro
6. **Performance** - re-renders desnecessários, operações pesadas
7. **Security** - XSS, injection, dados sensíveis expostos
8. **Accessibility** - falta de aria-labels, contraste, navegação por teclado
9. **Console errors** - erros e warnings no console
10. **Network failures** - requisições falhando ou lentas

Seja EXTREMAMENTE crítico e detalhado. Encontre TUDO.`;

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[AI Debug] Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 8000  // Gemini 2.5 não suporta 'temperature' e usa 'max_completion_tokens'
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      const errorText = await aiResponse.text();
      console.error('[AI Debug] AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiAnalysisText = aiData.choices?.[0]?.message?.content || '{}';
    const finishReason = aiData.choices?.[0]?.finish_reason;
    
    console.log('[AI Debug] Raw AI response length:', aiAnalysisText.length);
    console.log('[AI Debug] Finish reason:', finishReason);
    console.log('[AI Debug] Response preview:', aiAnalysisText.substring(0, 200) + '...');

    // Avisar se a resposta foi truncada
    if (finishReason === 'length') {
      console.warn('[AI Debug] ⚠️ Resposta truncada - limite de tokens atingido');
    }

    // Parse AI response
    let aiAnalysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = aiAnalysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      aiAnalysis = JSON.parse(cleanedText);
      console.log('[AI Debug] ✅ JSON parseado com sucesso');
    } catch (parseError) {
      console.error('[AI Debug] ❌ Falha ao parsear resposta da IA:', parseError);
      console.error('[AI Debug] Texto que falhou:', aiAnalysisText.substring(0, 500));
      
      // Tentar recuperar JSON parcial
      let partialJson = aiAnalysisText;
      
      // Se termina com string não fechada, tentar fechar
      if (aiAnalysisText.includes('{') && !aiAnalysisText.trim().endsWith('}')) {
        console.log('[AI Debug] Tentando recuperar JSON parcial...');
        // Encontrar última vírgula ou campo completo
        const lastComma = aiAnalysisText.lastIndexOf(',');
        const lastBrace = aiAnalysisText.lastIndexOf('}');
        const cutPoint = Math.max(lastComma, lastBrace);
        
        if (cutPoint > 0) {
          partialJson = aiAnalysisText.substring(0, cutPoint + 1) + '\n}';
          try {
            aiAnalysis = JSON.parse(partialJson);
            console.log('[AI Debug] ✅ JSON parcial recuperado com sucesso');
          } catch {
            // Fallback completo
            aiAnalysis = null;
          }
        }
      }
      
      // Fallback structure se tudo falhar
      if (!aiAnalysis) {
        console.error('[AI Debug] ❌ Impossível recuperar JSON - usando fallback');
        aiAnalysis = {
          summary: { totalIssues: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
          detectedComponents: [],
          detectedHooks: [],
          detectedApis: [],
          errors: [{
            id: 'parse_error',
            title: 'Erro ao analisar resposta da IA',
            description: 'A resposta da IA foi truncada ou está malformada. Clique em "Reanalizar" para tentar novamente.',
            severity: 'high',
            category: 'api',
            affectedFiles: [],
            errorDetails: `Finish reason: ${finishReason}, Parse error: ${parseError.message}`,
            suggestedFix: 'Clique no botão "Reanalizar" para executar uma nova análise completa.'
          }],
          suggestions: [],
          performanceIssues: [],
          securityConcerns: [],
          rawResponse: aiAnalysisText.substring(0, 1000),
          truncated: finishReason === 'length'
        };
      }
    }

    const duration = Date.now() - startTime;
    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Salvar análise no banco
    const { data: savedAnalysis, error: saveError } = await supabaseAdmin
      .from('ai_debug_analysis_history')
      .insert({
        user_id: user.id,
        page_path: pagePath,
        page_url: pageUrl,
        ai_analysis: aiAnalysis,
        ai_model: 'google/gemini-2.5-flash',
        tokens_used: tokensUsed,
        analysis_duration_ms: duration,
        analyzed_components: components,
        analyzed_hooks: hooks,
        analyzed_services: services,
        detected_errors: aiAnalysis.errors || [],
        error_severity: aiAnalysis.errors?.[0]?.severity || 'low',
        error_count: aiAnalysis.summary?.totalIssues || 0,
        suggestions: aiAnalysis.suggestions || [],
        quick_fixes: aiAnalysis.errors
          ?.filter((e: any) => e.sqlQuickFix)
          .map((e: any) => ({
            title: e.title,
            sql: e.sqlQuickFix,
            description: e.description
          })) || [],
        page_state_snapshot: pageState,
        console_logs: consoleLogs,
        network_calls: networkCalls,
        performance_metrics: performanceMetrics,
        user_agent: userAgent,
        screen_resolution: screenResolution,
        browser_info: browserInfo,
        status: 'completed'
      })
      .select()
      .single();

    if (saveError) {
      console.error('[AI Debug] Error saving analysis:', saveError);
      throw saveError;
    }

    console.log(`[AI Debug] Analysis completed in ${duration}ms, used ${tokensUsed} tokens`);

    // Log na tabela de auditoria
    await supabaseAdmin
      .from('user_activity_logs')
      .insert({
        user_id: user.id,
        action_type: 'debug_ai_analysis',
        entity_type: 'page',
        entity_id: savedAnalysis.id,
        metadata: {
          page_path: pagePath,
          errors_found: aiAnalysis.summary?.totalIssues || 0,
          severity: aiAnalysis.errors?.[0]?.severity || 'none',
          tokens_used: tokensUsed,
          duration_ms: duration
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: aiAnalysis,
        analysisId: savedAnalysis.id,
        tokensUsed,
        durationMs: duration
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[AI Debug] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
