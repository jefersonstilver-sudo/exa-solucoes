import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Função anti-quebra de números grandes
 * Evita que números como "108.000" sejam quebrados em "108." + "000" em mensagens separadas
 * Também previne quebra de valores monetários e outras formatações numéricas
 */
function preventNumberBreak(text: string): string {
  if (!text) return text;
  
  // 1. Normalizar espaços ao redor de números formatados
  //    "72. 000" → "72.000" / "R$ 1. 639" → "R$ 1.639"
  text = text.replace(/(\d+)\.\s+(\d{3})/g, '$1.$2');
  
  // 2. Proteger vírgulas decimais em valores monetários
  //    "R$ 275,00" não deve virar "275, 00"
  text = text.replace(/(\d+),\s+(\d{2})\b/g, '$1,$2');
  
  // 3. Evitar quebra de pontos de milhar seguidos
  //    "108.000.000" não deve quebrar
  text = text.replace(/(\d+)\.\s*(\d{3})\b/g, '$1.$2');
  
  // 4. Corrigir valores que foram quebrados com ponto final + espaço + número
  //    "Total: 72.\n000" → "Total: 72.000"
  text = text.replace(/(\d+)\.\s*\n\s*(\d{3})/g, '$1.$2');
  
  return text;
}

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
    
    // Carregar AMBAS as bases de conhecimento (COM CARREGAMENTO INTELIGENTE)
    try {
      // 🆕 DETECTAR se precisa de conhecimento extra (documentos pesados)
      const needsExtraKnowledge = message.match(
        /institucional|empresa|quem.*exa|história|missão|media kit|documento|pdf|arquivo|material|apresentação|sobre.*exa|proposta|cnpj/i
      );

      // 1. Carregar agent_sections (Base principal estruturada - Identidade, Operacional, Limites)
      // 🔧 FIX: Usar agent.key ao invés de agent.id (UUID)
      // 🚀 SEMPRE carregar seções 1, 2, 3 (essenciais)
      const { data: essentialSections } = await supabase
        .from('agent_sections')
        .select('section_number, section_title, content')
        .eq('agent_id', agentKey)
        .in('section_number', [1, 2, 3])
        .order('section_number');
      
      if (essentialSections && essentialSections.length > 0) {
        const sectionsText = essentialSections
          .filter(s => s.content && s.content.trim())
          .map(s => `### SEÇÃO ${s.section_number}: ${s.section_title}\n\n${s.content}`)
          .join('\n\n---\n\n');
        
        if (sectionsText) {
          systemPrompt += `\n\n=== BASE DE CONHECIMENTO ESSENCIAL (Seções 1, 2, 3) ===\n${sectionsText}`;
          console.log(`[IA-CONSOLE] ✅ Loaded essential sections (1-3): ${essentialSections.length} sections`);
        }
      }

      // 📚 CARREGAR seção 4 + knowledge items SOMENTE SE NECESSÁRIO (com limite de 5 documentos)
      if (needsExtraKnowledge) {
        console.log('[IA-CONSOLE] 📚 Knowledge search detected, loading full knowledge base...');
        
        const { data: section4 } = await supabase
          .from('agent_sections')
          .select('*')
          .eq('agent_id', agentKey)
          .eq('section_number', 4)
          .maybeSingle();
        
        if (section4 && section4.content) {
          systemPrompt += `\n\n### SEÇÃO 4: ${section4.section_title}\n\n${section4.content}\n\n---\n\n`;
          console.log('[IA-CONSOLE] ✅ Loaded section 4');
        }
        
        // 2. Carregar agent_knowledge_items (LIMITADO a 5 documentos mais relevantes)
        const { data: knowledge } = await supabase
          .from('agent_knowledge_items')
          .select('title, content, instruction')
          .eq('agent_id', agentKey)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(5); // FASE 2.1: Limitar a 5 documentos para reduzir tokens
        
        if (knowledge && knowledge.length > 0) {
          const knowledgeText = knowledge.map(k => 
            `### ${k.title}\n${k.instruction || ''}\n\n${k.content}`
          ).join('\n\n---\n\n');
          
          systemPrompt += `\n\n=== DOCUMENTOS E RECURSOS EXTRAS ===\n${knowledgeText}`;
          console.log(`[IA-CONSOLE] ✅ Loaded ${knowledge.length} knowledge items (limited to 5 for performance)`);
        }
      } else {
        console.log('[IA-CONSOLE] ⚡ Fast mode: Only essential sections loaded');
      }
    } catch (error) {
      console.error('[IA-CONSOLE] ❌ Failed to load knowledge:', error);
      
      // 🆕 LOG DETALHADO EM agent_logs
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        event_type: 'console_knowledge_load_error',
        metadata: {
          error: String(error),
          message: error?.message || 'Unknown error',
          stack: error?.stack,
          timestamp: new Date().toISOString()
        }
      });
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

