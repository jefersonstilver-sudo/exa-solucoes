import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZAPIConfig {
  instance_id?: string;
  token?: string;
}

interface ManyChatConfig {
  api_key?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentKey } = await req.json();
    console.log('🔍 [EDGE] Requisição recebida para agente:', agentKey);

    if (!agentKey) {
      console.error('❌ [EDGE] agentKey não fornecido');
      return new Response(
        JSON.stringify({ success: false, message: 'agentKey é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    console.log('🔐 [EDGE] Conectando ao Supabase:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configuração do agente
    console.log('📊 [EDGE] Buscando dados do agente no banco...');
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();
    
    console.log('📥 [EDGE] Resultado da query:', { agent, agentError });

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'offline',
          message: 'Agente não encontrado',
          credentialsPresent: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verificar provider
    const provider = agent.whatsapp_provider;
    console.log('🔌 [EDGE] Provider detectado:', provider);
    
    // Testar Z-API
    if (provider === 'zapi') {
      const zapiConfig = agent.zapi_config as ZAPIConfig;
      console.log('⚙️ [EDGE] Z-API Config:', {
        hasInstanceId: !!zapiConfig?.instance_id,
        hasToken: !!zapiConfig?.token,
        instanceId: zapiConfig?.instance_id?.substring(0, 8) + '...'
      });
      
      if (!zapiConfig?.instance_id || !zapiConfig?.token) {
        console.warn('⚠️ [EDGE] Credenciais Z-API ausentes');
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'pending',
            provider: 'zapi',
            message: 'Credenciais Z-API não configuradas',
            credentialsPresent: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se é PENDING_SETUP
      if (
        zapiConfig.instance_id === 'PENDING_SETUP' || 
        zapiConfig.token === 'PENDING_SETUP' ||
        zapiConfig.instance_id === 'PENDING' || 
        zapiConfig.token === 'PENDING'
      ) {
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'pending',
            provider: 'zapi',
            message: 'Configure as credenciais Z-API',
            credentialsPresent: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Testar endpoint Z-API (/me retorna status da instância)
      try {
        const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/me`;
        console.log('🌐 [EDGE] Chamando Z-API /me:', zapiUrl);
        
        const headers: Record<string, string> = {};
        
        // Adicionar Client-Token se estiver configurado
        if (zapiConfig.client_token) {
          headers['Client-Token'] = zapiConfig.client_token;
          console.log('🔐 [EDGE] Client-Token presente');
        } else {
          console.warn('⚠️ [EDGE] Client-Token NÃO configurado - isso pode causar erro 400');
        }
        
        const startTime = Date.now();
        const response = await fetch(zapiUrl, { headers });
        const latency = Date.now() - startTime;
        const data = await response.json();
        
        console.log('📡 [EDGE] Resposta Z-API:', {
          status: response.status,
          ok: response.ok,
          latency,
          connected: data.connected,
          paymentStatus: data.paymentStatus
        });

        if (!response.ok) {
          // Erro 400 ou 401 = credenciais inválidas
          const errorMsg = data.error || data.message || 'Erro desconhecido';
          let userMessage = 'Verifique as credenciais';
          
          if (errorMsg.includes('client-token is not configured')) {
            userMessage = '❌ CREDENCIAIS INVÁLIDAS: Instance ID ou Token incorretos. Verifique no painel Z-API';
          } else if (response.status === 401) {
            userMessage = '❌ TOKEN INVÁLIDO: Verifique o token no painel Z-API';
          } else if (response.status === 404) {
            userMessage = '❌ INSTÂNCIA NÃO ENCONTRADA: Verifique o Instance ID';
          }
          
          return new Response(
            JSON.stringify({ 
              success: false,
              status: 'offline',
              provider: 'zapi',
              message: userMessage,
              errorDetails: errorMsg,
              credentialsPresent: true,
              latency,
              httpStatus: response.status
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const instanceConnected = data.connected === true;

        return new Response(
          JSON.stringify({ 
            success: instanceConnected,
            status: instanceConnected ? 'online' : 'offline',
            provider: 'zapi',
            instanceStatus: instanceConnected ? 'connected' : 'disconnected',
            message: instanceConnected ? 'Conectado' : 'Instância desconectada - Escaneie o QR Code',
            credentialsPresent: true,
            latency,
            instanceId: zapiConfig.instance_id,
            paymentStatus: data.paymentStatus
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'offline',
            provider: 'zapi',
            message: `Erro ao conectar Z-API: ${error.message}`,
            credentialsPresent: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Testar ManyChat
    if (provider === 'manychat') {
      const manychatConfig = agent.manychat_config as ManyChatConfig;
      
      if (!manychatConfig?.api_key) {
        console.warn('⚠️ [EDGE] API Key ManyChat ausente');
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'pending',
            provider: 'manychat',
            message: 'API Key ManyChat não configurada',
            credentialsPresent: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // TESTE REAL DA API MANYCHAT
      try {
        const startTime = Date.now();
        
        // Endpoint para obter informações da página
        const manychatUrl = 'https://api.manychat.com/fb/page/getInfo';
        
        console.log('🔵 [EDGE] Testando ManyChat API:', manychatUrl);
        
        const response = await fetch(manychatUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${manychatConfig.api_key}`,
            'Content-Type': 'application/json'
          }
        });
        
        const latency = Date.now() - startTime;
        const data = await response.json();
        
        console.log('📡 [EDGE] Resposta ManyChat:', {
          status: response.status,
          ok: response.ok,
          latency,
          dataStatus: data.status
        });

        if (!response.ok || data.status !== 'success') {
          const errorMsg = data.message || 'Erro ao conectar com ManyChat';
          
          console.error('❌ [EDGE] Erro ManyChat:', errorMsg);
          
          // Atualizar status no banco
          await supabase
            .from('agents')
            .update({ 
              manychat_connected: false,
              manychat_config: {
                ...manychatConfig,
                status: 'error',
                last_check: new Date().toISOString()
              }
            })
            .eq('key', agentKey);
          
          return new Response(
            JSON.stringify({ 
              success: false,
              status: 'offline',
              provider: 'manychat',
              message: `❌ ERRO MANYCHAT: ${errorMsg}`,
              errorDetails: data,
              credentialsPresent: true,
              latency,
              httpStatus: response.status
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Atualizar status no banco
        await supabase
          .from('agents')
          .update({ 
            manychat_connected: true,
            manychat_config: {
              ...manychatConfig,
              status: 'connected',
              last_check: new Date().toISOString(),
              page_name: data.data?.name,
              page_id: data.data?.id
            }
          })
          .eq('key', agentKey);

        console.log('✅ [EDGE] ManyChat conectado com sucesso');

        return new Response(
          JSON.stringify({ 
            success: true,
            status: 'online',
            provider: 'manychat',
            message: 'ManyChat conectado com sucesso',
            credentialsPresent: true,
            latency,
            pageInfo: {
              id: data.data?.id,
              name: data.data?.name,
              timezone: data.data?.timezone
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error: any) {
        console.error('❌ [EDGE] Erro ao testar ManyChat:', error);
        
        return new Response(
          JSON.stringify({ 
            success: false,
            status: 'offline',
            provider: 'manychat',
            message: `Erro ao conectar ManyChat: ${error.message}`,
            credentialsPresent: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sem provider configurado
    return new Response(
      JSON.stringify({ 
        success: false,
        status: 'pending',
        provider: 'none',
        message: 'Nenhum provider configurado',
        credentialsPresent: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro ao testar agente:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        status: 'offline',
        message: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
