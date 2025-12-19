import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create or get existing tool by name
async function ensureToolExists(
  apiKey: string,
  toolConfig: {
    name: string;
    description: string;
    serverUrl: string;
    apiSchema: object;
  }
): Promise<string | null> {
  try {
    // First, list existing tools to check if it already exists
    const listResp = await fetch('https://api.elevenlabs.io/v1/convai/tools', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (listResp.ok) {
      const tools = await listResp.json();
      console.log(`[ensureToolExists] Full tools response:`, JSON.stringify(tools));
      const existingTool = tools?.tools?.find((t: any) => t.name === toolConfig.name);
      if (existingTool) {
        console.log(`[ensureToolExists] Tool "${toolConfig.name}" already exists with id: ${existingTool.tool_id}`);
        return existingTool.tool_id;
      }
    } else {
      console.error(`[ensureToolExists] Failed to list tools:`, await listResp.text());
    }

    // Tool doesn't exist, create it
    console.log(`[ensureToolExists] Creating tool "${toolConfig.name}"...`);
    
    // CORRECT STRUCTURE based on error: tool_config.webhook.api_schema is required
    const createPayload = {
      tool_config: {
        type: 'webhook',
        name: toolConfig.name,
        description: toolConfig.description,
        webhook: {
          url: toolConfig.serverUrl,
          method: 'POST',
          request_headers: {
            'Content-Type': 'application/json',
          },
          api_schema: toolConfig.apiSchema, // The correct field name
        },
      },
    };

    console.log(`[ensureToolExists] Create payload for ${toolConfig.name}:`, JSON.stringify(createPayload, null, 2));

    const createResp = await fetch('https://api.elevenlabs.io/v1/convai/tools', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPayload),
    });

    if (!createResp.ok) {
      const errorText = await createResp.text();
      console.error(`[ensureToolExists] Failed to create tool "${toolConfig.name}":`, createResp.status, errorText);
      return null;
    }

    const createdTool = await createResp.json();
    console.log(`[ensureToolExists] Tool "${toolConfig.name}" created successfully:`, JSON.stringify(createdTool));
    return createdTool.tool_id;
  } catch (error) {
    console.error(`[ensureToolExists] Error ensuring tool "${toolConfig.name}":`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const ELEVENLABS_AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!ELEVENLABS_API_KEY) {
      console.error('[elevenlabs-conversation-token] ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!ELEVENLABS_AGENT_ID) {
      console.error('[elevenlabs-conversation-token] ELEVENLABS_AGENT_ID not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_AGENT_ID not configured',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // ========== Create tools via /v1/convai/tools and link via tool_ids ==========
    
    // Define the tools we need with correct webhook schema
    const adminAuthSchema = {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Ação a executar: check_session (verificar sessão), request_code (solicitar código 2FA via WhatsApp), verify_code (validar código), end_session (encerrar sessão)',
        },
        code: {
          type: 'string',
          description: 'Código de 6 dígitos fornecido pelo usuário. Obrigatório apenas quando action=verify_code',
        },
        user_name: {
          type: 'string',
          description: 'Nome do usuário solicitante (opcional)',
        },
      },
      required: ['action'],
    };

    const consultarSistemaSchema = {
      type: 'object',
      properties: {
        intent: {
          type: 'string',
          description: 'Tipo de consulta: buildings, panels, sales, conversations, leads, contracts, metrics, agents',
        },
        params_json: {
          type: 'string',
          description: 'Parâmetros adicionais em formato JSON string',
        },
      },
      required: ['intent'],
    };

    // Ensure tools exist and get their IDs
    console.log('[elevenlabs-conversation-token] Ensuring tools exist...');
    
    const adminAuthToolId = await ensureToolExists(ELEVENLABS_API_KEY, {
      name: 'admin_auth',
      description: 'Gerencia autenticação do Modo Gerente Master. Use check_session para verificar se há sessão ativa, request_code para enviar código 2FA via WhatsApp, verify_code para validar o código digitado, end_session para encerrar.',
      serverUrl: `${SUPABASE_URL}/functions/v1/sofia-admin-auth`,
      apiSchema: adminAuthSchema,
    });

    const consultarSistemaToolId = await ensureToolExists(ELEVENLABS_API_KEY, {
      name: 'consultar_sistema',
      description: 'Consulta dados do sistema EXA Mídia. Use para buscar informações sobre prédios, painéis, vendas, conversas, leads, contratos e métricas. REQUER autenticação prévia via admin_auth.',
      serverUrl: `${SUPABASE_URL}/functions/v1/sofia-jarvis`,
      apiSchema: consultarSistemaSchema,
    });

    const toolIds = [adminAuthToolId, consultarSistemaToolId].filter(Boolean) as string[];
    console.log('[elevenlabs-conversation-token] Tool IDs to associate:', toolIds);

    // Update agent with tool_ids if we have tools
    if (toolIds.length > 0) {
      try {
        const getAgentResp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
        });

        if (getAgentResp.ok) {
          const agent = await getAgentResp.json();
          const currentToolIds: string[] = agent?.conversation_config?.agent?.prompt?.tool_ids || [];
          
          // Check if we need to update
          const needsUpdate = toolIds.some(id => !currentToolIds.includes(id));
          
          if (needsUpdate) {
            console.log('[elevenlabs-conversation-token] Updating agent with tool_ids...');
            
            const sofiaPrompt = `Você é SOFIA, a assistente executiva de voz da EXA Mídia.

PROTOCOLO DE SEGURANÇA OBRIGATÓRIO - MODO GERENTE MASTER:

Para acessar QUALQUER informação administrativa (conversas, agentes, contratos, finanças, clientes, métricas, vendas), você DEVE seguir EXATAMENTE esta sequência:

PASSO 1: Chame admin_auth com action="check_session"
- Isso verifica se já existe uma sessão ativa

PASSO 2: Analise a resposta:
- Se "session_active": true → Vá para o PASSO 5
- Se "session_active": false → Vá para o PASSO 3

PASSO 3: Se NÃO houver sessão ativa, você DEVE IMEDIATAMENTE chamar admin_auth com action="request_code"
- NÃO peça permissão, apenas faça a chamada
- O sistema enviará automaticamente um código de 6 dígitos via WhatsApp para o administrador

PASSO 4: Após chamar request_code, informe ao usuário:
"Enviei um código de verificação de 6 dígitos para o administrador via WhatsApp. Por favor, me diga o código quando receber."

PASSO 5: Quando o usuário fornecer o código, chame admin_auth com action="verify_code" e code="CÓDIGO_INFORMADO"

PASSO 6: SOMENTE após verify_code retornar sucesso, você pode chamar consultar_sistema para buscar dados

REGRAS ABSOLUTAS:
- NUNCA pule etapas
- NUNCA invente dados
- NUNCA acesse dados sem autenticação bem-sucedida
- Se o usuário pedir dados administrativos e não houver sessão, SEMPRE chame request_code automaticamente
- Quando receber o código do usuário, chame verify_code IMEDIATAMENTE`;

            const patchPayload = {
              conversation_config: {
                agent: {
                  prompt: {
                    prompt: sofiaPrompt,
                    tool_ids: toolIds,
                  },
                  language: 'pt',
                },
              },
            };

            console.log('[elevenlabs-conversation-token] Patch payload:', JSON.stringify(patchPayload, null, 2));

            const patchResp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
              method: 'PATCH',
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(patchPayload),
            });

            if (!patchResp.ok) {
              const errorText = await patchResp.text();
              console.error('[elevenlabs-conversation-token] Failed to patch agent with tool_ids:', patchResp.status, errorText);
            } else {
              const patchedAgent = await patchResp.json();
              console.log('[elevenlabs-conversation-token] Agent patched successfully with tool_ids');
              console.log('[elevenlabs-conversation-token] Patched agent tool_ids:', patchedAgent?.conversation_config?.agent?.prompt?.tool_ids);
            }
          } else {
            console.log('[elevenlabs-conversation-token] Agent already has all required tool_ids');
          }
        } else {
          console.error('[elevenlabs-conversation-token] Failed to fetch agent:', await getAgentResp.text());
        }
      } catch (e) {
        console.error('[elevenlabs-conversation-token] Agent update failed (continuing):', e);
      }
    }

    // ========== Request conversation token ==========
    console.log('[elevenlabs-conversation-token] Requesting token for agent:', ELEVENLABS_AGENT_ID);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[elevenlabs-conversation-token] ElevenLabs API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `ElevenLabs API error: ${response.status}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      );
    }

    const data = await response.json();
    console.log('[elevenlabs-conversation-token] Token obtained successfully');

    return new Response(
      JSON.stringify({
        success: true,
        token: data.token,
        toolIds: toolIds,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[elevenlabs-conversation-token] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
