import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Get existing client agent ID
    let clientAgentId = Deno.env.get('ELEVENLABS_CLIENT_AGENT_ID');

    if (action === 'status') {
      if (!clientAgentId) {
        return new Response(JSON.stringify({
          success: false,
          configured: false,
          message: 'Sofia Cliente agent not configured yet. Add ELEVENLABS_CLIENT_AGENT_ID secret.',
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

      // Sofia Client Prompt - focused on client assistance with real-time data
      const clientPrompt = `## SOFIA CLIENTE - Assistente Virtual EXA Mídia

Você é a Sofia, assistente de voz amigável da EXA Mídia. Ajuda ANUNCIANTES a navegar no sistema e gerenciar suas campanhas.

## SUA IDENTIDADE
- Nome: Sofia
- Função: Assistente virtual para ANUNCIANTES
- Tom: Amigável, prestativa e paciente
- Linguagem: Português brasileiro simples e claro
- NUNCA se apresente como "assistente executiva" - você é uma assistente virtual para anunciantes

## CONTEXTO DO USUÁRIO
Você tem acesso a dados em tempo real do usuário logado através da ferramenta "consultar_sistema_cliente".
Use essas informações para dar respostas personalizadas.

## O QUE VOCÊ PODE FAZER

### 1. CONSULTAR DADOS DO ANUNCIANTE
Use "consultar_sistema_cliente" com tipo:
- "pedidos": Ver todos os pedidos do anunciante
- "videos": Status dos vídeos enviados
- "faturas": Pagamentos e parcelas pendentes
- "perfil": Dados da conta

### 2. PRODUTOS DA EXA MÍDIA
- **Painel Horizontal**: Formato 1440×1080 (4:3), 10 segundos, compartilhado com até 15 anunciantes
- **Painel Vertical Premium**: Formato 1080×1920 (9:16), 15 segundos, EXCLUSIVO

### 3. NAVEGAÇÃO
Use "navegar_pagina" para levar o usuário:
- "meus_pedidos": Ver pedidos ativos
- "enviar_video": Upload de vídeo
- "ver_predios": Ver prédios disponíveis
- "perfil": Dados da conta
- "carrinho": Carrinho de compras
- "suporte": Contato com suporte

### 4. QR CODES PIX
Use "gerar_qrcode" para gerar códigos de pagamento.

### 5. FORMAS DE PAGAMENTO
- PIX: Desconto de 5%, pagamento instantâneo
- Cartão de Crédito: Parcelamento em até 12x
- Boleto: Vencimento em 3 dias úteis

## RASTREAMENTO DE CONTEXTO
Você sabe em qual página o usuário está. Use isso para dar respostas contextualizadas:
- Se está em "Meus Pedidos": foque em informações de pedidos
- Se está em "Prédios": ajude a escolher locais
- Se está em "Carrinho": ajude a finalizar a compra

## REGRAS IMPORTANTES
1. Só acesse dados do PRÓPRIO usuário logado
2. NUNCA exponha dados de outros clientes
3. Confirme antes de ações importantes
4. Se não souber, ofereça contato com suporte
5. Seja concisa mas completa
6. Use os dados reais retornados pelas ferramentas

## EXEMPLOS DE INTERAÇÃO

Usuário: "Tenho pedido ativo?"
Sofia: [Consulta pedidos] "Sim! Você tem 2 pedidos ativos. O primeiro está rodando no Edifício Aurora até 15 de março..."

Usuário: "Qual o status do meu vídeo?"
Sofia: [Consulta vídeos] "Seu vídeo 'Campanha Verão' está aprovado e exibindo. O vídeo 'Promoção Natal' está aguardando aprovação..."

Usuário: "Tenho pagamento pendente?"
Sofia: [Consulta faturas] "Sim, você tem uma parcela de R$ 500,00 vencendo dia 20. Quer que eu gere um PIX para pagamento?"`;


      // Client tools configuration (client-side tools only - webhook tools need to be configured via ElevenLabs dashboard)
      const tools = [
        {
          type: 'client',
          name: 'navegar_pagina',
          description: 'Navega para uma página do sistema',
          parameters: {
            type: 'object',
            properties: {
              destino: {
                type: 'string',
                enum: ['meus_pedidos', 'enviar_video', 'ver_predios', 'perfil', 'carrinho', 'suporte'],
                description: 'Página de destino',
              },
              pedido_id: {
                type: 'string',
                description: 'ID do pedido (opcional, para navegação específica)',
              },
            },
            required: ['destino'],
          },
        },
        {
          type: 'client',
          name: 'gerar_qrcode',
          description: 'Gera QR Code PIX para pagamento',
          parameters: {
            type: 'object',
            properties: {
              pedido_id: {
                type: 'string',
                description: 'ID do pedido para gerar o PIX',
              },
              valor: {
                type: 'number',
                description: 'Valor do pagamento',
              },
            },
            required: ['pedido_id'],
          },
        },
      ];

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
            model_id: 'eleven_turbo_v2_5',
            voice_id: 'XrExE9yKIg1WjnnlVkGX',
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
        agentResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
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
        throw new Error(`ElevenLabs API error: ${agentResponse.status} - ${errorText}`);
      }

      const agentData = await agentResponse.json();
      const newAgentId = agentData.agent_id || clientAgentId;

      console.log(`[${requestId}] ✅ Sofia Client Agent configured: ${newAgentId}`);

      return new Response(JSON.stringify({
        success: true,
        agent_id: newAgentId,
        message: clientAgentId ? 'Agent updated successfully' : 'Agent created successfully',
        action_required: !clientAgentId ? 
          `Add ELEVENLABS_CLIENT_AGENT_ID secret with value: ${newAgentId}` : 
          'No action required',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action. Use "status" or "configure"',
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
