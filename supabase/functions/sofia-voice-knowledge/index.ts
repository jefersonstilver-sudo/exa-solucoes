import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { query_type, parameters } = await req.json();
    
    console.log('[sofia-voice-knowledge] Query type:', query_type);
    console.log('[sofia-voice-knowledge] Parameters:', parameters);

    let result: any = null;

    switch (query_type) {
      case 'conversation_stats':
        // Get conversation statistics
        const { data: conversationStats } = await supabase
          .from('conversations')
          .select('id, status, agent_key, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        result = {
          total_conversations_today: conversationStats?.length || 0,
          by_agent: conversationStats?.reduce((acc: any, conv: any) => {
            acc[conv.agent_key] = (acc[conv.agent_key] || 0) + 1;
            return acc;
          }, {}),
        };
        break;

      case 'agent_conversations':
        // Get conversations by agent (e.g., "eduardo", "sofia")
        const agentKey = parameters?.agent_key || 'eduardo';
        const { data: agentConversations } = await supabase
          .from('conversations')
          .select(`
            id,
            status,
            contact_id,
            created_at,
            contacts (
              name,
              phone
            )
          `)
          .eq('agent_key', agentKey)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(20);

        result = {
          agent: agentKey,
          conversations: agentConversations?.map((c: any) => ({
            id: c.id,
            status: c.status,
            contact_name: c.contacts?.name || 'Desconhecido',
            contact_phone: c.contacts?.phone,
            created_at: c.created_at,
          })),
        };
        break;

      case 'recent_alerts':
        // Get recent EXA alerts
        const { data: alerts } = await supabase
          .from('exa_alerts')
          .select('*')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        result = {
          total_alerts_today: alerts?.length || 0,
          alerts: alerts,
        };
        break;

      case 'panel_status':
        // Get panel online/offline status
        const { data: panels } = await supabase
          .from('painels')
          .select('id, nome, status, predio_nome, last_heartbeat');

        const onlinePanels = panels?.filter((p: any) => p.status === 'online') || [];
        const offlinePanels = panels?.filter((p: any) => p.status !== 'online') || [];

        result = {
          total_panels: panels?.length || 0,
          online: onlinePanels.length,
          offline: offlinePanels.length,
          offline_panels: offlinePanels.map((p: any) => ({
            nome: p.nome,
            predio: p.predio_nome,
            last_heartbeat: p.last_heartbeat,
          })),
        };
        break;

      case 'lead_stats':
        // Get lead qualification stats
        const { data: leads } = await supabase
          .from('lead_qualifications')
          .select('*')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        result = {
          total_leads_week: leads?.length || 0,
          qualified: leads?.filter((l: any) => l.qualified)?.length || 0,
          not_qualified: leads?.filter((l: any) => !l.qualified)?.length || 0,
        };
        break;

      case 'financial_metrics':
        // Get financial metrics
        const { data: orders } = await supabase
          .from('pedidos')
          .select('id, valor_total, status, created_at')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const paidOrders = orders?.filter((o: any) => 
          ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(o.status)
        ) || [];

        result = {
          total_orders_month: orders?.length || 0,
          paid_orders: paidOrders.length,
          total_revenue: paidOrders.reduce((sum: number, o: any) => sum + (o.valor_total || 0), 0),
        };
        break;

      case 'building_count':
        // Get building count
        const { count: buildingCount } = await supabase
          .from('buildings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ativo');

        result = {
          active_buildings: buildingCount || 0,
        };
        break;

      case 'search_contact':
        // Search for a contact by name
        const searchName = parameters?.name || '';
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, name, phone, email, created_at')
          .ilike('name', `%${searchName}%`)
          .limit(5);

        result = {
          contacts: contacts,
        };
        break;

      case 'recent_messages':
        // Get recent messages from a specific agent
        const msgAgentKey = parameters?.agent_key || 'eduardo';
        const { data: messages } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            direction,
            created_at,
            conversations (
              contact_id,
              contacts (
                name
              )
            )
          `)
          .eq('agent_key', msgAgentKey)
          .order('created_at', { ascending: false })
          .limit(20);

        result = {
          messages: messages?.map((m: any) => ({
            content: m.content?.substring(0, 200),
            direction: m.direction,
            contact: m.conversations?.contacts?.name,
            created_at: m.created_at,
          })),
        };
        break;

      default:
        result = {
          error: 'Unknown query type',
          available_queries: [
            'conversation_stats',
            'agent_conversations',
            'recent_alerts',
            'panel_status',
            'lead_stats',
            'financial_metrics',
            'building_count',
            'search_contact',
            'recent_messages',
          ],
        };
    }

    console.log('[sofia-voice-knowledge] Result:', JSON.stringify(result).substring(0, 500));

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[sofia-voice-knowledge] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
