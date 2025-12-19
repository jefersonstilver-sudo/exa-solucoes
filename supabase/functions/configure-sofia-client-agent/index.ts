import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`\n[SOFIA-CLIENT-CONFIG] ${requestId} - Request received`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    console.log(`[${requestId}] Action: ${action}`);

    // Get existing client agent ID or create new one
    let clientAgentId = Deno.env.get('ELEVENLABS_CLIENT_AGENT_ID');

    if (action === 'status') {
      if (!clientAgentId) {
        return new Response(JSON.stringify({
          success: false,
          configured: false,
          message: 'Sofia Cliente agent not configured yet',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch agent info
      const agentResp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${clientAgentId}`, {
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
      });

      if (!agentResp.ok) {
        return new Response(JSON.stringify({
          success: false,
          configured: false,
          message: 'Agent not found or invalid',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const agentInfo = await agentResp.json();
      const tools = agentInfo?.conversation_config?.agent?.prompt?.tools || [];
      const toolNames = tools.map((t: any) => t.name || t.tool_config?.name).filter(Boolean);

      return new Response(JSON.stringify({
        success: true,
        configured: true,
        agent_id: clientAgentId,
        agent_name: agentInfo?.name,
        tools: toolNames,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'configure') {
      console.log(`[${requestId}] Configuring Sofia Client Agent...`);

      // Sofia Client Prompt - focused on client assistance
      const clientPrompt = `## SOFIA CLIENTE - Assistente Virtual EXA Mídia

Você é a Sofia, assistente de voz amigável da EXA Mídia. Ajuda clientes (anunciantes e síndicos) a navegar no sistema.

## SUA PERSONALIDADE
- Tom: Amigável, prestativa e paciente
- Linguagem: Português brasileiro simples e claro
- Postura: Sempre positiva e encorajadora

## O QUE VOCÊ PODE FAZER

### 1. PRODUTOS
- **Painel Horizontal**: Formato 1440×1080 (4:3), 10 segundos, compartilhado com até 15 anunciantes. Ideal para mensagens rápidas.
- **Painel Vertical Premium**: Formato 1080×1920 (9:16), 15 segundos, EXCLUSIVO. Maior impacto visual.

### 2. CONSULTAS DO USUÁRIO
Use a ferramenta "consultar_sistema_cliente" para:
- Verificar pedidos ativos do usuário
- Status de vídeos enviados
- Informações de contratos
- Dados de pagamentos

### 3. NAVEGAÇÃO
Quando o usuário quiser ir a algum lugar, use "navegar_pagina" com:
- meus_pedidos: Ver pedidos ativos
- enviar_video: Upload de vídeo
- ver_predios: Ver prédios disponíveis
- perfil: Dados da conta
- carrinho: Carrinho de compras
- suporte: Contato com suporte

### 4. QR CODES
Use "gerar_qrcode" para gerar códigos de pagamento PIX.

### 5. FORMAS DE PAGAMENTO
- PIX: Desconto de 5%, pagamento instantâneo
- Cartão de Crédito: Parcelamento em até 12x
- Boleto: Vencimento em 3 dias úteis

## REGRAS IMPORTANTES
1. Só acesse dados do PRÓPRIO usuário logado
2. NUNCA exponha dados de outros clientes
3. Confirme antes de ações importantes
4. Se não souber, ofereça contato com suporte
5. Seja concisa mas completa

## EXEMPLOS DE RESPOSTAS

"Tenho pedido ativo?" → Consulte os pedidos e explique o status de cada um

"Quero ver prédios" → "Posso te levar até a página de prédios disponíveis. Quer que eu abra para você?"

"Como pago com PIX?" → Explique o processo e ofereça gerar um QR code

"O que é vertical premium?" → Explique as vantagens do formato exclusivo`;

      // Tool definitions for client agent
      const tools = [
        {
          type: 'webhook',
          name: 'consultar_sistema_cliente',
          description: 'Consulta informações do sistema para o cliente logado: pedidos, vídeos, contratos, pagamentos.',
          webhook: {
            url: `${SUPABASE_URL}/functions/v1/sofia-client`,
            method: 'POST',
            request_headers: {
              'Content-Type': 'application/json',
            },
          },
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                description: 'Tipo de consulta: meus_pedidos, status_video, meus_contratos, formas_pagamento, explicar_produto, status_pedido',
              },
              params: {
                type: 'object',
                description: 'Parâmetros adicionais como pedido_id, video_id, produto_tipo (horizontal/vertical)',
              },
              user_id: {
                type: 'string',
                description: 'ID do usuário logado (será preenchido automaticamente)',
              },
            },
            required: ['intent'],
          },
        },
        {
          type: 'webhook',
          name: 'navegar_pagina',
          description: 'Sugere navegação para uma página do sistema. Retorna dados para abrir popup de navegação.',
          webhook: {
            url: `${SUPABASE_URL}/functions/v1/sofia-client`,
            method: 'POST',
            request_headers: {
              'Content-Type': 'application/json',
            },
          },
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                enum: ['navegar'],
              },
              pagina: {
                type: 'string',
                description: 'Destino: meus_pedidos, enviar_video, ver_predios, perfil, carrinho, suporte',
              },
            },
            required: ['intent', 'pagina'],
          },
        },
        {
          type: 'webhook',
          name: 'gerar_qrcode',
          description: 'Gera QR code para pagamento PIX de um pedido ou valor específico.',
          webhook: {
            url: `${SUPABASE_URL}/functions/v1/sofia-client`,
            method: 'POST',
            request_headers: {
              'Content-Type': 'application/json',
            },
          },
          parameters: {
            type: 'object',
            properties: {
              intent: {
                type: 'string',
                enum: ['gerar_qrcode'],
              },
              pedido_id: {
                type: 'string',
                description: 'ID do pedido para gerar PIX',
              },
            },
            required: ['intent'],
          },
        },
      ];

      // Create or update agent
      const agentPayload = {
        name: 'Sofia Cliente - EXA Mídia',
        conversation_config: {
          agent: {
            prompt: {
              prompt: clientPrompt,
              tools: tools,
            },
            first_message: 'Olá! Sou a Sofia, sua assistente virtual. Como posso ajudar você hoje?',
            language: 'pt',
          },
          tts: {
            voice_id: 'XrExE9yKIg1WjnnlVkGX', // Matilda - friendly voice
          },
        },
      };

      let agentResponse;
      
      if (clientAgentId) {
        // Update existing agent
        console.log(`[${requestId}] Updating existing agent: ${clientAgentId}`);
        agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${clientAgentId}`, {
          method: 'PATCH',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentPayload),
        });
      } else {
        // Create new agent
        console.log(`[${requestId}] Creating new Sofia Client agent...`);
        agentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentPayload),
        });
      }

      if (!agentResponse.ok) {
        const errorText = await agentResponse.text();
        console.error(`[${requestId}] ElevenLabs API error:`, errorText);
        throw new Error(`ElevenLabs API error: ${agentResponse.status}`);
      }

      const agentData = await agentResponse.json();
      const newAgentId = agentData.agent_id || clientAgentId;

      console.log(`[${requestId}] ✅ Sofia Client Agent configured: ${newAgentId}`);

      return new Response(JSON.stringify({
        success: true,
        agent_id: newAgentId,
        message: clientAgentId ? 'Agent updated' : 'Agent created',
        note: 'Add ELEVENLABS_CLIENT_AGENT_ID to secrets with value: ' + newAgentId,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
