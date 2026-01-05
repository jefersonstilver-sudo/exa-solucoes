import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento de contact_type (CRM) para categoria (Contatos)
const CONTACT_TYPE_TO_CATEGORIA: Record<string, string> = {
  'sindico': 'sindico_exa',
  'sindico_lead': 'sindico_lead',
  'cliente_ativo': 'anunciante',
  'lead': 'lead',
  'eletricista': 'eletricista',
  'equipe_exa': 'equipe_exa',
  'outros_prestadores': 'prestador_elevador',
  'provedor': 'provedor',
  'unknown': 'lead'
};

// Normalizar telefone
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

// Determinar origem baseado no agent_key
function getOrigemFromAgent(agentKey: string): string {
  switch (agentKey) {
    case 'sofia':
      return 'conversa_whatsapp_sofia';
    case 'eduardo':
      return 'conversa_whatsapp_vendedor';
    case 'exa_alert':
      return 'conversa_whatsapp_sofia'; // EXA Alert também via Sofia
    default:
      return 'conversa_whatsapp_sofia';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const sourceFilter = body.source; // 'conversations', 'escalacoes', 'pedidos', 'all'

    console.log('[SYNC-CONTACTS] 🚀 Starting unified contacts sync', { dryRun, sourceFilter });

    const stats = {
      conversations: { found: 0, created: 0, updated: 0, skipped: 0 },
      escalacoes: { found: 0, created: 0, updated: 0, skipped: 0 },
      pedidos: { found: 0, created: 0, updated: 0, skipped: 0 },
      total: { created: 0, updated: 0, skipped: 0, errors: 0 }
    };

    // ========== 1. SINCRONIZAR CONVERSATIONS ==========
    if (!sourceFilter || sourceFilter === 'all' || sourceFilter === 'conversations') {
      console.log('[SYNC-CONTACTS] 📱 Processing conversations...');
      
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, contact_phone, contact_name, agent_key, contact_type, last_message_at, lead_score, is_hot_lead, metadata')
        .not('contact_phone', 'is', null)
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('[SYNC-CONTACTS] ❌ Error fetching conversations:', convError);
      } else {
        stats.conversations.found = conversations?.length || 0;
        console.log(`[SYNC-CONTACTS] Found ${stats.conversations.found} conversations`);

        for (const conv of conversations || []) {
          const phoneNormalized = normalizePhone(conv.contact_phone);
          if (!phoneNormalized || phoneNormalized.length < 10) {
            stats.conversations.skipped++;
            continue;
          }

          try {
            // Verificar se contato já existe
            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id, agent_sources, metadata')
              .eq('telefone', phoneNormalized)
              .maybeSingle();

            const origem = getOrigemFromAgent(conv.agent_key);
            const categoria = CONTACT_TYPE_TO_CATEGORIA[conv.contact_type || 'unknown'] || 'lead';

            if (existingContact) {
              // Atualizar contato existente - adicionar agent_source
              const currentSources = existingContact.agent_sources || [];
              const newSources = [...new Set([...currentSources, conv.agent_key])];
              
              if (!dryRun) {
                await supabase
                  .from('contacts')
                  .update({
                    agent_sources: newSources,
                    conversation_id: conv.id,
                    last_interaction_at: conv.last_message_at,
                    updated_at: new Date().toISOString(),
                    metadata: {
                      ...existingContact.metadata,
                      lead_score: conv.lead_score,
                      is_hot_lead: conv.is_hot_lead,
                      migration_updated: true,
                      migration_sources: [...(existingContact.metadata?.migration_sources || []), 'conversations']
                    }
                  })
                  .eq('id', existingContact.id);

                // Linkar conversation ao contato
                await supabase
                  .from('conversations')
                  .update({ contact_id: existingContact.id })
                  .eq('id', conv.id);
              }
              stats.conversations.updated++;
            } else {
              // Criar novo contato
              if (!dryRun) {
                const { data: newContact, error: insertError } = await supabase
                  .from('contacts')
                  .insert({
                    nome: conv.contact_name || 'Contato WhatsApp',
                    telefone: phoneNormalized,
                    categoria,
                    origem,
                    status: 'ativo',
                    bloqueado: false,
                    conversation_id: conv.id,
                    agent_sources: [conv.agent_key],
                    last_interaction_at: conv.last_message_at,
                    metadata: {
                      auto_created: true,
                      source: 'sync_conversations',
                      original_conversation_id: conv.id,
                      lead_score: conv.lead_score,
                      is_hot_lead: conv.is_hot_lead
                    }
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error('[SYNC-CONTACTS] ❌ Error creating contact:', insertError);
                  stats.total.errors++;
                  continue;
                }

                // Linkar conversation ao contato
                if (newContact) {
                  await supabase
                    .from('conversations')
                    .update({ contact_id: newContact.id })
                    .eq('id', conv.id);
                }
              }
              stats.conversations.created++;
            }
          } catch (err) {
            console.error('[SYNC-CONTACTS] ❌ Error processing conversation:', conv.id, err);
            stats.total.errors++;
          }
        }
      }
    }

    // ========== 2. SINCRONIZAR ESCALACOES COMERCIAIS ==========
    if (!sourceFilter || sourceFilter === 'all' || sourceFilter === 'escalacoes') {
      console.log('[SYNC-CONTACTS] 📋 Processing escalacoes comerciais...');
      
      const { data: escalacoes, error: escError } = await supabase
        .from('escalacoes_comerciais')
        .select('id, phone_number, lead_name, lead_summary, conversation_id, status, created_at')
        .not('phone_number', 'is', null);

      if (escError) {
        console.error('[SYNC-CONTACTS] ❌ Error fetching escalacoes:', escError);
      } else {
        stats.escalacoes.found = escalacoes?.length || 0;
        console.log(`[SYNC-CONTACTS] Found ${stats.escalacoes.found} escalacoes`);

        for (const esc of escalacoes || []) {
          const phoneNormalized = normalizePhone(esc.phone_number);
          if (!phoneNormalized || phoneNormalized.length < 10) {
            stats.escalacoes.skipped++;
            continue;
          }

          try {
            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id, metadata, observacoes_estrategicas')
              .eq('telefone', phoneNormalized)
              .maybeSingle();

            if (existingContact) {
              // Atualizar com dados da escalação
              if (!dryRun) {
                const newObs = existingContact.observacoes_estrategicas
                  ? `${existingContact.observacoes_estrategicas}\n\n[Escalação]: ${esc.lead_summary || ''}`
                  : esc.lead_summary || '';

                await supabase
                  .from('contacts')
                  .update({
                    observacoes_estrategicas: newObs.substring(0, 2000),
                    updated_at: new Date().toISOString(),
                    metadata: {
                      ...existingContact.metadata,
                      has_escalation: true,
                      escalation_status: esc.status
                    }
                  })
                  .eq('id', existingContact.id);
              }
              stats.escalacoes.updated++;
            } else {
              // Criar novo contato da escalação
              if (!dryRun) {
                await supabase
                  .from('contacts')
                  .insert({
                    nome: esc.lead_name || 'Lead Escalação',
                    telefone: phoneNormalized,
                    categoria: 'lead',
                    origem: 'proposta',
                    status: 'ativo',
                    bloqueado: false,
                    temperatura: 'quente',
                    conversation_id: esc.conversation_id,
                    observacoes_estrategicas: esc.lead_summary,
                    metadata: {
                      auto_created: true,
                      source: 'sync_escalacoes',
                      escalation_id: esc.id,
                      escalation_status: esc.status
                    }
                  });
              }
              stats.escalacoes.created++;
            }
          } catch (err) {
            console.error('[SYNC-CONTACTS] ❌ Error processing escalacao:', esc.id, err);
            stats.total.errors++;
          }
        }
      }
    }

    // ========== 3. SINCRONIZAR PEDIDOS ==========
    if (!sourceFilter || sourceFilter === 'all' || sourceFilter === 'pedidos') {
      console.log('[SYNC-CONTACTS] 📦 Processing pedidos...');
      
      const { data: pedidos, error: pedError } = await supabase
        .from('pedidos')
        .select('id, client_id, client_nome, client_telefone, client_email, client_whatsapp, status, created_at')
        .not('client_telefone', 'is', null);

      if (pedError) {
        console.error('[SYNC-CONTACTS] ❌ Error fetching pedidos:', pedError);
      } else {
        stats.pedidos.found = pedidos?.length || 0;
        console.log(`[SYNC-CONTACTS] Found ${stats.pedidos.found} pedidos`);

        for (const pedido of pedidos || []) {
          const phoneNormalized = normalizePhone(pedido.client_telefone || pedido.client_whatsapp);
          if (!phoneNormalized || phoneNormalized.length < 10) {
            stats.pedidos.skipped++;
            continue;
          }

          try {
            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id, metadata, total_investido')
              .eq('telefone', phoneNormalized)
              .maybeSingle();

            if (existingContact) {
              // Atualizar - marcar como anunciante se teve pedido
              if (!dryRun) {
                await supabase
                  .from('contacts')
                  .update({
                    categoria: 'anunciante',
                    email: pedido.client_email || undefined,
                    updated_at: new Date().toISOString(),
                    metadata: {
                      ...existingContact.metadata,
                      has_orders: true,
                      last_order_status: pedido.status,
                      migration_sources: [...(existingContact.metadata?.migration_sources || []), 'pedidos']
                    }
                  })
                  .eq('id', existingContact.id);
              }
              stats.pedidos.updated++;
            } else {
              // Criar novo contato do pedido
              if (!dryRun) {
                await supabase
                  .from('contacts')
                  .insert({
                    nome: pedido.client_nome || 'Cliente Pedido',
                    telefone: phoneNormalized,
                    email: pedido.client_email,
                    categoria: 'anunciante',
                    origem: 'pedido_criado',
                    status: 'ativo',
                    bloqueado: false,
                    metadata: {
                      auto_created: true,
                      source: 'sync_pedidos',
                      pedido_id: pedido.id,
                      pedido_status: pedido.status,
                      client_id: pedido.client_id
                    }
                  });
              }
              stats.pedidos.created++;
            }
          } catch (err) {
            console.error('[SYNC-CONTACTS] ❌ Error processing pedido:', pedido.id, err);
            stats.total.errors++;
          }
        }
      }
    }

    // Calcular totais
    stats.total.created = stats.conversations.created + stats.escalacoes.created + stats.pedidos.created;
    stats.total.updated = stats.conversations.updated + stats.escalacoes.updated + stats.pedidos.updated;
    stats.total.skipped = stats.conversations.skipped + stats.escalacoes.skipped + stats.pedidos.skipped;

    console.log('[SYNC-CONTACTS] ✅ Sync completed:', stats);

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRun,
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYNC-CONTACTS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
