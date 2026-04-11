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

// Determinar origem baseado no agent_key - CORRIGIDO
function getOrigemFromAgent(agentKey: string): string {
  switch (agentKey?.toLowerCase()) {
    case 'sofia':
      return 'conversa_whatsapp_sofia';
    case 'eduardo':
      return 'conversa_whatsapp_vendedor';
    case 'exa_alert':
      return 'conversa_whatsapp_exa_alert';
    case 'exa':
      return 'conversa_whatsapp_vendedor';
    case 'vendedor':
      return 'conversa_whatsapp_vendedor';
    default:
      return 'conversa_whatsapp_vendedor';
  }
}

// Calcular similaridade de strings (Levenshtein simplificado)
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  // Simple contains check
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return shorter.length / longer.length;
  }
  
  // Jaccard-like similarity for words
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
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
    const sourceFilter = body.source; // 'conversations', 'escalacoes', 'pedidos', 'lead_profiles', 'all'
    const detectDuplicates = body.detect_duplicates !== false; // Default true

    console.log('[SYNC-CONTACTS] 🚀 Starting unified contacts sync', { dryRun, sourceFilter, detectDuplicates });

    const stats = {
      conversations: { found: 0, created: 0, updated: 0, skipped: 0 },
      escalacoes: { found: 0, created: 0, updated: 0, skipped: 0 },
      pedidos: { found: 0, created: 0, updated: 0, skipped: 0 },
      lead_profiles: { found: 0, created: 0, updated: 0, skipped: 0 },
      duplicates: { detected: 0, groups: 0 },
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
              .select('id, agent_sources, metadata, origem')
              .eq('telefone', phoneNormalized)
              .maybeSingle();

            const origem = getOrigemFromAgent(conv.agent_key);
            const categoria = CONTACT_TYPE_TO_CATEGORIA[conv.contact_type || 'unknown'] || 'lead';

            if (existingContact) {
              // Atualizar contato existente - adicionar agent_source e corrigir origem
              const currentSources = existingContact.agent_sources || [];
              const newSources = [...new Set([...currentSources, conv.agent_key])];
              
              if (!dryRun) {
                await supabase
                  .from('contacts')
                  .update({
                    agent_sources: newSources,
                    conversation_id: conv.id,
                    last_interaction_at: conv.last_message_at,
                    origem: origem, // CORRIGIR ORIGEM
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

    // ========== 4. SINCRONIZAR LEAD_PROFILES ==========
    if (!sourceFilter || sourceFilter === 'all' || sourceFilter === 'lead_profiles') {
      console.log('[SYNC-CONTACTS] 👤 Processing lead_profiles...');
      
      const { data: leadProfiles, error: lpError } = await supabase
        .from('lead_profiles')
        .select(`
          id, 
          conversation_id,
          empresa_nome,
          bairro_interesse,
          segmento,
          intencao,
          is_hot_lead,
          hot_lead_score,
          probabilidade_fechamento,
          proximos_passos,
          orcamento_estimado,
          predio_nome,
          predio_tipo,
          created_at,
          updated_at
        `);

      if (lpError) {
        console.error('[SYNC-CONTACTS] ❌ Error fetching lead_profiles:', lpError);
      } else {
        stats.lead_profiles.found = leadProfiles?.length || 0;
        console.log(`[SYNC-CONTACTS] Found ${stats.lead_profiles.found} lead_profiles`);

        for (const lp of leadProfiles || []) {
          if (!lp.conversation_id) {
            stats.lead_profiles.skipped++;
            continue;
          }

          try {
            // Buscar a conversa para pegar o telefone
            const { data: conv } = await supabase
              .from('conversations')
              .select('contact_phone, contact_name')
              .eq('id', lp.conversation_id)
              .maybeSingle();

            if (!conv?.contact_phone) {
              stats.lead_profiles.skipped++;
              continue;
            }

            const phoneNormalized = normalizePhone(conv.contact_phone);
            if (!phoneNormalized || phoneNormalized.length < 10) {
              stats.lead_profiles.skipped++;
              continue;
            }

            const { data: existingContact } = await supabase
              .from('contacts')
              .select('id, metadata')
              .eq('telefone', phoneNormalized)
              .maybeSingle();

            if (existingContact) {
              // Atualizar com dados enriquecidos do lead_profile
              if (!dryRun) {
                await supabase
                  .from('contacts')
                  .update({
                    empresa: lp.empresa_nome || undefined,
                    bairro: lp.bairro_interesse || undefined,
                    segmento: lp.segmento || undefined,
                    temperatura: lp.is_hot_lead ? 'quente' : undefined,
                    updated_at: new Date().toISOString(),
                    metadata: {
                      ...existingContact.metadata,
                      lead_profile_id: lp.id,
                      intencao: lp.intencao,
                      hot_lead_score: lp.hot_lead_score,
                      probabilidade_fechamento: lp.probabilidade_fechamento,
                      proximos_passos: lp.proximos_passos,
                      orcamento_estimado: lp.orcamento_estimado,
                      predio_nome: lp.predio_nome,
                      predio_tipo: lp.predio_tipo,
                      migration_sources: [...(existingContact.metadata?.migration_sources || []), 'lead_profiles']
                    }
                  })
                  .eq('id', existingContact.id);
              }
              stats.lead_profiles.updated++;
            } else {
              // Criar novo contato do lead_profile
              if (!dryRun) {
                const { data: newContact } = await supabase
                  .from('contacts')
                  .insert({
                    nome: conv.contact_name || 'Lead Site',
                    telefone: phoneNormalized,
                    empresa: lp.empresa_nome,
                    bairro: lp.bairro_interesse,
                    segmento: lp.segmento,
                    categoria: 'lead',
                    origem: 'site_crm',
                    status: 'ativo',
                    bloqueado: false,
                    temperatura: lp.is_hot_lead ? 'quente' : 'morno',
                    conversation_id: lp.conversation_id,
                    metadata: {
                      auto_created: true,
                      source: 'sync_lead_profiles',
                      lead_profile_id: lp.id,
                      intencao: lp.intencao,
                      hot_lead_score: lp.hot_lead_score,
                      probabilidade_fechamento: lp.probabilidade_fechamento,
                      proximos_passos: lp.proximos_passos,
                      orcamento_estimado: lp.orcamento_estimado,
                      predio_nome: lp.predio_nome,
                      predio_tipo: lp.predio_tipo
                    }
                  })
                  .select()
                  .single();

                if (newContact) {
                  await supabase
                    .from('conversations')
                    .update({ contact_id: newContact.id })
                    .eq('id', lp.conversation_id);
                }
              }
              stats.lead_profiles.created++;
            }
          } catch (err) {
            console.error('[SYNC-CONTACTS] ❌ Error processing lead_profile:', lp.id, err);
            stats.total.errors++;
          }
        }
      }
    }

    // ========== 5. DETECTAR DUPLICADOS ==========
    if (detectDuplicates && !dryRun) {
      console.log('[SYNC-CONTACTS] 🔍 Detecting potential duplicates...');
      
      // Reset duplicates
      await supabase
        .from('contacts')
        .update({ is_potential_duplicate: false, duplicate_group_id: null })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      const { data: allContacts } = await supabase
        .from('contacts')
        .select('id, telefone, email, cnpj, empresa, nome')
        .eq('status', 'ativo');

      if (allContacts && allContacts.length > 0) {
        const duplicateGroups: Map<string, string[]> = new Map();
        const processed = new Set<string>();

        for (let i = 0; i < allContacts.length; i++) {
          const contact = allContacts[i];
          if (processed.has(contact.id)) continue;

          const duplicates: string[] = [contact.id];

          for (let j = i + 1; j < allContacts.length; j++) {
            const other = allContacts[j];
            if (processed.has(other.id)) continue;

            let isDuplicate = false;

            // Check phone similarity
            if (contact.telefone && other.telefone) {
              const phone1 = contact.telefone.slice(-8);
              const phone2 = other.telefone.slice(-8);
              if (phone1 === phone2) isDuplicate = true;
            }

            // Check email match
            if (!isDuplicate && contact.email && other.email) {
              if (contact.email.toLowerCase() === other.email.toLowerCase()) {
                isDuplicate = true;
              }
            }

            // Check CNPJ match
            if (!isDuplicate && contact.cnpj && other.cnpj) {
              const cnpj1 = contact.cnpj.replace(/\D/g, '');
              const cnpj2 = other.cnpj.replace(/\D/g, '');
              if (cnpj1 === cnpj2) isDuplicate = true;
            }

            // Check company name similarity
            if (!isDuplicate && contact.empresa && other.empresa) {
              const similarity = stringSimilarity(contact.empresa, other.empresa);
              if (similarity > 0.8) isDuplicate = true;
            }

            if (isDuplicate) {
              duplicates.push(other.id);
              processed.add(other.id);
            }
          }

          if (duplicates.length > 1) {
            const groupId = crypto.randomUUID();
            duplicateGroups.set(groupId, duplicates);
            duplicates.forEach(id => processed.add(id));
          }
        }

        // Mark duplicates in database
        for (const [groupId, ids] of duplicateGroups) {
          await supabase
            .from('contacts')
            .update({ 
              is_potential_duplicate: true, 
              duplicate_group_id: groupId 
            })
            .in('id', ids);

          stats.duplicates.detected += ids.length;
          stats.duplicates.groups++;
        }

        console.log(`[SYNC-CONTACTS] 🔍 Found ${stats.duplicates.groups} duplicate groups with ${stats.duplicates.detected} contacts`);
      }
    }

    // Calcular totais
    stats.total.created = stats.conversations.created + stats.escalacoes.created + stats.pedidos.created + stats.lead_profiles.created;
    stats.total.updated = stats.conversations.updated + stats.escalacoes.updated + stats.pedidos.updated + stats.lead_profiles.updated;
    stats.total.skipped = stats.conversations.skipped + stats.escalacoes.skipped + stats.pedidos.skipped + stats.lead_profiles.skipped;

    console.log('[SYNC-CONTACTS] ✅ Sync completed', stats);

    return new Response(JSON.stringify({
      success: true,
      dry_run: dryRun,
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[SYNC-CONTACTS] ❌ Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