🔴 REGRA #5: MÚLTIPLAS PERGUNTAS = RESPOSTA COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quando o cliente enviar mensagem com MÚLTIPLAS perguntas, você DEVE:

1️⃣ IDENTIFICAR todas as perguntas (saudação, preço específico, quantidade total, consultoria)
2️⃣ RESPONDER CADA UMA delas em ordem natural
3️⃣ FAZER tool_calls separados se necessário (um para cada dado diferente)
4️⃣ MANTER TOM HUMANO - não listar roboticamente

EXEMPLO REAL:
Usuário: "Oi! Quanto custa o Royal Legacy? Quantos prédios têm? Vale começar com 1?"

Você DEVE:
- Cumprimentar (não precisa de tool)
- Consultar Royal Legacy: consultar_predios(nome_predio="Royal Legacy", tipo_consulta="details")
- Consultar total: consultar_predios(status="ativo", tipo_consulta="count")  
- Responder consultoria (não precisa de tool - use sua expertise)

Resposta esperada:
"Boa noite! Tudo ótimo! 😊

O Royal Legacy custa R$ 8.000/mês e tem 36.000 visualizações mensais.

Hoje temos 10 prédios ativos no total! 🏢

Sobre começar com 1 prédio - faz total sentido! Você testa o retorno primeiro e depois escala conforme o resultado. Para pizzaria, prédios residenciais de classe média costumam dar ótimo resultado.

Quer que eu te mostre os melhores prédios para o seu segmento?"

❌ NUNCA ignore perguntas
❌ NUNCA responda só uma parte
❌ NUNCA separe em múltiplas mensagens
✅ SEMPRE cubra TODAS as perguntas em UMA resposta fluida e natural

═══════════════════════════════════════════════════════════════

