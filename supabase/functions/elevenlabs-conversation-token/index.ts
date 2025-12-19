import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Ensure ElevenLabs agent has required tools (admin_auth + consultar_sistema)
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
        const existingToolObjs: any[] = agent?.platform_settings?.tools || [];
        const existingTools: string[] = existingToolObjs.map((t: any) => t?.name).filter(Boolean) || [];
        const hasConsultarSistema = existingTools.includes('consultar_sistema');
        const hasAdminAuth = existingTools.includes('admin_auth');

        const adminAuthTool = existingToolObjs.find((t: any) => t?.name === 'admin_auth');
        const adminAuthRequired: string[] = adminAuthTool?.parameters?.required || [];
        const needsAdminAuthSchemaFix = adminAuthRequired.includes('user_phone');

        if (!hasConsultarSistema || !hasAdminAuth || needsAdminAuthSchemaFix) {
          console.log('[elevenlabs-conversation-token] Agent tools/schema need patch, patching...');

          const tools = [
            {
              type: 'webhook',
              name: 'consultar_sistema',
              description: 'Consulta dados do sistema EXA. Use para buscar informações sobre prédios, painéis, vendas, conversas, leads, contratos e métricas.',
              webhook: {
                url: `${SUPABASE_URL}/functions/v1/sofia-jarvis`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              },
              parameters: {
                type: 'object',
                properties: {
                  intent: {
                    type: 'string',
                    description: 'Tipo de consulta',
                  },
                  params_json: {
                    type: 'string',
                    description: 'Parâmetros da consulta em JSON',
                  },
                },
                required: ['intent'],
              },
            },
            {
              type: 'webhook',
              name: 'admin_auth',
              description: 'Gerencia autenticação do Modo Gerente Master. Use para verificar sessão, solicitar código, validar código ou encerrar sessão.',
              webhook: {
                url: `${SUPABASE_URL}/functions/v1/sofia-admin-auth`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              },
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    description: 'Ação: check_session, request_code, verify_code, end_session',
                  },
                  user_phone: {
                    type: 'string',
                    description: 'Telefone do usuário solicitante',
                  },
                  user_name: {
                    type: 'string',
                    description: 'Nome do usuário (opcional)',
                  },
                  code: {
                    type: 'string',
                    description: 'Código de 6 dígitos (apenas verify_code)',
                  },
                },
                required: ['action'],
              },
            },
          ];

          const patchPayload = {
            name: agent?.name || 'Sofia - EXA Mídia',
            conversation_config: {
              ...agent?.conversation_config,
              agent: {
                ...agent?.conversation_config?.agent,
                // Minimal but strict behavior: require 2FA for admin data
                prompt: {
                  prompt:
                    'Você é SOFIA (EXA Mídia). REGRA CRÍTICA: para qualquer dado administrativo (conversas, agentes, contratos, finanças, clientes), você DEVE primeiro chamar a ferramenta admin_auth com action="check_session". Se não houver sessão ativa, você DEVE chamar admin_auth com action="request_code" e informar que o código foi enviado ao administrador via WhatsApp. Só após verify_code com sucesso você pode chamar consultar_sistema. Nunca invente dados.',
                },
                language: agent?.conversation_config?.agent?.language || 'pt',
              },
            },
            platform_settings: {
              ...agent?.platform_settings,
              tools,
            },
          };

          const patchResp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
            method: 'PATCH',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchPayload),
          });

          if (!patchResp.ok) {
            console.error('[elevenlabs-conversation-token] Failed to patch agent tools:', await patchResp.text());
          } else {
            console.log('[elevenlabs-conversation-token] Agent patched successfully');
          }
        }
      } else {
        console.error('[elevenlabs-conversation-token] Failed to fetch agent before token:', await getAgentResp.text());
      }
    } catch (e) {
      console.error('[elevenlabs-conversation-token] Agent ensure failed (continuing):', e);
    }

    console.log('[elevenlabs-conversation-token] Requesting token for agent:', ELEVENLABS_AGENT_ID);

    // Request a conversation token from ElevenLabs
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
