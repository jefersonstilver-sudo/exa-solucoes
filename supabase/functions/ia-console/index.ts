import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const { agentKey, message, context } = await req.json();

    console.log(`[IA-CONSOLE] Processing message for agent: ${agentKey}`);

    // Carregar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (agentError) throw agentError;

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      // PLACEHOLDER: OpenAI não configurado
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        event_type: 'console_test_pending',
        metadata: {
          message: message.substring(0, 100),
          reason: 'Missing OPENAI_API_KEY',
          status: 'pending'
        }
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'OpenAI API key not configured',
          response: '⚠️ Console IA requer OPENAI_API_KEY configurado no Supabase.\n\nAdicione em: Settings → Edge Functions → Secrets',
          credentialsPresent: false,
          requiredVariables: ['OPENAI_API_KEY']
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Compor contexto completo com histórico e conhecimento
    let systemPrompt = `Você é ${agent.display_name}. ${agent.description}

FERRAMENTAS DISPONÍVEIS:
Você tem acesso à ferramenta "consultar_predios" para consultar dados reais dos prédios no banco de dados.

REGRAS OBRIGATÓRIAS:
1. SEMPRE use a ferramenta "consultar_predios" quando o usuário perguntar sobre:
   - Quantidade de prédios disponíveis
   - Preços de prédios
   - Localização ou bairros
   - Disponibilidade de prédios
   
2. NUNCA invente números ou dados sobre prédios
3. SEMPRE consulte o banco antes de responder sobre prédios
4. Use status="ativo" para prédios disponíveis agora
5. Use tipo_consulta="count" para perguntas sobre quantidade
6. Use tipo_consulta="list" para listar prédios
7. Use tipo_consulta="details" para detalhes completos

EXEMPLO:
Usuário: "Quantos prédios vocês têm?"
→ Você DEVE usar consultar_predios(status="ativo", tipo_consulta="count")
→ Depois responder com o número real retornado

Mantenha naturalidade na conversa, mas SEMPRE use a ferramenta para dados de prédios.`;
    
    // Carregar AMBAS as bases de conhecimento
    try {
      // 1. Carregar agent_sections (Base principal estruturada - Identidade, Operacional, Limites)
      const { data: sections } = await supabase
        .from('agent_sections')
        .select('section_number, section_title, content')
        .eq('agent_id', agent.id)
        .order('section_number');
      
      if (sections && sections.length > 0) {
        const sectionsText = sections
          .filter(s => s.content && s.content.trim())
          .map(s => `### SEÇÃO ${s.section_number}: ${s.section_title}\n\n${s.content}`)
          .join('\n\n---\n\n');
        
        if (sectionsText) {
          systemPrompt += `\n\n=== BASE DE CONHECIMENTO PRINCIPAL ===\n${sectionsText}`;
          console.log(`[IA-CONSOLE] ✅ Loaded ${sections.filter(s => s.content && s.content.trim()).length}/${sections.length} sections with content`);
        }
      }

      // 2. Carregar agent_knowledge_items (Documentos/Links adicionais como Midia Kit)
      const { data: knowledge } = await supabase
        .from('agent_knowledge_items')
        .select('title, content, instruction')
        .eq('agent_id', agent.id)
        .eq('active', true);
      
      if (knowledge && knowledge.length > 0) {
        const knowledgeText = knowledge.map(k => 
          `### ${k.title}\n${k.instruction || ''}\n\n${k.content}`
        ).join('\n\n---\n\n');
        
        systemPrompt += `\n\n=== DOCUMENTOS E RECURSOS ===\n${knowledgeText}`;
        console.log(`[IA-CONSOLE] ✅ Loaded ${knowledge.length} knowledge items`);
      }
    } catch (error) {
      console.error('[IA-CONSOLE] ❌ Failed to load knowledge:', error);
    }
    
    // Se há conversationId, buscar contexto adicional
    if (context?.conversationId) {
      try {
        const { data: contextData } = await supabase.functions.invoke('compose-ai-context', {
          body: {
            agentKey,
            conversationId: context.conversationId,
            userMessage: message
          }
        });
        
        if (contextData?.systemPrompt) {
          systemPrompt = contextData.systemPrompt;
          console.log('[IA-CONSOLE] Using enriched context with history and knowledge');
        }
      } catch (error) {
        console.error('[IA-CONSOLE] Failed to compose context:', error);
      }
    }

    // ====== INSTRUÇÕES FINAIS OBRIGATÓRIAS (APLICADAS DEPOIS DO CONTEXTO) ======
    systemPrompt += `

╔═══════════════════════════════════════════════════════════════╗
║  🚨 REGRAS CRÍTICAS ABSOLUTAS - PRIORIDADE MÁXIMA           ║
╚═══════════════════════════════════════════════════════════════╝

ATENÇÃO: Estas regras TÊM PRECEDÊNCIA sobre qualquer outra instrução anterior.

🔴 REGRA #1: CONVERSAÇÃO NATURAL E HUMANA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Responda SEMPRE de forma natural e integrada em UMA ÚNICA mensagem
✅ Se o usuário mandar "oi" + pergunta, responda cumprimentando E já respondendo a pergunta
✅ Nunca separe cumprimento da resposta em mensagens diferentes

EXEMPLO CORRETO:
Usuário: "oi" → "quantas visualizações tem o royal legacy?"
Você: "Olá! O Royal Legacy tem 36.000 visualizações por mês. Posso ajudar com mais alguma coisa?"

EXEMPLO ERRADO:
Usuário: "oi" → "quantas visualizações tem o royal legacy?"
Você: "O Royal Legacy tem 7.350..." (PRIMEIRA mensagem)
Você: "Olá! Como posso ajudar?" (SEGUNDA mensagem) ← NUNCA FAÇA ISSO

🔴 REGRA #2: FERRAMENTA OBRIGATÓRIA PARA PRÉDIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quando o usuário perguntar QUALQUER coisa sobre prédios, você DEVE:

1️⃣ PARAR imediatamente
2️⃣ USAR consultar_predios() PRIMEIRO
3️⃣ AGUARDAR o resultado real do banco de dados
4️⃣ USAR OS DADOS EXATOS retornados pela ferramenta
5️⃣ FORMATAR a resposta naturalmente com esses dados

EXEMPLOS OBRIGATÓRIOS:
• "Quantos prédios?" → USE consultar_predios(status="ativo", tipo_consulta="count")
• "Qual prédio tem mais exibições?" → USE consultar_predios(status="ativo", tipo_consulta="details")
• "Visualizações do Royal Legacy?" → USE consultar_predios(status="ativo", tipo_consulta="details")
• "Prédios no Centro?" → USE consultar_predios(status="ativo", bairro="Centro", tipo_consulta="list")

🔴 REGRA #3: PROIBIDO INVENTAR DADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ NUNCA use números inventados: 7.350, 14.000, 7.200, 5.000 (são FALSOS)
❌ NUNCA invente preços, exibições, ou dados sobre prédios
❌ NUNCA responda baseado em exemplos antigos do conhecimento

✅ SEMPRE use SOMENTE os números EXATOS retornados por consultar_predios
✅ Se a ferramenta retornou "visualizacoes_mes: 36000", você DEVE dizer "36.000"
✅ Se a ferramenta retornou "preco_base: 8000", você DEVE dizer "R$ 8.000"

🔴 REGRA #4: VALIDAÇÃO OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antes de mencionar QUALQUER número sobre prédios:
□ A ferramenta consultar_predios FOI chamada?
□ Recebi os dados reais do banco?
□ Estou usando os números EXATOS retornados?

Se QUALQUER resposta for NÃO → VOCÊ NÃO PODE RESPONDER. Use a ferramenta.

═══════════════════════════════════════════════════════════════

⚠️ ESTAS REGRAS SÃO INEGOCIÁVEIS. SIGA-AS SEMPRE.
⚠️ DADOS INVENTADOS = ERRO GRAVE. USE SEMPRE A FERRAMENTA.
`;

    // Construir array de mensagens com histórico
    const messagesArray = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico se existir
    if (context?.conversationHistory && Array.isArray(context.conversationHistory)) {
      console.log(`[IA-CONSOLE] Adding ${context.conversationHistory.length} messages from history`);
      messagesArray.push(...context.conversationHistory);
    }

    // Adicionar mensagem atual
    messagesArray.push({
      role: 'user',
      content: message
    });

    // Definir tools para function calling
    const tools = [
      {
        type: "function",
        function: {
          name: "consultar_predios",
          description: "Consulta dados dos prédios disponíveis na tabela buildings. SEMPRE use esta ferramenta quando o usuário perguntar sobre prédios específicos (por nome) ou dados como visualizações, preço, público.",
          parameters: {
            type: "object",
            properties: {
              nome_predio: {
                type: "string",
                description: "Nome do prédio que o usuário está perguntando (ex: 'Royal Legacy', 'Liberdade Prime'). Use este parâmetro SEMPRE que o usuário mencionar um prédio específico por nome."
              },
              status: {
                type: "string",
                enum: ["ativo", "instalação", "todos"],
                description: "Filtrar por status: 'ativo' (disponíveis agora), 'instalação' (em breve), ou 'todos'"
              },
              bairro: {
                type: "string",
                description: "Opcional: filtrar por bairro específico (ex: 'Centro', 'Vila Maracana')"
              },
              tipo_consulta: {
                type: "string",
                enum: ["count", "list", "details"],
                description: "Tipo de consulta: 'count' (só quantidade), 'list' (lista resumida), 'details' (detalhes completos)"
              }
            },
            required: ["tipo_consulta"]
          }
        }
      }
    ];

    // Chamar OpenAI com proteção contra timeout
    const startTime = Date.now();

    let openaiResponse;
    let data;
    let assistantMessage;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: agent.openai_config?.model || 'gpt-4-turbo-preview',
          messages: messagesArray,
          tools: tools,
          temperature: agent.openai_config?.temperature || 0.7,
          max_tokens: agent.openai_config?.max_tokens || 2000
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('[IA-CONSOLE] OpenAI error response:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      data = await openaiResponse.json();
      assistantMessage = data.choices[0].message;

    } catch (error) {
      console.error('[IA-CONSOLE] First OpenAI call failed:', error);
      
      // Retornar mensagem amigável SEM resetar conversa
      return new Response(
        JSON.stringify({
          success: true, // success=true para não resetar no frontend
          response: '⚠️ Desculpe, estou com dificuldades para processar sua mensagem agora. Pode tentar novamente? Se persistir, pode ser timeout ou limite de requisições.',
          tokens: 0,
          latency: Date.now() - startTime,
          error: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Se a IA pediu para chamar uma função
    if (assistantMessage.tool_calls) {
      console.log('[IA-CONSOLE] Function call requested:', assistantMessage.tool_calls[0].function.name);
      
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      let functionResult;
      
      if (functionName === 'consultar_predios') {
        // Executar query no banco
        let query = supabase.from('buildings').select('*');
        
        // PRIORIDADE: Filtrar por nome do prédio se especificado
        if (functionArgs.nome_predio) {
          query = query.ilike('nome', `%${functionArgs.nome_predio}%`);
          console.log(`[IA-CONSOLE] Filtering by building name: ${functionArgs.nome_predio}`);
        }
        
        // Filtrar por status
        if (functionArgs.status === 'ativo') {
          query = query.eq('status', 'ativo');
        } else if (functionArgs.status === 'instalação') {
          query = query.eq('status', 'instalação');
        }
        
        // Filtrar por bairro se especificado
        if (functionArgs.bairro) {
          query = query.ilike('bairro', `%${functionArgs.bairro}%`);
        }
        
        const { data: buildings, error: buildingsError } = await query;
        
        if (buildingsError) {
          functionResult = { error: buildingsError.message };
        } else {
          // Formatar resultado baseado no tipo de consulta
          if (functionArgs.tipo_consulta === 'count') {
            functionResult = {
              total: buildings.length,
              status: functionArgs.status
            };
          } else if (functionArgs.tipo_consulta === 'list') {
            functionResult = buildings.map(b => ({
              nome: b.nome,
              preco_base: b.preco_base,
              visualizacoes_mes: b.visualizacoes_mes,
              publico_estimado: b.publico_estimado,
              status: b.status
            }));
          } else {
            // Tipo "details" - ordenar por exibições (maior primeiro)
            functionResult = buildings
              .sort((a, b) => (b.visualizacoes_mes || 0) - (a.visualizacoes_mes || 0))
              .map(b => ({
                nome: b.nome,
                preco_base: b.preco_base,
                visualizacoes_mes: b.visualizacoes_mes,
                publico_estimado: b.publico_estimado,
                bairro: b.bairro,
                status: b.status
              }));
          }
        }
        
        console.log(`[IA-CONSOLE] Query result: ${buildings?.length || 0} buildings found`);
      }
      
      // Chamar OpenAI novamente com o resultado da função (com proteção)
      let secondCallResponse;
      let finalData;
      let finalMessage;
      let tokensUsed;

      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 60000);
        
        secondCallResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: agent.openai_config?.model || 'gpt-4-turbo-preview',
            messages: [
              ...messagesArray,
              assistantMessage,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(functionResult)
              }
            ],
            temperature: agent.openai_config?.temperature || 0.7,
            max_tokens: agent.openai_config?.max_tokens || 2000
          }),
          signal: controller2.signal
        });
        
        clearTimeout(timeoutId2);
        
        if (!secondCallResponse.ok) {
          const errorText = await secondCallResponse.text();
          console.error('[IA-CONSOLE] Second OpenAI call error:', errorText);
          throw new Error(`OpenAI API error: ${secondCallResponse.status}`);
        }

        finalData = await secondCallResponse.json();
        finalMessage = finalData.choices[0].message.content;
        tokensUsed = finalData.usage.total_tokens;

      } catch (error) {
        console.error('[IA-CONSOLE] Second OpenAI call failed:', error);
        
        // Retornar mensagem amigável com o resultado da função
        return new Response(
          JSON.stringify({
            success: true,
            response: `⚠️ Consegui consultar os dados (${functionResult.total || functionResult.length} prédios encontrados), mas tive dificuldade em formatar a resposta. Pode tentar novamente?`,
            tokens: 0,
            latency: Date.now() - startTime,
            functionCalled: functionName,
            functionResult: functionResult,
            error: error.message
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
      
      // Registrar em logs
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        event_type: 'console_test_success',
        metadata: {
          message: message.substring(0, 100),
          response: finalMessage.substring(0, 200),
          tokens: tokensUsed,
          latency: Date.now() - startTime,
          model: finalData.model,
          function_called: functionName
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          response: finalMessage,
          tokens: tokensUsed,
          latency: Date.now() - startTime,
          model: finalData.model,
          credentialsPresent: true,
          functionCalled: functionName,
          functionResult: functionResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Se não houve function call, retornar resposta normalmente
    const finalMessage = assistantMessage.content;
    const tokensUsed = data.usage.total_tokens;

    // Registrar em logs (resposta sem function call)
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'console_test_success',
      metadata: {
        message: message.substring(0, 100),
        response: finalMessage.substring(0, 200),
        tokens: tokensUsed,
        latency: Date.now() - startTime,
        model: data.model
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: finalMessage,
        tokens: tokensUsed,
        latency: Date.now() - startTime,
        model: data.model,
        credentialsPresent: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[IA-CONSOLE] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        response: `Erro ao processar: ${error.message}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