⚠️ ESTAS REGRAS SÃO INEGOCIÁVEIS. SIGA-AS SEMPRE.
⚠️ DADOS INVENTADOS = ERRO GRAVE. USE SEMPRE A FERRAMENTA.
`;

    // Construir array de mensagens com histórico
    const messagesArray = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico se existir (LIMITADO às últimas 10 mensagens para reduzir tokens)
    // 🔧 SANITIZAR: Remover mensagens assistant com tool_calls sem respostas (causam erro 400)
    if (context?.conversationHistory && Array.isArray(context.conversationHistory)) {
      const limitedHistory = context.conversationHistory.slice(-10); // FASE 2.1: Limitar histórico
      
      // Sanitizar histórico removendo assistant messages com tool_calls órfãos
      const sanitizedHistory = limitedHistory.filter((msg, index) => {
        // Se não é assistant message com tool_calls, manter
        if (msg.role !== 'assistant' || !msg.tool_calls) {
          return true;
        }
        
        // Se é assistant com tool_calls, verificar se próxima mensagem é tool response
        const nextMsg = limitedHistory[index + 1];
        const hasToolResponse = nextMsg && nextMsg.role === 'tool';
        
        if (!hasToolResponse) {
          console.log('[IA-CONSOLE] 🧹 Removing assistant message with orphaned tool_calls');
          return false; // Remover
        }
        
        return true; // Manter se tem resposta
      }).map(msg => {
        // Garantir que não há tool_calls residuais em assistant messages
        if (msg.role === 'assistant' && msg.tool_calls) {
          return { role: msg.role, content: msg.content || '', tool_calls: msg.tool_calls };
        }
        return msg;
      });
      
      console.log(`[IA-CONSOLE] Adding ${sanitizedHistory.length} sanitized messages (removed ${limitedHistory.length - sanitizedHistory.length} contaminated)`);
      messagesArray.push(...sanitizedHistory);
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

    // Função auxiliar para chamar OpenAI com retry automático
    async function callOpenAIWithRetry(requestBody: any, maxRetries = 3): Promise<any> {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[IA-CONSOLE] 🔄 OpenAI attempt ${attempt}/${maxRetries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);
          
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          // Se sucesso, retornar
          if (response.ok) {
            return await response.json();
          }

          // Se erro 429 (rate limit), fazer retry com backoff
          if (response.status === 429) {
            const errorBody = await response.json();
            lastError = errorBody;
            
            // Extrair tempo de espera sugerido pela API
            const retryAfter = response.headers.get('retry-after');
            const waitTime = retryAfter 
              ? parseInt(retryAfter) * 1000 
              : Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff: 2s, 4s, 8s
            
            console.warn(`[IA-CONSOLE] ⚠️ Rate limit (429), waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
            
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }

          // Outros erros: não fazer retry
          const errorText = await response.text();
          console.error('[IA-CONSOLE] ❌ OpenAI error response:', errorText);
          throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
          
        } catch (error) {
          if (attempt === maxRetries) {
            throw error;
          }
          lastError = error;
          console.error(`[IA-CONSOLE] ❌ Attempt ${attempt} failed:`, error.message);
          
          // Backoff para erros de rede também
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      throw new Error(`Failed after ${maxRetries} retries: ${JSON.stringify(lastError)}`);
    }

    // Chamar OpenAI com proteção contra timeout e retry automático
    const startTime = Date.now();

    let data;
    let assistantMessage;

    try {
      data = await callOpenAIWithRetry({
        model: 'gpt-4o-mini', // Modelo otimizado para melhor performance e limite maior
        messages: messagesArray,
        tools: tools,
        parallel_tool_calls: false,  // ← Forçar 1 tool_call por vez para simplificar processamento
        temperature: agent.openai_config?.temperature || 0.7,
        max_tokens: agent.openai_config?.max_tokens || 2000
      });
      
      assistantMessage = data.choices[0].message;
      console.log('[IA-CONSOLE] ✅ OpenAI response received:', {
        tokens: data.usage?.total_tokens,
        model: 'gpt-4o-mini',
        duration_ms: Date.now() - startTime
      });

    } catch (error) {
      console.error('[IA-CONSOLE] 💥 OpenAI call failed after retries:', error);
      
      // Mensagens de erro contextuais baseadas no tipo de erro
      let userMessage = 'Desculpe, estou com dificuldades para processar sua mensagem agora.';
      
      if (error.message?.includes('429') || error.message?.includes('rate_limit')) {
        userMessage = '⏳ Recebi muitas mensagens ao mesmo tempo! Aguarde alguns segundos e tente novamente. 🙏';
      } else if (error.message?.includes('401') || error.message?.includes('Invalid API key')) {
        userMessage = '🔧 Nosso sistema de IA está temporariamente indisponível. Por favor, tente novamente em alguns minutos.';
      } else if (error.message?.includes('timeout') || error.message?.includes('AbortError')) {
        userMessage = '⏱️ Sua solicitação demorou mais que o esperado. Pode ser muita informação para processar. Tente perguntar de forma mais específica. 😊';
      }
      
      // Retornar mensagem amigável SEM resetar conversa
      return new Response(
        JSON.stringify({
          success: false,
          response: userMessage,
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
      const allToolCalls = assistantMessage.tool_calls;
      console.log(`[IA-CONSOLE] 📞 Processing ${allToolCalls.length} tool_call(s)`, {
        toolCallIds: allToolCalls.map(tc => tc.id),
        functions: allToolCalls.map(tc => tc.function.name)
      });
      
      // Processar TODOS os tool_calls
      const toolResponses = [];
      let consolidatedResult = [];
      let totalCount = 0;
      let hasCount = false;
      
      for (const toolCall of allToolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[IA-CONSOLE] 🔧 Executing ${functionName}:`, functionArgs);
        
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
              hasCount = true;
              totalCount = buildings.length;
            } else if (functionArgs.tipo_consulta === 'list') {
              functionResult = buildings.map(b => ({
                nome: b.nome,
                preco_base: b.preco_base,
                visualizacoes_mes: b.visualizacoes_mes,
                publico_estimado: b.publico_estimado,
                status: b.status
              }));
              consolidatedResult = consolidatedResult.concat(functionResult);
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
              consolidatedResult = consolidatedResult.concat(functionResult);
            }
          }
          
          console.log(`[IA-CONSOLE] ✅ Query result: ${buildings?.length || 0} buildings found`);
        }
        
        // Adicionar resposta do tool
        toolResponses.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult)
        });
      }
      
      console.log(`[IA-CONSOLE] 📊 Collected ${toolResponses.length} tool responses`);
      
      // Chamar OpenAI novamente com TODAS as respostas dos tool_calls
      let finalData;
      let finalMessage;
      let tokensUsed;

      try {
        // 🔍 Log detalhado antes da chamada para debug
        const secondCallMessages = [
          ...messagesArray,
          assistantMessage,
          ...toolResponses  // ← TODAS as respostas dos tool_calls
        ];
        
        console.log('[IA-CONSOLE] 📝 Second OpenAI call details:', {
          totalMessages: secondCallMessages.length,
          assistantWithToolCalls: !!assistantMessage.tool_calls,
          toolCallsCount: assistantMessage.tool_calls?.length || 0,
          toolResponsesCount: toolResponses.length,
          messageRoles: secondCallMessages.map(m => m.role),
          lastMessages: secondCallMessages.slice(-5).map(m => ({ 
            role: m.role, 
            hasToolCalls: !!m.tool_calls,
            toolCallId: m.tool_call_id 
          }))
        });
        
        finalData = await callOpenAIWithRetry({
          model: 'gpt-4o-mini',
          messages: secondCallMessages,
          // ⚠️ NÃO usar parallel_tool_calls aqui - esta chamada NÃO tem tools (causa erro 400)
          temperature: agent.openai_config?.temperature || 0.7,
          max_tokens: agent.openai_config?.max_tokens || 2000
        });

        finalMessage = finalData.choices[0].message.content;
        tokensUsed = finalData.usage.total_tokens;
        console.log('[IA-CONSOLE] ✅ Second OpenAI call succeeded');

      } catch (error) {
        console.error('[IA-CONSOLE] 💥 Second OpenAI call failed after retries:', error);
        
        // Detectar tipos de erro que podem ser tratados com fallback local
        const isRateLimit = error.message?.includes('429') || error.message?.includes('rate_limit');
        const isToolCallError = error.message?.includes('tool_calls') || error.message?.includes('tool_call_id');
        const is400Error = error.message?.includes('400');
        
        // 🆕 FALLBACK INTELIGENTE: Formatar localmente para rate limit, tool_calls errors, etc
        if (isRateLimit || isToolCallError || is400Error) {
          console.log('[IA-CONSOLE] ⚡ Using local formatting fallback:', { isRateLimit, isToolCallError, is400Error });
          
          // 🆕 FALLBACK HUMANIZADO E COMPLETO
          // Detectar componentes da mensagem original do usuário
          const userMessage = message.toLowerCase();
          const hasSaudacao = userMessage.match(/\b(oi|olá|boa noite|bom dia|boa tarde|tudo bem|e aí)\b/i);
          const predioCitado = userMessage.match(/royal\s*legacy|liberdade|maracana|porto|prime/i)?.[0];
          const perguntaConsultoria = userMessage.match(/vale.*pena|começ.*com|meu.*segmento|pizzaria|consultoria|aconselh|sugest/i);
          
          let formattedResponse = '';
          
          // 1️⃣ SAUDAÇÃO (se apropriada)
          if (hasSaudacao) {
            formattedResponse += 'Boa noite! Tudo ótimo por aqui! 😊\n\n';
          }
          
          // 2️⃣ RESPOSTA SOBRE PRÉDIO ESPECÍFICO (se mencionado e encontrado)
          if (predioCitado && consolidatedResult.length > 0) {
            const predioEncontrado = consolidatedResult.find(p => 
              p.nome.toLowerCase().includes(predioCitado.toLowerCase())
            );
            if (predioEncontrado) {
              formattedResponse += `O **${predioEncontrado.nome}** custa **R$ ${predioEncontrado.preco_base?.toLocaleString('pt-BR')}/mês** com **${predioEncontrado.visualizacoes_mes?.toLocaleString('pt-BR')} visualizações mensais**! 📊\n\n`;
            }
          }
          
          // 3️⃣ QUANTIDADE TOTAL DE PRÉDIOS
          if (hasCount || consolidatedResult.length > 0) {
            const total = totalCount || consolidatedResult.length;
            formattedResponse += `Temos **${total} prédios ativos** hoje! 🏢\n\n`;
          }
          
          // 4️⃣ CONSULTORIA (se detectada na pergunta)
          if (perguntaConsultoria) {
            formattedResponse += 'Sobre começar com 1 prédio - **faz total sentido!** Você testa o retorno primeiro e depois escala conforme o resultado. ';
            formattedResponse += 'Para **pizzaria**, prédios residenciais de **classe média** costumam dar **ótimo resultado** (alto volume de pedidos). 🍕\n\n';
          }
          
          // 5️⃣ LISTA DETALHADA (se não mencionou prédio específico e tem lista)
          if (!predioCitado && consolidatedResult.length > 0 && consolidatedResult.length <= 5) {
            const uniqueBuildings = consolidatedResult.filter((building, index, self) =>
              index === self.findIndex((b) => b.nome === building.nome)
            );
            
            formattedResponse += 'Aqui estão os prédios:\n\n';
            uniqueBuildings.forEach((p) => {
              formattedResponse += `🏢 **${p.nome}**\n`;
              formattedResponse += `   📊 ${p.visualizacoes_mes?.toLocaleString('pt-BR') || 'N/A'} visualizações/mês\n`;
              formattedResponse += `   💰 R$ ${p.preco_base?.toLocaleString('pt-BR') || 'N/A'}/mês\n`;
              if (p.bairro) formattedResponse += `   📍 ${p.bairro}\n`;
              formattedResponse += `\n`;
            });
          }
          
          // 6️⃣ ENGAJAMENTO FINAL
          if (formattedResponse) {
            formattedResponse += 'Quer que eu te mostre mais detalhes sobre algum prédio específico? 😊';
          } else {
            formattedResponse = 'Não encontrei informações sobre isso ainda. Posso ajudar de outra forma? 🤔';
          }
          
          // Log do fallback com tipo de erro
          await supabase.from('agent_logs').insert({
            agent_key: agentKey,
            event_type: 'console_fallback_success',
            metadata: {
              reason: isRateLimit ? 'rate_limit_429' : isToolCallError ? 'tool_calls_error' : is400Error ? 'bad_request_400' : 'unknown',
              errorMessage: error.message?.substring(0, 200),
              toolCallsProcessed: allToolCalls.length,
              resultCount: consolidatedResult.length || totalCount,
              userMessage: message.substring(0, 200),
              timestamp: new Date().toISOString()
            }
          });
          
          return new Response(
            JSON.stringify({
              success: true,
              response: preventNumberBreak(formattedResponse),
              tokens: 0,
              latency: Date.now() - startTime,
              toolCallsProcessed: allToolCalls.length,
              consolidatedResult: consolidatedResult.length > 0 ? consolidatedResult : { total: totalCount },
              fallbackUsed: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
        
        // Para outros erros, tentar 1 RETRY com delay de 2s
        console.log('[IA-CONSOLE] 🔄 Retrying second OpenAI call in 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const controller3 = new AbortController();
          const timeoutId3 = setTimeout(() => controller3.abort(), 60000);
          
          const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: agent.openai_config?.model || 'gpt-4o-mini',
              messages: [
                ...messagesArray,
                assistantMessage,
                ...toolResponses  // ← TODAS as respostas
              ],
              // ⚠️ NÃO usar parallel_tool_calls aqui - esta chamada NÃO tem tools (causa erro 400)
              temperature: agent.openai_config?.temperature || 0.7,
              max_tokens: agent.openai_config?.max_tokens || 2000
            }),
            signal: controller3.signal
          });
          
          clearTimeout(timeoutId3);
          
          if (retryResponse.ok) {
            console.log('[IA-CONSOLE] ✅ Retry succeeded');
            finalData = await retryResponse.json();
            finalMessage = preventNumberBreak(finalData.choices[0].message.content);
            tokensUsed = finalData.usage.total_tokens;
          } else {
            throw new Error('Retry failed');
          }
        } catch (retryError) {
          console.error('[IA-CONSOLE] Retry also failed:', retryError);
          
          // Log do erro
          await supabase.from('agent_logs').insert({
            agent_key: agentKey,
            event_type: 'console_format_error',
            metadata: {
              error: String(error),
              retryError: String(retryError),
              message: error?.message || 'Unknown error',
              toolCallsProcessed: allToolCalls.length,
              consolidatedResult: consolidatedResult.length || totalCount,
              userMessage: message.substring(0, 200),
              timestamp: new Date().toISOString()
            }
          });
          
          // Retornar mensagem amigável com fallback melhorado
          let fallbackMsg = '';
          if (consolidatedResult.length > 0) {
            fallbackMsg = `Encontrei ${consolidatedResult.length} prédios:\n\n`;
            consolidatedResult.slice(0, 5).forEach((p, i) => {
              fallbackMsg += `${i + 1}. ${p.nome} - ${p.visualizacoes_mes?.toLocaleString('pt-BR') || 'N/A'} vis/mês\n`;
            });
            if (consolidatedResult.length > 5) {
              fallbackMsg += `\n...e mais ${consolidatedResult.length - 5}.\n`;
            }
            fallbackMsg += '\nPosso dar mais detalhes!';
          } else if (totalCount > 0) {
            fallbackMsg = `Temos ${totalCount} prédios disponíveis! Quer ver a lista?`;
          } else {
            fallbackMsg = `⚠️ Consegui consultar os dados, mas tive dificuldade em formatar a resposta. Pode tentar novamente?`;
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              response: preventNumberBreak(fallbackMsg),
              tokens: 0,
              latency: Date.now() - startTime,
              toolCallsProcessed: allToolCalls.length,
              consolidatedResult: consolidatedResult.length > 0 ? consolidatedResult : { total: totalCount },
              error: error.message
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
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
          tool_calls_processed: allToolCalls.length
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          response: preventNumberBreak(finalMessage),
          tokens: tokensUsed,
          latency: Date.now() - startTime,
          model: finalData.model,
          credentialsPresent: true,
          toolCallsProcessed: allToolCalls.length,
          consolidatedResult: consolidatedResult.length > 0 ? consolidatedResult : { total: totalCount }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Se não houve function call, retornar resposta normalmente
    const finalMessage = preventNumberBreak(assistantMessage.content);
    const tokensUsed = data.usage.total_tokens;

    // Registrar métricas de performance (Fase 3.2)
    await supabase.from('agent_performance_metrics').insert({
      agent_key: agentKey,
      metric_type: 'success',
      duration_ms: Date.now() - startTime,
      tokens_used: tokensUsed,
      model: data.model || 'gpt-4o-mini',
      metadata: { message_preview: message.substring(0, 50) }
    });

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
