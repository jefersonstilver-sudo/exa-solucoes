import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with service role for full access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Format time ago
const timeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} minutos atrás`;
  if (diffHours < 24) return `${diffHours} horas atrás`;
  return `${diffDays} dias atrás`;
};

// Format seconds to readable time
const formatSeconds = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// ==================== VOICE TRUNCATION ====================
const MAX_VOICE_RESPONSE_LENGTH = 3500;

// Truncar resposta para voz (evitar corte do ElevenLabs)
function truncateForVoice(text: string): string {
  if (text.length <= MAX_VOICE_RESPONSE_LENGTH) return text;
  
  const truncated = text.substring(0, MAX_VOICE_RESPONSE_LENGTH);
  const lastBreak = Math.max(
    truncated.lastIndexOf('\n'),
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );
  
  if (lastBreak > MAX_VOICE_RESPONSE_LENGTH * 0.7) {
    return truncated.substring(0, lastBreak + 1) + ' Quer mais detalhes?';
  }
  
  return truncated + '... Quer que eu continue?';
}

// Get emoji for proposal status
const getProposalStatusEmoji = (proposal: any): string => {
  if (proposal.is_viewing) return '🔴';
  if (proposal.converted_order_id) return '✅';
  if (proposal.rejection_reason) return '❌';
  if (proposal.view_count > 0) return '👁️';
  if (proposal.status === 'enviada') return '📤';
  return '📋';
};

// Get emoji for proposal log action
const getProposalActionEmoji = (action: string): string => {
  const emojis: Record<string, string> = {
    'criada': '📝',
    'created': '📝',
    'enviada_whatsapp': '📱',
    'enviada_email': '📧',
    'sent_whatsapp': '📱',
    'sent_email': '📧',
    'visualizada': '👁️',
    'viewed': '👁️',
    'visualizando': '🔴',
    'viewing': '🔴',
    'view_started': '🔴',
    'view_ended': '⚪',
    'notification_sent': '🔔',
    'pagamento_alterado': '💳',
    'payment_changed': '💳',
    'aceita': '✅',
    'accepted': '✅',
    'rejeitada': '❌',
    'rejected': '❌',
    'atualizada': '🔄',
    'updated': '🔄',
    'expirada': '⏰',
    'expired': '⏰'
  };
  return emojis[action] || '📌';
};

// ==================== INTENT HANDLERS ====================

// Overview - Visão geral completa do sistema
async function handleOverview(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting system overview...');
  
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  
  // Parallel queries for speed - CORRIGIDO: usa ultima_sync e status dos painéis
  const [
    buildingsResult,
    panelsResult,
    ordersResult,
    leadsResult,
    conversationsResult,
    alertsResult,
    proposalsResult
  ] = await Promise.all([
    supabase.from('buildings').select('id, status').eq('status', 'ativo'),
    supabase.from('painels').select('id, status, ultima_sync'),
    supabase.from('pedidos').select('id, status, valor_total, created_at').gte('created_at', `${thisMonth}-01`),
    supabase.from('leads_exa').select('id, status, created_at').gte('created_at', `${thisMonth}-01`),
    supabase.from('conversations').select('id, last_message_at').gte('last_message_at', today),
    supabase.from('panel_alerts').select('id, severity').eq('resolved', false),
    supabase.from('proposals').select('id, status, is_viewing, view_count, converted_order_id')
  ]);

  const buildings = buildingsResult.data || [];
  const panels = panelsResult.data || [];
  const orders = ordersResult.data || [];
  const leads = leadsResult.data || [];
  const conversations = conversationsResult.data || [];
  const alerts = alertsResult.data || [];
  const proposals = proposalsResult.data || [];

  // CORRIGIDO: Usar status diretamente OU ultima_sync
  const onlinePanels = panels.filter(p => {
    // Primeiro verifica se status já é 'online'
    if (p.status === 'online') return true;
    // Depois verifica ultima_sync (não last_heartbeat)
    if (!p.ultima_sync) return false;
    const lastSync = new Date(p.ultima_sync);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSync > fiveMinutesAgo;
  });

  const totalRevenue = orders
    .filter(o => ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(o.status))
    .reduce((sum, o) => sum + (o.valor_total || 0), 0);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  
  // Propostas quentes (sendo visualizadas agora)
  const hotProposals = proposals.filter(p => p.is_viewing);
  const pendingProposals = proposals.filter(p => !p.converted_order_id && p.status !== 'rejeitada');
  const convertedProposals = proposals.filter(p => p.converted_order_id);

  const data = {
    buildings: buildings.length,
    panels: { total: panels.length, online: onlinePanels.length },
    monthlyRevenue: totalRevenue,
    monthlyOrders: orders.length,
    monthlyLeads: leads.length,
    todayConversations: conversations.length,
    criticalAlerts,
    proposals: {
      total: proposals.length,
      hot: hotProposals.length,
      pending: pendingProposals.length,
      converted: convertedProposals.length
    }
  };

  let text = `Visão geral do sistema: Temos ${buildings.length} prédios ativos, ${onlinePanels.length} de ${panels.length} painéis online. Este mês: faturamento de ${formatCurrency(totalRevenue)}, ${orders.length} pedidos e ${leads.length} leads. Hoje tivemos ${conversations.length} conversas.`;
  
  // Adicionar info de propostas quentes
  if (hotProposals.length > 0) {
    text += ` 🔴 ${hotProposals.length} proposta(s) sendo visualizada(s) AGORA!`;
  }
  
  text += ` Propostas: ${pendingProposals.length} pendentes, ${convertedProposals.length} convertidas em pedido.`;
  
  if (criticalAlerts > 0) {
    text += ` ⚠️ Atenção: ${criticalAlerts} alertas críticos ativos.`;
  }

  return { text, data };
}

// Query Buildings - Consultar prédios
async function handleQueryBuildings(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Querying buildings...', params);
  
  let query = supabase.from('buildings').select(`
    id, nome, endereco, bairro, status, preco_base, 
    numero_unidades, numero_andares, numero_elevadores,
    publico_estimado, visualizacoes_mes
  `);

  if (params?.bairro) {
    query = query.ilike('bairro', `%${params.bairro}%`);
  }
  if (params?.status) {
    query = query.eq('status', params.status);
  } else {
    query = query.in('status', ['ativo', 'instalação', 'instalacao']);
  }
  if (params?.min_price) {
    query = query.gte('preco_base', params.min_price);
  }
  if (params?.max_price) {
    query = query.lte('preco_base', params.max_price);
  }

  const { data: buildings, error } = await query.order('preco_base', { ascending: false }).limit(10);

  if (error || !buildings?.length) {
    return { text: 'Não encontrei prédios com esses critérios.', data: [] };
  }

  const buildingsList = buildings.map(b => 
    `${b.nome} no ${b.bairro}: ${b.numero_andares || 0} andares, ${b.numero_unidades || 0} unidades, ${formatCurrency(b.preco_base || 0)}/mês`
  ).join('. ');

  const text = `Encontrei ${buildings.length} prédios. ${buildingsList}`;

  return { text, data: buildings };
}

// Building Details - Detalhes completos de um prédio (incluindo contatos)
async function handleBuildingDetails(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting building details...', params);

  let query = supabase.from('buildings').select('*');

  if (params?.building_id) {
    query = query.eq('id', params.building_id);
  } else if (params?.nome) {
    query = query.ilike('nome', `%${params.nome}%`);
  } else {
    return { text: 'Preciso do nome ou ID do prédio.', data: null };
  }

  const { data: buildings, error } = await query.limit(1);

  if (error || !buildings?.length) {
    return { text: 'Prédio não encontrado.', data: null };
  }

  const b = buildings[0];
  
  const text = `${b.nome}, localizado em ${b.endereco}, ${b.bairro}. Status: ${b.status}. ` +
    `Tem ${b.numero_andares || 0} andares, ${b.numero_blocos || 1} blocos, ${b.numero_unidades || 0} unidades e ${b.numero_elevadores || 0} elevadores. ` +
    `Público estimado: ${b.publico_estimado || 0} pessoas. Preço base: ${formatCurrency(b.preco_base || 0)}/mês. ` +
    (b.nome_sindico ? `Síndico: ${b.nome_sindico}, telefone: ${b.contato_sindico || 'não informado'}. ` : '') +
    (b.nome_contato_predio ? `Contato do prédio: ${b.nome_contato_predio}, telefone: ${b.numero_contato_predio || 'não informado'}.` : '');

  return { text, data: b };
}

// Panel Status - Status dos painéis (CORRIGIDO COM CAMPOS CORRETOS)
async function handlePanelStatus(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting panel status...');

  const { data: panels, error } = await supabase
    .from('painels')
    .select(`
      id, code, status, ultima_sync, ip_interno, building_id,
      buildings(nome, bairro)
    `)
    .order('ultima_sync', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error('[Sofia JARVIS] Panel query error:', error);
    return { text: `Erro ao buscar painéis: ${error.message}`, data: [] };
  }

  if (!panels?.length) {
    return { text: 'Não encontrei informações de painéis.', data: [] };
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const online = panels.filter(p => p.ultima_sync && new Date(p.ultima_sync) > fiveMinutesAgo);
  const offline = panels.filter(p => !p.ultima_sync || new Date(p.ultima_sync) <= fiveMinutesAgo);
  const waitingCode = panels.filter(p => !p.code || p.code === '');

  let text = `Temos ${panels.length} painéis. ${online.length} online, ${offline.length} offline. `;
  
  if (waitingCode.length > 0) {
    text += `${waitingCode.length} aguardando código. `;
  }

  if (offline.length > 0 && offline.length <= 5) {
    const offlineList = offline.map(p => {
      const building = (p.buildings as any);
      return `${p.code || 'sem-código'} (${building?.nome || 'sem prédio'})`;
    }).join(', ');
    text += `Offline: ${offlineList}. `;
  } else if (offline.length > 5) {
    text += `Há ${offline.length} painéis offline. `;
  }

  // Lista dos online para contexto
  if (online.length > 0 && online.length <= 10) {
    const onlineList = online.slice(0, 5).map(p => {
      const building = (p.buildings as any);
      return `${p.code || 'sem-código'} (${building?.nome || 'N/A'})`;
    }).join(', ');
    text += `Online: ${onlineList}${online.length > 5 ? '...' : ''}. `;
  }

  return { 
    text, 
    data: { 
      total: panels.length, 
      online: online.length, 
      offline: offline.length, 
      waitingCode: waitingCode.length,
      panels 
    } 
  };
}

// Sales Metrics - Métricas de vendas
async function handleSalesMetrics(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting sales metrics...', params);

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())).toISOString();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const period = params?.period || 'month';
  let startDate = startOfMonth;
  if (period === 'today') startDate = startOfDay;
  if (period === 'week') startDate = startOfWeek;

  const { data: orders, error } = await supabase
    .from('pedidos')
    .select('id, status, valor_total, created_at, plano_meses')
    .gte('created_at', startDate)
    .order('created_at', { ascending: false });

  if (error || !orders?.length) {
    return { text: `Sem pedidos ${period === 'today' ? 'hoje' : period === 'week' ? 'esta semana' : 'este mês'}.`, data: {} };
  }

  const paidStatuses = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'];
  const paidOrders = orders.filter(o => paidStatuses.includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'pendente');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.valor_total || 0), 0);

  const periodLabel = period === 'today' ? 'Hoje' : period === 'week' ? 'Esta semana' : 'Este mês';
  
  const text = `${periodLabel}: ${orders.length} pedidos no total. ` +
    `${paidOrders.length} pagos totalizando ${formatCurrency(totalRevenue)}. ` +
    `${pendingOrders.length} pendentes totalizando ${formatCurrency(pendingRevenue)}.`;

  return { text, data: { total: orders.length, paid: paidOrders.length, pending: pendingOrders.length, totalRevenue, pendingRevenue } };
}

// Read Conversation - Ler mensagens de uma conversa
async function handleReadConversation(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Reading conversation...', params);

  let conversationId = params?.conversation_id;

  // If no ID, try to find by contact name
  if (!conversationId && params?.contact_name) {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, contact_name, phone')
      .ilike('contact_name', `%${params.contact_name}%`)
      .order('last_message_at', { ascending: false })
      .limit(1);

    if (conversations?.length) {
      conversationId = conversations[0].id;
    }
  }

  if (!conversationId) {
    return { text: 'Não encontrei a conversa. Informe o nome do contato ou ID.', data: null };
  }

  // Get conversation with messages
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, contact_name, phone, agent_key, status, last_message_at')
    .eq('id', conversationId)
    .single();

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, direction, message_type, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(params?.limit || 10);

  if (!conversation || !messages?.length) {
    return { text: 'Conversa não encontrada ou sem mensagens.', data: null };
  }

  const msgSummary = messages.map(m => 
    `${m.direction === 'inbound' ? conversation.contact_name : 'Nós'}: ${m.content?.substring(0, 100) || '[mídia]'}`
  ).reverse().join(' | ');

  const text = `Conversa com ${conversation.contact_name} (${conversation.phone}), agente ${conversation.agent_key}. ` +
    `Última mensagem: ${timeAgo(conversation.last_message_at)}. ` +
    `Últimas ${messages.length} mensagens: ${msgSummary}`;

  return { text, data: { conversation, messages } };
}

// Agent Conversations - Conversas de um agente específico
async function handleAgentConversations(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting agent conversations...', params);

  const agentKey = params?.agent_key || params?.agent || 'eduardo';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // First get conversations without inner join to avoid filtering issues
  let query = supabase
    .from('conversations')
    .select(`
      id, contact_name, contact_phone, status, last_message_at, awaiting_response, agent_key
    `)
    .eq('agent_key', agentKey)
    .order('last_message_at', { ascending: false })
    .limit(20);

  // Filter by today if requested
  if (params?.period === 'today' || params?.today) {
    query = query.gte('last_message_at', todayISO);
  }

  const { data: conversations, error } = await query;

  console.log('[Sofia JARVIS] Agent conversations result:', { 
    agentKey, 
    count: conversations?.length || 0, 
    error: error?.message 
  });

  if (error) {
    return { text: `Erro ao buscar conversas: ${error.message}`, data: [] };
  }

  if (!conversations?.length) {
    return { text: `${agentKey} não tem conversas ${params?.period === 'today' ? 'hoje' : 'recentes'}.`, data: [] };
  }

  const awaitingResponse = conversations.filter(c => c.awaiting_response).length;
  
  const convList = conversations.slice(0, 5).map(c => {
    return `${c.contact_name} (${c.contact_phone || 'sem telefone'}) - ${timeAgo(c.last_message_at)}`;
  }).join('. ');

  const text = `${agentKey} tem ${conversations.length} conversas${params?.period === 'today' ? ' hoje' : ''}. ` +
    `${awaitingResponse} aguardando resposta. Últimas: ${convList}`;

  return { text, data: { total: conversations.length, awaitingResponse, conversations } };
}

// Search Conversations - Buscar conversas por termo
async function handleSearchConversations(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Searching conversations...', params);

  const searchTerm = params?.query || params?.name || params?.search;
  
  if (!searchTerm) {
    return { text: 'Informe o termo de busca (nome ou telefone).', data: [] };
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, contact_name, contact_phone, agent_key, status, last_message_at, awaiting_response')
    .or(`contact_name.ilike.%${searchTerm}%,contact_phone.ilike.%${searchTerm}%`)
    .order('last_message_at', { ascending: false })
    .limit(10);

  console.log('[Sofia JARVIS] Search result:', { searchTerm, count: conversations?.length || 0, error: error?.message });

  if (!conversations?.length) {
    return { text: `Não encontrei conversas com "${searchTerm}".`, data: [] };
  }

  const list = conversations.map(c => 
    `${c.contact_name} (${c.contact_phone || 'sem tel'}) - ${c.agent_key}, ${c.awaiting_response ? 'aguardando' : c.status}, ${timeAgo(c.last_message_at)}`
  ).join('. ');

  return { text: `Encontrei ${conversations.length} conversas para "${searchTerm}". ${list}`, data: conversations };
}

// Get Contracts - Listar CONTRATOS LEGAIS (documentos de assinatura)
// IMPORTANTE: Contrato ≠ Proposta. Contrato é gerado APÓS pagamento do pedido.
async function handleGetContracts(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting legal contracts (contratos_legais)...', params);

  let query = supabase
    .from('contratos_legais')
    .select(`
      id, numero_contrato, status, cliente_nome, cliente_email, 
      valor_total, proposta_id, pedido_id,
      enviado_em, visualizado_em, assinado_em, cancelado_em, created_at
    `)
    .order('created_at', { ascending: false })
    .limit(15);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data: contracts, error } = await query;

  if (error) {
    console.error('[Sofia JARVIS] Contract query error:', error);
    return { text: `Erro ao buscar contratos: ${error.message}`, data: [] };
  }

  if (!contracts?.length) {
    return { text: 'Não há contratos legais cadastrados. Contratos são gerados após pagamento de pedidos.', data: [] };
  }

  // Estatísticas por status
  const stats = {
    total: contracts.length,
    pendente: contracts.filter(c => c.status === 'pendente' || c.status === 'rascunho').length,
    enviado: contracts.filter(c => c.status === 'enviado').length,
    visualizado: contracts.filter(c => c.status === 'visualizado' || c.visualizado_em).length,
    assinado: contracts.filter(c => c.status === 'assinado' || c.assinado_em).length,
    cancelado: contracts.filter(c => c.status === 'cancelado' || c.cancelado_em).length,
    comProposta: contracts.filter(c => c.proposta_id).length,
    comPedido: contracts.filter(c => c.pedido_id).length
  };

  const list = contracts.slice(0, 5).map(c => {
    const emoji = c.assinado_em ? '✅' : c.visualizado_em ? '👁️' : c.enviado_em ? '📤' : '📝';
    return `${emoji} ${c.numero_contrato || c.id.substring(0,8)}: ${c.cliente_nome || 'N/A'} - ${c.status} - ${formatCurrency(c.valor_total || 0)}`;
  }).join('. ');

  const text = `📄 CONTRATOS LEGAIS (documentos de assinatura):
Total: ${stats.total} | Pendentes: ${stats.pendente} | Enviados: ${stats.enviado}
✅ Assinados: ${stats.assinado} | ❌ Cancelados: ${stats.cancelado}
🔗 ${stats.comProposta} vieram de proposta, ${stats.comPedido} de pedido.

Últimos: ${list}

⚠️ IMPORTANTE: Contrato Legal é diferente de Proposta. Proposta vira Pedido (pagamento), Pedido gera Contrato para assinatura.`;

  return { text, data: { stats, contracts } };
}

// ==================== NOVO: Explicar Fluxo Proposta → Pedido → Contrato ====================
async function handleExplicarFluxo(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Explaining proposal → order → contract flow...');
  
  // Contar cada entidade em paralelo
  const [proposalsResult, pedidosResult, contratosResult] = await Promise.all([
    supabase.from('proposals').select('id, status, converted_order_id, is_viewing, view_count').limit(500),
    supabase.from('pedidos').select('id, status, valor_total').limit(500),
    supabase.from('contratos_legais').select('id, status, proposta_id, pedido_id, assinado_em').limit(500)
  ]);

  const propostas = proposalsResult.data || [];
  const pedidos = pedidosResult.data || [];
  const contratos = contratosResult.data || [];

  const stats = {
    propostas: {
      total: propostas.length,
      naoAbertas: propostas.filter(p => (p.view_count || 0) === 0).length,
      visualizandoAgora: propostas.filter(p => p.is_viewing).length,
      convertidas: propostas.filter(p => p.converted_order_id).length
    },
    pedidos: {
      total: pedidos.length,
      pagos: pedidos.filter(p => ['pago', 'ativo', 'video_aprovado'].includes(p.status)).length,
      pendentes: pedidos.filter(p => p.status === 'pendente').length,
      valorTotal: pedidos.reduce((sum, p) => sum + (p.valor_total || 0), 0)
    },
    contratos: {
      total: contratos.length,
      assinados: contratos.filter(c => c.status === 'assinado' || c.assinado_em).length,
      deProposta: contratos.filter(c => c.proposta_id).length,
      dePedido: contratos.filter(c => c.pedido_id).length
    }
  };

  const text = `📊 FLUXO DO SISTEMA EXA:

1️⃣ PROPOSTA → É uma OFERTA enviada ao cliente. Ele pode visualizar, mas NÃO é venda!
   📋 Você tem ${stats.propostas.total} propostas
   📭 ${stats.propostas.naoAbertas} nunca foram abertas
   🔴 ${stats.propostas.visualizandoAgora} sendo vistas AGORA
   ✅ ${stats.propostas.convertidas} converteram em pedido

2️⃣ PEDIDO → Quando o cliente PAGA a proposta, ela vira PEDIDO. É uma VENDA confirmada!
   🛒 Você tem ${stats.pedidos.total} pedidos
   ✅ ${stats.pedidos.pagos} pagos/ativos
   ⏳ ${stats.pedidos.pendentes} aguardando pagamento
   💰 Valor total: ${formatCurrency(stats.pedidos.valorTotal)}

3️⃣ CONTRATO LEGAL → Documento formal gerado para ASSINATURA após o pagamento.
   📄 Você tem ${stats.contratos.total} contratos
   ✅ ${stats.contratos.assinados} assinados
   🔗 ${stats.contratos.deProposta} vieram de proposta

⚠️ RESUMO: Proposta visualizada NÃO é venda! Só conta como venda quando vira PEDIDO PAGO.`;

  return { text, data: stats };
}

// ==================== NOVO: Propostas que geraram Contrato ====================
async function handlePropostaComContrato(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting proposals with contracts...');
  
  // Buscar contratos que têm proposta vinculada
  const { data: contratos, error } = await supabase
    .from('contratos_legais')
    .select(`
      id, numero_contrato, status, cliente_nome, proposta_id,
      valor_total, assinado_em, enviado_em, created_at
    `)
    .not('proposta_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return { text: `Erro ao buscar contratos: ${error.message}`, data: [] };
  }

  if (!contratos?.length) {
    return { text: 'Nenhuma proposta gerou contrato ainda. Contratos são criados após pagamento do pedido.', data: [] };
  }

  const assinados = contratos.filter(c => c.status === 'assinado' || c.assinado_em).length;
  const enviados = contratos.filter(c => c.status === 'enviado').length;
  const pendentes = contratos.filter(c => c.status === 'pendente' || c.status === 'rascunho').length;

  const list = contratos.slice(0, 5).map(c => {
    const emoji = c.assinado_em ? '✅' : c.enviado_em ? '📤' : '📝';
    return `${emoji} ${c.cliente_nome}: ${c.status}`;
  }).join('. ');

  const text = `${contratos.length} propostas geraram contrato. ${assinados} assinados, ${enviados} aguardando assinatura, ${pendentes} pendentes. ${list}`;

  return { text, data: { total: contratos.length, assinados, enviados, pendentes, contratos } };
}

// Financial Summary - Resumo financeiro
async function handleFinancialSummary(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting financial summary...');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split('T')[0];

  const [ordersResult, parcelasResult] = await Promise.all([
    supabase.from('pedidos')
      .select('id, status, valor_total, created_at')
      .gte('created_at', `${thisMonth}-01`),
    supabase.from('parcelas')
      .select('id, valor, status, data_vencimento')
      .eq('status', 'pendente')
  ]);

  const orders = ordersResult.data || [];
  const parcelas = parcelasResult.data || [];

  const paidStatuses = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'];
  const paidRevenue = orders
    .filter(o => paidStatuses.includes(o.status))
    .reduce((sum, o) => sum + (o.valor_total || 0), 0);

  const pendingRevenue = orders
    .filter(o => o.status === 'pendente')
    .reduce((sum, o) => sum + (o.valor_total || 0), 0);

  const overdueAmount = parcelas
    .filter(p => p.data_vencimento < today)
    .reduce((sum, p) => sum + (p.valor || 0), 0);

  const overdueCount = parcelas.filter(p => p.data_vencimento < today).length;

  const text = `Resumo financeiro deste mês: ` +
    `Receita confirmada ${formatCurrency(paidRevenue)}. ` +
    `Pendente de pagamento ${formatCurrency(pendingRevenue)}. ` +
    `Inadimplência: ${overdueCount} parcelas em atraso totalizando ${formatCurrency(overdueAmount)}.`;

  return { text, data: { paidRevenue, pendingRevenue, overdueAmount, overdueCount } };
}

// Overdue Payments - Parcelas em atraso
async function handleOverduePayments(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting overdue payments...');

  const today = new Date().toISOString().split('T')[0];

  const { data: parcelas, error } = await supabase
    .from('parcelas')
    .select(`
      id, valor, data_vencimento, numero_parcela,
      pedidos!inner(id, client_id, users!inner(nome, email))
    `)
    .eq('status', 'pendente')
    .lt('data_vencimento', today)
    .order('data_vencimento', { ascending: true })
    .limit(10);

  if (error || !parcelas?.length) {
    return { text: 'Não há parcelas em atraso. Ótimo!', data: [] };
  }

  const totalOverdue = parcelas.reduce((sum, p) => sum + (p.valor || 0), 0);
  
  const list = parcelas.slice(0, 5).map(p => {
    const clientName = (p.pedidos as any)?.users?.nome || 'Cliente';
    const daysLate = Math.floor((new Date().getTime() - new Date(p.data_vencimento).getTime()) / 86400000);
    return `${clientName}: ${formatCurrency(p.valor || 0)}, ${daysLate} dias de atraso`;
  }).join('. ');

  const text = `${parcelas.length} parcelas em atraso totalizando ${formatCurrency(totalOverdue)}. ${list}`;

  return { text, data: { total: parcelas.length, totalAmount: totalOverdue, parcelas } };
}

// Get Leads - Leads qualificados
async function handleGetLeads(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting leads...', params);

  const thisMonth = new Date().toISOString().slice(0, 7);

  let query = supabase
    .from('leads_exa')
    .select('id, nome, telefone, status, score, created_at, conversation_id')
    .order('created_at', { ascending: false })
    .limit(20);

  if (params?.status) {
    query = query.eq('status', params.status);
  }
  if (params?.period === 'month') {
    query = query.gte('created_at', `${thisMonth}-01`);
  }

  const { data: leads, error } = await query;

  if (error || !leads?.length) {
    return { text: 'Não encontrei leads.', data: [] };
  }

  const qualified = leads.filter(l => l.status === 'qualificado').length;
  const hot = leads.filter(l => (l.score || 0) >= 80).length;

  const list = leads.slice(0, 5).map(l => 
    `${l.nome}: score ${l.score || 0}, ${l.status}`
  ).join('. ');

  const text = `${leads.length} leads. ${qualified} qualificados, ${hot} quentes (score 80+). ${list}`;

  return { text, data: { total: leads.length, qualified, hot, leads } };
}

// Search Client - Buscar cliente
async function handleSearchClient(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Searching client...', params);

  if (!params?.query) {
    return { text: 'Informe o nome ou email do cliente.', data: null };
  }

  const { data: clients } = await supabase
    .from('users')
    .select('id, nome, email, telefone, role, created_at')
    .or(`nome.ilike.%${params.query}%,email.ilike.%${params.query}%`)
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!clients?.length) {
    return { text: `Não encontrei cliente "${params.query}".`, data: null };
  }

  const list = clients.map(c => 
    `${c.nome || 'Sem nome'} (${c.email}), tel: ${c.telefone || 'não informado'}`
  ).join('. ');

  return { text: `Encontrei ${clients.length} clientes. ${list}`, data: clients };
}

// Client Details - Detalhes completos de um cliente
async function handleClientDetails(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting client details...', params);

  let clientId = params?.client_id;

  if (!clientId && params?.email) {
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('email', params.email)
      .limit(1);
    
    if (users?.length) clientId = users[0].id;
  }

  if (!clientId) {
    return { text: 'Preciso do ID ou email do cliente.', data: null };
  }

  const [userResult, ordersResult, notesResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', clientId).single(),
    supabase.from('pedidos').select('id, status, valor_total, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(5),
    supabase.from('client_crm_notes').select('content, note_type, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(3)
  ]);

  const user = userResult.data;
  const orders = ordersResult.data || [];
  const notes = notesResult.data || [];

  if (!user) {
    return { text: 'Cliente não encontrado.', data: null };
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const activeOrders = orders.filter(o => ['ativo', 'video_aprovado'].includes(o.status)).length;

  let text = `Cliente ${user.nome || 'Sem nome'}, email ${user.email}, telefone ${user.telefone || 'não informado'}. ` +
    `Cadastrado em ${formatDate(user.created_at)}. ` +
    `Total gasto: ${formatCurrency(totalSpent)} em ${orders.length} pedidos (${activeOrders} ativos). `;

  if (notes.length > 0) {
    text += `Última nota CRM: "${notes[0].content?.substring(0, 50)}..."`;
  }

  return { text, data: { user, orders, notes } };
}

// CRM Notes - Notas de CRM de um cliente
async function handleCrmNotes(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting CRM notes...', params);

  if (!params?.client_id) {
    return { text: 'Preciso do ID do cliente.', data: [] };
  }

  const { data: notes } = await supabase
    .from('client_crm_notes')
    .select('id, content, note_type, is_important, created_at')
    .eq('client_id', params.client_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!notes?.length) {
    return { text: 'Sem notas CRM para este cliente.', data: [] };
  }

  const important = notes.filter(n => n.is_important).length;
  const list = notes.slice(0, 3).map(n => 
    `${n.note_type}: "${n.content?.substring(0, 60)}..." (${formatDate(n.created_at)})`
  ).join(' | ');

  return { text: `${notes.length} notas CRM, ${important} importantes. ${list}`, data: notes };
}

// Get Coupons - Cupons ativos
async function handleGetCoupons(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting coupons...');

  const { data: coupons } = await supabase
    .from('cupons')
    .select('id, codigo, desconto_percentual, usos_atuais, usos_maximos, valido_ate')
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!coupons?.length) {
    return { text: 'Sem cupons ativos.', data: [] };
  }

  const list = coupons.map(c => 
    `${c.codigo}: ${c.desconto_percentual}% off, ${c.usos_atuais}/${c.usos_maximos || '∞'} usos`
  ).join('. ');

  return { text: `${coupons.length} cupons ativos. ${list}`, data: coupons };
}

// Get Alerts - Alertas ativos
async function handleGetAlerts(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting alerts...');

  const { data: alerts } = await supabase
    .from('panel_alerts')
    .select(`
      id, severity, alert_type, message, created_at,
      painels(nome_referencia)
    `)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!alerts?.length) {
    return { text: 'Sem alertas ativos. Sistema operando normalmente.', data: [] };
  }

  const critical = alerts.filter(a => a.severity === 'critical').length;
  const warning = alerts.filter(a => a.severity === 'warning').length;

  const criticalList = alerts
    .filter(a => a.severity === 'critical')
    .slice(0, 3)
    .map(a => `${(a.painels as any)?.nome_referencia || 'Painel'}: ${a.message}`)
    .join('. ');

  let text = `${alerts.length} alertas ativos: ${critical} críticos, ${warning} avisos. `;
  if (criticalList) text += `Críticos: ${criticalList}`;

  return { text, data: { total: alerts.length, critical, warning, alerts } };
}

// Get Proposals - Listar propostas COM MÉTRICAS COMPLETAS
async function handleGetProposals(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting proposals with full metrics...', params);

  let query = supabase
    .from('proposals')
    .select(`
      id, number, client_name, client_email, client_phone, status, 
      cash_total_value, fidel_monthly_value, duration_months,
      seller_name, sent_at, created_at, proposal_type,
      first_viewed_at, last_viewed_at, view_count, total_time_spent_seconds,
      is_viewing, converted_order_id, rejection_reason, responded_at,
      expires_at, chosen_plan
    `)
    .order('created_at', { ascending: false })
    .limit(30);

  if (params?.status) {
    query = query.eq('status', params.status);
  }
  if (params?.seller_name) {
    query = query.ilike('seller_name', `%${params.seller_name}%`);
  }
  if (params?.client_name) {
    query = query.ilike('client_name', `%${params.client_name}%`);
  }
  // Filtro para propostas "quentes" (sendo visualizadas agora)
  if (params?.is_viewing || params?.visualizando || params?.quentes) {
    query = query.eq('is_viewing', true);
  }
  // Filtro para propostas nunca abertas
  if (params?.never_opened || params?.nao_abriram) {
    query = query.eq('view_count', 0);
  }

  const { data: proposals, error } = await query;

  console.log('[Sofia JARVIS] Proposals result:', { count: proposals?.length || 0, error: error?.message });

  if (!proposals?.length) {
    return { text: 'Sem propostas encontradas.', data: [] };
  }

  // Estatísticas detalhadas
  const stats = {
    total: proposals.length,
    enviadas: proposals.filter(p => p.status === 'enviada' || p.status === 'pending').length,
    visualizadas: proposals.filter(p => (p.view_count || 0) > 0).length,
    visualizando_agora: proposals.filter(p => p.is_viewing).length,
    convertidas: proposals.filter(p => p.converted_order_id).length,
    nunca_abriram: proposals.filter(p => (p.view_count || 0) === 0).length,
    rejeitadas: proposals.filter(p => p.rejection_reason).length,
  };

  // Lista detalhada com métricas
  const list = proposals.slice(0, 8).map(p => {
    const emoji = getProposalStatusEmoji(p);
    const tempo = formatSeconds(p.total_time_spent_seconds || 0);
    const views = p.view_count || 0;
    const converteu = p.converted_order_id ? ' ✅PEDIDO' : '';
    // Calcular valor corretamente usando campos que existem
    const valor = p.cash_total_value || (p.fidel_monthly_value ? p.fidel_monthly_value * (p.duration_months || 12) : 0);
    
    return `${emoji} ${p.number || p.id.substring(0, 8)} - ${p.client_name}: ${p.status} | ${views}x | ${tempo}${converteu} | ${formatCurrency(valor)}`;
  }).join('\n');

  const text = `📊 RESUMO DE PROPOSTAS:
Total: ${stats.total} | Enviadas: ${stats.enviadas} | Visualizadas: ${stats.visualizadas}
🔴 Vendo agora: ${stats.visualizando_agora} | ✅ Convertidas: ${stats.convertidas}
📭 Nunca abriram: ${stats.nunca_abriram} | ❌ Rejeitadas: ${stats.rejeitadas}

📋 ÚLTIMAS PROPOSTAS:
${list}`;

  return { text, data: { stats, proposals } };
}

// Proposal Details - Detalhes COMPLETOS de uma proposta específica
async function handleGetProposalDetails(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting proposal details...', params);

  const { proposal_id, number, client_name } = params;
  
  // Buscar proposta
  let query = supabase.from('proposals').select('*');
  
  if (proposal_id) {
    query = query.eq('id', proposal_id);
  } else if (number) {
    query = query.ilike('number', `%${number}%`);
  } else if (client_name) {
    query = query.ilike('client_name', `%${client_name}%`);
  } else {
    return { text: 'Preciso do número da proposta, ID ou nome do cliente.', data: null };
  }
  
  const { data: proposals, error } = await query.limit(1);
  
  if (error || !proposals?.length) {
    return { text: 'Proposta não encontrada.', data: null };
  }
  
  const proposal = proposals[0];
  
  // Buscar logs desta proposta
  const { data: logs } = await supabase
    .from('proposal_logs')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Verificar se converteu em pedido
  let pedidoInfo = null;
  if (proposal.converted_order_id) {
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, status, valor_total, created_at, data_inicio, data_fim')
      .eq('id', proposal.converted_order_id)
      .single();
    pedidoInfo = pedido;
  }
  
  const statusEmoji = getProposalStatusEmoji(proposal);
  const tempoFormatado = formatSeconds(proposal.total_time_spent_seconds || 0);
  
  // Formatar timeline de logs
  const timeline = (logs || []).slice(0, 5).map(log => {
    const data = new Date(log.created_at).toLocaleString('pt-BR');
    const emoji = getProposalActionEmoji(log.action);
    return `${emoji} ${data} - ${log.action}`;
  }).join('\n');

  const text = `📋 Proposta ${proposal.number || proposal.id.substring(0, 8)}
👤 Cliente: ${proposal.client_name}
📧 Email: ${proposal.client_email || 'N/A'}
📱 Telefone: ${proposal.client_phone || 'N/A'}
💰 Valor: ${formatCurrency(proposal.cash_total_value || 0)} (à vista) / ${formatCurrency(proposal.fidel_monthly_value || 0)}/mês
🏢 Vendedor: ${proposal.seller_name || 'N/A'}

${statusEmoji} STATUS: ${proposal.status?.toUpperCase()}
${proposal.is_viewing ? '🔴 CLIENTE ESTÁ VENDO AGORA!' : ''}

📊 ENGAJAMENTO:
- Visualizações: ${proposal.view_count || 0}x
- Tempo total na proposta: ${tempoFormatado}
- Primeira abertura: ${proposal.first_viewed_at ? formatDate(proposal.first_viewed_at) : 'Nunca abriu'}
- Última atividade: ${proposal.last_viewed_at ? formatDate(proposal.last_viewed_at) : 'N/A'}

${proposal.converted_order_id ? `✅ CONVERTIDA EM PEDIDO: ${pedidoInfo?.id?.substring(0, 8) || 'N/A'} - Status: ${pedidoInfo?.status || 'N/A'} - Valor: ${formatCurrency(pedidoInfo?.valor_total || 0)}` : '⏳ Ainda não converteu em pedido'}
${proposal.rejection_reason ? `❌ Motivo rejeição: ${proposal.rejection_reason}` : ''}

📜 HISTÓRICO RECENTE:
${timeline || 'Nenhum evento registrado.'}`;

  return { text, data: { proposal, logs, pedido: pedidoInfo } };
}

// Proposal vs Pedido - Explicar a diferença
async function handleProposalVsPedido(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Explaining proposal vs pedido...');

  // Contar propostas por status
  const { data: propostas } = await supabase
    .from('proposals')
    .select('id, status, converted_order_id, is_viewing, view_count');
  
  // Contar pedidos
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, status, valor_total');

  const propostasStats = {
    total: propostas?.length || 0,
    nao_abertas: propostas?.filter(p => (p.view_count || 0) === 0).length || 0,
    visualizando_agora: propostas?.filter(p => p.is_viewing).length || 0,
    convertidas: propostas?.filter(p => p.converted_order_id).length || 0,
  };

  const pedidosStats = {
    total: pedidos?.length || 0,
    valor_total: pedidos?.reduce((sum, p) => sum + (p.valor_total || 0), 0) || 0,
    pagos: pedidos?.filter(p => ['pago', 'ativo', 'video_aprovado'].includes(p.status)).length || 0,
  };

  const taxaConversao = propostasStats.total > 0 
    ? ((propostasStats.convertidas / propostasStats.total) * 100).toFixed(1) 
    : '0';

  const text = `📋 PROPOSTA vs 🛒 PEDIDO - Explicação:

📋 PROPOSTA = Oferta enviada ao cliente
- Status possíveis: enviada → visualizada → visualizando → aceita/rejeitada
- Ainda NÃO é uma venda
- Cliente pode estar analisando
- Você acompanha: visualizações, tempo na página, se está vendo agora

🛒 PEDIDO = Quando o cliente PAGOU a proposta
- A proposta se transforma em pedido após pagamento
- Aí sim é uma VENDA concretizada
- Tem parcelas, contratos, vídeos associados

📊 SITUAÇÃO ATUAL:
📋 Propostas: ${propostasStats.total}
  - Nunca abriram: ${propostasStats.nao_abertas}
  - Vendo agora: ${propostasStats.visualizando_agora}
  - Converteram em pedido: ${propostasStats.convertidas}

🛒 Pedidos (vendas): ${pedidosStats.total}
  - Pagos/Ativos: ${pedidosStats.pagos}
  - Valor total: ${formatCurrency(pedidosStats.valor_total)}

📈 Taxa de conversão: ${taxaConversao}%`;

  return { text, data: { propostas: propostasStats, pedidos: pedidosStats, taxaConversao } };
}

// Proposal Timeline - Timeline completa de uma proposta
async function handleProposalTimeline(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting proposal timeline...', params);

  const { proposal_id, number, client_name } = params;
  
  // Buscar proposta
  let proposalQuery = supabase.from('proposals').select('*');
  if (proposal_id) proposalQuery = proposalQuery.eq('id', proposal_id);
  else if (number) proposalQuery = proposalQuery.ilike('number', `%${number}%`);
  else if (client_name) proposalQuery = proposalQuery.ilike('client_name', `%${client_name}%`);
  else return { text: 'Preciso do número da proposta, ID ou nome do cliente.', data: null };
  
  const { data: proposals } = await proposalQuery.limit(1);
  
  if (!proposals?.length) {
    return { text: 'Proposta não encontrada.', data: null };
  }
  
  const proposal = proposals[0];
  
  // Buscar TODOS os logs ordenados cronologicamente
  const { data: logs } = await supabase
    .from('proposal_logs')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('created_at', { ascending: true });
  
  // Formatar timeline completa
  const timeline = (logs || []).map(log => {
    const data = new Date(log.created_at).toLocaleString('pt-BR');
    const emoji = getProposalActionEmoji(log.action);
    const details = log.metadata ? ` | ${JSON.stringify(log.metadata).substring(0, 50)}` : '';
    return `${emoji} ${data} - ${log.action.toUpperCase()}${details}`;
  }).join('\n\n');
  
  const text = `📜 TIMELINE COMPLETA - ${proposal.number || proposal.id.substring(0, 8)}
👤 Cliente: ${proposal.client_name}
💰 Valor: ${formatCurrency(proposal.cash_total_value || 0)}
📊 Status: ${proposal.status} | Views: ${proposal.view_count || 0}x | Tempo: ${formatSeconds(proposal.total_time_spent_seconds || 0)}

📅 EVENTOS (${logs?.length || 0}):
${timeline || 'Nenhum evento registrado.'}`;

  return { text, data: { proposal, logs } };
}

// Propostas Quentes - Propostas sendo visualizadas AGORA
async function handlePropostasQuentes(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting hot proposals (viewing now)...');

  const { data: quentes, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('is_viewing', true)
    .order('last_viewed_at', { ascending: false });
  
  if (error) {
    return { text: `Erro ao buscar propostas quentes: ${error.message}`, data: [] };
  }
  
  if (!quentes?.length) {
    return { text: '🟢 Nenhuma proposta sendo visualizada neste momento. Todas as propostas estão "frias".', data: [] };
  }
  
  const list = quentes.map(p => {
    const tempo = formatSeconds(p.total_time_spent_seconds || 0);
    return `🔴 ${p.number || p.id.substring(0, 8)} - ${p.client_name}
   💰 ${formatCurrency(p.cash_total_value || 0)} | ⏱️ ${tempo} na página | 👁️ ${p.view_count || 0}x views
   📧 ${p.client_email || 'N/A'} | 📱 ${p.client_phone || 'N/A'}
   🏢 Vendedor: ${p.seller_name || 'N/A'}`;
  }).join('\n\n');
  
  const text = `🔥 ${quentes.length} PROPOSTA(S) SENDO VISUALIZADA(S) AGORA!\n\n${list}`;
  
  return { text, data: quentes };
}

// Order Details - Detalhes de um pedido
async function handleOrderDetails(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting order details...', params);

  if (!params?.pedido_id) {
    return { text: 'Preciso do ID do pedido.', data: null };
  }

  const { data: order } = await supabase
    .from('pedidos')
    .select(`
      *,
      users!pedidos_client_id_fkey(nome, email, telefone)
    `)
    .eq('id', params.pedido_id)
    .single();

  if (!order) {
    return { text: 'Pedido não encontrado.', data: null };
  }

  const client = (order as any).users;
  
  const text = `Pedido ${order.id.substring(0, 8)}... ` +
    `Cliente: ${client?.nome || 'N/A'} (${client?.email}). ` +
    `Status: ${order.status}. Valor: ${formatCurrency(order.valor_total || 0)}. ` +
    `Plano: ${order.plano_meses} meses. ` +
    `Período: ${formatDate(order.data_inicio)} a ${formatDate(order.data_fim)}. ` +
    `Criado em ${formatDate(order.created_at)}.`;

  return { text, data: order };
}

// Get Videos - Vídeos de um cliente
async function handleGetVideos(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting videos...', params);

  let query = supabase
    .from('videos')
    .select('id, nome, status, approval_status, created_at, client_id')
    .order('created_at', { ascending: false })
    .limit(20);

  if (params?.client_id) {
    query = query.eq('client_id', params.client_id);
  }

  const { data: videos } = await query;

  if (!videos?.length) {
    return { text: 'Sem vídeos encontrados.', data: [] };
  }

  const pending = videos.filter(v => v.approval_status === 'pending').length;
  const approved = videos.filter(v => v.approval_status === 'approved').length;

  const list = videos.slice(0, 5).map(v => 
    `${v.nome}: ${v.approval_status}`
  ).join('. ');

  return { text: `${videos.length} vídeos. ${approved} aprovados, ${pending} pendentes. ${list}`, data: videos };
}

// Email History - Histórico de emails
async function handleEmailHistory(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting email history...', params);

  let query = supabase
    .from('email_logs')
    .select('id, to_email, subject, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (params?.email) {
    query = query.eq('to_email', params.email);
  }

  const { data: emails } = await query;

  if (!emails?.length) {
    return { text: 'Sem emails encontrados.', data: [] };
  }

  const sent = emails.filter(e => e.status === 'sent').length;
  const failed = emails.filter(e => e.status === 'failed').length;

  const list = emails.slice(0, 3).map(e => 
    `Para ${e.to_email}: "${e.subject?.substring(0, 30)}..." - ${e.status}`
  ).join('. ');

  return { text: `${emails.length} emails. ${sent} enviados, ${failed} falhas. ${list}`, data: emails };
}

// Daily Metrics - Métricas do dia
async function handleDailyMetrics(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting daily metrics...');

  const today = new Date().toISOString().split('T')[0];

  const [ordersResult, leadsResult, conversationsResult, messagesResult] = await Promise.all([
    supabase.from('pedidos').select('id, status, valor_total').gte('created_at', today),
    supabase.from('leads_exa').select('id, status').gte('created_at', today),
    supabase.from('conversations').select('id').gte('created_at', today),
    supabase.from('messages').select('id, direction').gte('created_at', today)
  ]);

  const orders = ordersResult.data || [];
  const leads = leadsResult.data || [];
  const conversations = conversationsResult.data || [];
  const messages = messagesResult.data || [];

  const revenue = orders.reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const inboundMessages = messages.filter(m => m.direction === 'inbound').length;
  const outboundMessages = messages.filter(m => m.direction === 'outbound').length;

  const text = `Métricas de hoje: ` +
    `${orders.length} pedidos (${formatCurrency(revenue)} em valor). ` +
    `${leads.length} novos leads. ` +
    `${conversations.length} novas conversas. ` +
    `${messages.length} mensagens (${inboundMessages} recebidas, ${outboundMessages} enviadas).`;

  return { text, data: { orders: orders.length, revenue, leads: leads.length, conversations: conversations.length, messages: messages.length } };
}

// ==================== ADMIN MASTER INTENTS ====================

// Conversation Heat Analysis - Análise de calor das conversas
async function handleConversationHeatAnalysis(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS ADMIN] Analyzing conversation heat...');

  // Get conversations with recent activity
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, contact_name, phone, agent_key, status, last_message_at, awaiting_response,
      messages(content, direction, created_at)
    `)
    .gte('last_message_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('last_message_at', { ascending: false })
    .limit(50);

  if (!conversations?.length) {
    return { text: 'Não há conversas recentes para analisar.', data: [] };
  }

  // Calculate heat scores
  const analyzedConversations = conversations.map(conv => {
    const messages = Array.isArray(conv.messages) ? conv.messages : [];
    const inboundCount = messages.filter((m: any) => m.direction === 'inbound').length;
    const outboundCount = messages.filter((m: any) => m.direction === 'outbound').length;
    const lastMessageTime = new Date(conv.last_message_at).getTime();
    const hoursSinceLastMessage = (Date.now() - lastMessageTime) / (1000 * 60 * 60);
    
    // Calculate heat score (0-100)
    let heatScore = 50;
    heatScore += Math.min(inboundCount * 5, 25); // More inbound = hotter
    heatScore += conv.awaiting_response ? 15 : 0; // Awaiting response = hotter
    heatScore -= Math.min(hoursSinceLastMessage * 2, 30); // Older = colder
    heatScore = Math.max(0, Math.min(100, heatScore));
    
    // Risk factors
    const riskFactors: string[] = [];
    if (hoursSinceLastMessage > 24) riskFactors.push('sem_resposta_24h');
    if (hoursSinceLastMessage > 48) riskFactors.push('abandono_risco');
    if (conv.awaiting_response) riskFactors.push('aguardando_resposta');
    if (inboundCount > outboundCount * 2) riskFactors.push('cliente_insistente');
    
    return {
      ...conv,
      heatScore,
      riskFactors,
      hoursSinceLastMessage: Math.round(hoursSinceLastMessage),
      messageCount: messages.length
    };
  });

  // Sort by heat score descending
  analyzedConversations.sort((a, b) => b.heatScore - a.heatScore);

  const hotConversations = analyzedConversations.filter(c => c.heatScore >= 70);
  const atRisk = analyzedConversations.filter(c => c.riskFactors.includes('abandono_risco'));
  const awaitingResponse = analyzedConversations.filter(c => c.awaiting_response);

  const hotList = hotConversations.slice(0, 5).map(c => 
    `${c.contact_name} (${c.agent_key}): score ${c.heatScore}, ${c.hoursSinceLastMessage}h atrás`
  ).join('. ');

  const text = `Análise de calor: ${conversations.length} conversas analisadas. ` +
    `${hotConversations.length} conversas quentes (score 70+), ${atRisk.length} em risco de abandono, ` +
    `${awaitingResponse.length} aguardando resposta. ` +
    `Mais quentes: ${hotList || 'nenhuma acima de 70'}`;

  return { 
    text, 
    data: { 
      total: conversations.length, 
      hot: hotConversations.length, 
      atRisk: atRisk.length,
      awaitingResponse: awaitingResponse.length,
      conversations: analyzedConversations.slice(0, 20)
    } 
  };
}

// Leads at Risk - Leads em risco de abandono
async function handleLeadsAtRisk(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS ADMIN] Getting leads at risk...');

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Leads without follow-up
  const { data: leads } = await supabase
    .from('leads_exa')
    .select(`
      id, nome, telefone, status, score, created_at, ultimo_contato, conversation_id,
      conversations(last_message_at, awaiting_response)
    `)
    .in('status', ['novo', 'em_andamento', 'qualificado'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (!leads?.length) {
    return { text: 'Não há leads ativos no momento.', data: [] };
  }

  const riskLeads = leads.map(lead => {
    const conv = lead.conversations as any;
    const lastContact = lead.ultimo_contato || lead.created_at;
    const daysSinceContact = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
    
    let riskLevel = 'baixo';
    const riskFactors: string[] = [];
    
    if (daysSinceContact >= 7) {
      riskLevel = 'critico';
      riskFactors.push('sem_contato_7dias');
    } else if (daysSinceContact >= 3) {
      riskLevel = 'alto';
      riskFactors.push('sem_contato_3dias');
    }
    
    if (conv?.awaiting_response) {
      riskFactors.push('aguardando_resposta');
      if (riskLevel === 'baixo') riskLevel = 'medio';
    }
    
    if ((lead.score || 0) >= 80 && daysSinceContact >= 2) {
      riskFactors.push('lead_quente_esfriando');
      riskLevel = 'alto';
    }

    return {
      ...lead,
      daysSinceContact,
      riskLevel,
      riskFactors
    };
  }).filter(l => l.riskFactors.length > 0);

  riskLeads.sort((a, b) => {
    const riskOrder = { critico: 0, alto: 1, medio: 2, baixo: 3 };
    return riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder];
  });

  const critical = riskLeads.filter(l => l.riskLevel === 'critico');
  const high = riskLeads.filter(l => l.riskLevel === 'alto');

  const criticalList = critical.slice(0, 5).map(l => 
    `${l.nome}: ${l.daysSinceContact} dias sem contato, score ${l.score || 0}`
  ).join('. ');

  const text = `Leads em risco: ${riskLeads.length} leads precisam de atenção. ` +
    `${critical.length} críticos (7+ dias), ${high.length} alto risco (3+ dias). ` +
    `Críticos: ${criticalList || 'nenhum'}`;

  return { 
    text, 
    data: { 
      total: riskLeads.length, 
      critical: critical.length, 
      high: high.length,
      leads: riskLeads 
    } 
  };
}

// Full Financial Report - Relatório financeiro completo
async function handleFullFinancialReport(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS ADMIN] Generating full financial report...');

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const today = now.toISOString().split('T')[0];

  const [
    thisMonthOrders,
    lastMonthOrders,
    overdueResult,
    upcomingResult,
    contractsResult
  ] = await Promise.all([
    supabase.from('pedidos').select('id, status, valor_total').gte('created_at', `${thisMonth}-01`),
    supabase.from('pedidos').select('id, status, valor_total').gte('created_at', `${lastMonth}-01`).lt('created_at', `${thisMonth}-01`),
    supabase.from('parcelas').select('id, valor, data_vencimento').eq('status', 'pendente').lt('data_vencimento', today),
    supabase.from('parcelas').select('id, valor, data_vencimento').eq('status', 'pendente').gte('data_vencimento', today).lte('data_vencimento', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase.from('contratos_legais').select('id, status, valor_total').in('status', ['ativo', 'assinado'])
  ]);

  const thisMonthData = thisMonthOrders.data || [];
  const lastMonthData = lastMonthOrders.data || [];
  const overdue = overdueResult.data || [];
  const upcoming = upcomingResult.data || [];
  const contracts = contractsResult.data || [];

  const paidStatuses = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'];
  
  const thisMonthRevenue = thisMonthData.filter(o => paidStatuses.includes(o.status)).reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const lastMonthRevenue = lastMonthData.filter(o => paidStatuses.includes(o.status)).reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const pendingRevenue = thisMonthData.filter(o => o.status === 'pendente').reduce((sum, o) => sum + (o.valor_total || 0), 0);
  const overdueAmount = overdue.reduce((sum, p) => sum + (p.valor || 0), 0);
  const upcomingAmount = upcoming.reduce((sum, p) => sum + (p.valor || 0), 0);
  const activeContractsValue = contracts.reduce((sum, c) => sum + (c.valor_total || 0), 0);

  const growthPercent = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : 'N/A';

  const text = `RELATÓRIO FINANCEIRO EXECUTIVO. ` +
    `Este mês: ${formatCurrency(thisMonthRevenue)} confirmados, ${formatCurrency(pendingRevenue)} pendentes. ` +
    `Mês anterior: ${formatCurrency(lastMonthRevenue)} (${growthPercent}% variação). ` +
    `Inadimplência: ${overdue.length} parcelas em atraso (${formatCurrency(overdueAmount)}). ` +
    `Próximos 7 dias: ${formatCurrency(upcomingAmount)} a receber. ` +
    `Contratos ativos: ${contracts.length} totalizando ${formatCurrency(activeContractsValue)}.`;

  return { 
    text, 
    data: { 
      thisMonth: { revenue: thisMonthRevenue, pending: pendingRevenue, orders: thisMonthData.length },
      lastMonth: { revenue: lastMonthRevenue, orders: lastMonthData.length },
      growthPercent,
      overdue: { count: overdue.length, amount: overdueAmount },
      upcoming: { count: upcoming.length, amount: upcomingAmount },
      contracts: { count: contracts.length, value: activeContractsValue }
    } 
  };
}

// Agent Performance - Performance dos agentes
async function handleAgentPerformance(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS ADMIN] Getting agent performance...');

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: conversations } = await supabase
    .from('conversations')
    .select('agent_key, status, awaiting_response, last_message_at')
    .gte('last_message_at', weekAgo);

  const { data: messages } = await supabase
    .from('messages')
    .select('conversation_id, direction, created_at')
    .gte('created_at', weekAgo);

  if (!conversations?.length) {
    return { text: 'Não há dados de performance recentes.', data: {} };
  }

  // Group by agent
  const agentStats: Record<string, any> = {};
  
  conversations.forEach(conv => {
    const agent = conv.agent_key || 'desconhecido';
    if (!agentStats[agent]) {
      agentStats[agent] = {
        conversations: 0,
        awaitingResponse: 0,
        messagesIn: 0,
        messagesOut: 0
      };
    }
    agentStats[agent].conversations++;
    if (conv.awaiting_response) agentStats[agent].awaitingResponse++;
  });

  // Count messages per agent (simplified - would need conversation-agent mapping for accuracy)
  const totalMessages = messages?.length || 0;
  const inboundMessages = messages?.filter(m => m.direction === 'inbound').length || 0;
  const outboundMessages = messages?.filter(m => m.direction === 'outbound').length || 0;

  const agentList = Object.entries(agentStats)
    .map(([agent, stats]) => `${agent}: ${stats.conversations} conversas, ${stats.awaitingResponse} aguardando`)
    .join('. ');

  const text = `PERFORMANCE DOS AGENTES (última semana). ` +
    `Total: ${conversations.length} conversas, ${totalMessages} mensagens (${inboundMessages} recebidas, ${outboundMessages} enviadas). ` +
    `Por agente: ${agentList}`;

  return { 
    text, 
    data: { 
      totalConversations: conversations.length,
      totalMessages,
      inboundMessages,
      outboundMessages,
      agentStats 
    } 
  };
}

// Contract Status Full - Status completo de contratos
async function handleContractStatusFull(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS ADMIN] Getting full contract status...');

  const { data: contracts } = await supabase
    .from('contratos_legais')
    .select('id, numero_contrato, cliente_nome, status, valor_total, data_inicio, data_fim, assinado_em, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!contracts?.length) {
    return { text: 'Não há contratos cadastrados.', data: [] };
  }

  const statusCounts: Record<string, number> = {};
  const statusValues: Record<string, number> = {};
  
  contracts.forEach(c => {
    const status = c.status || 'desconhecido';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    statusValues[status] = (statusValues[status] || 0) + (c.valor_total || 0);
  });

  const pendingSignature = contracts.filter(c => c.status === 'enviado');
  const expiringSoon = contracts.filter(c => {
    if (!c.data_fim || c.status !== 'ativo') return false;
    const daysUntilExpiry = Math.floor((new Date(c.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const statusSummary = Object.entries(statusCounts)
    .map(([status, count]) => `${status}: ${count} (${formatCurrency(statusValues[status] || 0)})`)
    .join(', ');

  const pendingList = pendingSignature.slice(0, 3).map(c => 
    `${c.cliente_nome}: ${formatCurrency(c.valor_total || 0)}`
  ).join(', ');

  const expiringList = expiringSoon.slice(0, 3).map(c => {
    const daysLeft = Math.floor((new Date(c.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `${c.cliente_nome}: ${daysLeft} dias`;
  }).join(', ');

  const text = `STATUS DE CONTRATOS. Total: ${contracts.length}. ` +
    `Por status: ${statusSummary}. ` +
    `Aguardando assinatura: ${pendingSignature.length} (${pendingList || 'nenhum'}). ` +
    `Expirando em 30 dias: ${expiringSoon.length} (${expiringList || 'nenhum'}).`;

  return { 
    text, 
    data: { 
      total: contracts.length,
      statusCounts,
      statusValues,
      pendingSignature: pendingSignature.length,
      expiringSoon: expiringSoon.length,
      contracts: contracts.slice(0, 20)
    } 
  };
}

// Abandoned Leads - Leads abandonados
async function handleAbandonedLeads(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS ADMIN] Getting abandoned leads...');

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: leads } = await supabase
    .from('leads_exa')
    .select('id, nome, telefone, status, score, created_at, ultimo_contato')
    .in('status', ['novo', 'em_andamento'])
    .lt('ultimo_contato', sevenDaysAgo)
    .order('ultimo_contato', { ascending: true })
    .limit(30);

  if (!leads?.length) {
    return { text: 'Nenhum lead abandonado encontrado. Ótimo trabalho!', data: [] };
  }

  const leadsList = leads.slice(0, 10).map(l => {
    const daysAgo = Math.floor((Date.now() - new Date(l.ultimo_contato || l.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return `${l.nome}: ${daysAgo} dias sem contato, score ${l.score || 0}`;
  }).join('. ');

  const highScoreAbandoned = leads.filter(l => (l.score || 0) >= 70).length;

  const text = `LEADS ABANDONADOS (7+ dias sem contato): ${leads.length} leads. ` +
    `${highScoreAbandoned} são de alto valor (score 70+). ` +
    `Lista: ${leadsList}`;

  return { 
    text, 
    data: { 
      total: leads.length, 
      highValue: highScoreAbandoned,
      leads 
    } 
  };
}

// ==================== NEW INTENTS - COMPLETE SYSTEM ACCESS ====================

// Company Info - Informações oficiais da EXA Mídia
async function handleCompanyInfo(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting company info...');
  
  const companyData = {
    razaoSocial: 'EXA Soluções Digitais LTDA',
    cnpj: '62.878.193/0001-35',
    endereco: 'Avenida Paraná, 974 – Sala 301, Centro, Foz do Iguaçu – PR',
    cep: '85852-000',
    cidade: 'Foz do Iguaçu',
    estado: 'Paraná',
    whatsapp: '(45) 9 9141-5856',
    instagram: '@exa.publicidade',
    email: 'contato@examidia.com.br',
    site: 'www.examidia.com.br',
    horarioFuncionamento: 'Segunda a Sexta, 09h às 18h',
    certificacao: 'Modelo validado pelo Secovi Paraná',
    segmento: 'Publicidade inteligente em elevadores',
    missao: 'Conectar administradores, síndicos e moradores com comunicação não invasiva'
  };
  
  const text = `A EXA Soluções Digitais é uma empresa de publicidade inteligente em elevadores, sediada em Foz do Iguaçu, Paraná. ` +
    `CNPJ ${companyData.cnpj}. Endereço: ${companyData.endereco}. ` +
    `WhatsApp: ${companyData.whatsapp}. Email: ${companyData.email}. ` +
    `Site: ${companyData.site}. Horário: ${companyData.horarioFuncionamento}. ` +
    `Certificação: ${companyData.certificacao}. ` +
    `Nossa missão: ${companyData.missao}.`;
  
  return { text, data: companyData };
}

// Get Benefits - Benefícios do portal para síndicos
async function handleGetBenefits(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting benefits...');
  
  const { data: benefits, error } = await supabase
    .from('available_benefits')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !benefits?.length) {
    return { text: 'Nenhum benefício cadastrado no momento.', data: [] };
  }

  const byCategory: Record<string, any[]> = {};
  benefits.forEach(b => {
    if (!byCategory[b.category]) byCategory[b.category] = [];
    byCategory[b.category].push(b);
  });

  const categorySummary = Object.entries(byCategory)
    .map(([cat, items]) => `${cat}: ${items.length} benefícios`)
    .join(', ');

  const list = benefits.slice(0, 5).map(b => `${b.name} (${b.category})`).join(', ');

  const text = `${benefits.length} benefícios ativos para síndicos. Por categoria: ${categorySummary}. Destaques: ${list}`;

  return { text, data: { total: benefits.length, byCategory, benefits } };
}

// Get Providers - Prestadores de serviço
async function handleGetProviders(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting providers...');
  
  const { data: providers, error } = await supabase
    .from('provider_benefits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !providers?.length) {
    return { text: 'Nenhum prestador cadastrado no momento.', data: [] };
  }

  const active = providers.filter(p => p.is_active !== false).length;
  const list = providers.slice(0, 5).map(p => `${p.provider_name || 'Prestador'}: ${p.benefit_title || 'Serviço'}`).join(', ');

  const text = `${providers.length} prestadores cadastrados (${active} ativos). Principais: ${list}`;

  return { text, data: { total: providers.length, active, providers } };
}

// Get Campaigns - Campanhas de mídia
async function handleGetCampaigns(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting campaigns...', params);
  
  let query = supabase
    .from('campanhas')
    .select(`
      id, status, data_inicio, data_fim, obs, created_at,
      users!campanhas_client_id_fkey(nome, email),
      painels!campanhas_painel_id_fkey(nome_referencia),
      videos!campanhas_video_id_fkey(nome)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data: campaigns, error } = await query;

  if (error || !campaigns?.length) {
    return { text: 'Nenhuma campanha encontrada.', data: [] };
  }

  const statusCounts: Record<string, number> = {};
  campaigns.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  const statusSummary = Object.entries(statusCounts)
    .map(([s, count]) => `${s}: ${count}`)
    .join(', ');

  const list = campaigns.slice(0, 5).map(c => {
    const client = (c.users as any)?.nome || 'Cliente';
    return `${client}: ${c.status}, ${formatDate(c.data_inicio)} a ${formatDate(c.data_fim)}`;
  }).join('. ');

  const text = `${campaigns.length} campanhas. Por status: ${statusSummary}. Recentes: ${list}`;

  return { text, data: { total: campaigns.length, statusCounts, campaigns } };
}

// Campaign Details - Detalhes de uma campanha específica
async function handleCampaignDetails(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting campaign details...', params);
  
  if (!params?.campaign_id) {
    return { text: 'Preciso do ID da campanha.', data: null };
  }

  const { data: campaign, error } = await supabase
    .from('campanhas')
    .select(`
      *,
      users!campanhas_client_id_fkey(nome, email, telefone),
      painels!campanhas_painel_id_fkey(nome_referencia, status),
      videos!campanhas_video_id_fkey(nome, url, approval_status)
    `)
    .eq('id', params.campaign_id)
    .single();

  if (error || !campaign) {
    return { text: 'Campanha não encontrada.', data: null };
  }

  const client = (campaign as any).users;
  const painel = (campaign as any).painels;
  const video = (campaign as any).videos;

  const text = `Campanha ${campaign.id.substring(0, 8)}... ` +
    `Cliente: ${client?.nome || 'N/A'} (${client?.email}). ` +
    `Status: ${campaign.status}. ` +
    `Período: ${formatDate(campaign.data_inicio)} a ${formatDate(campaign.data_fim)}. ` +
    `Painel: ${painel?.nome_referencia || 'N/A'}. ` +
    `Vídeo: ${video?.nome || 'N/A'} (${video?.approval_status || 'N/A'}).`;

  return { text, data: campaign };
}

// Get Products - Produtos EXA
async function handleGetProducts(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting products...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !products?.length) {
    return { text: 'Nenhum produto cadastrado.', data: [] };
  }

  const active = products.filter(p => p.is_active !== false).length;
  const list = products.map(p => `${p.name}: ${formatCurrency(p.price || 0)}`).join(', ');

  const text = `${products.length} produtos cadastrados (${active} ativos). Produtos: ${list}`;

  return { text, data: { total: products.length, active, products } };
}

// Get Users - Lista de usuários do sistema
async function handleGetUsers(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting users...', params);
  
  let query = supabase
    .from('users')
    .select('id, nome, email, telefone, role, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (params?.role) {
    query = query.eq('role', params.role);
  }

  const { data: users, error } = await query;

  if (error || !users?.length) {
    return { text: 'Nenhum usuário encontrado.', data: [] };
  }

  const roleCounts: Record<string, number> = {};
  users.forEach(u => {
    roleCounts[u.role || 'sem_role'] = (roleCounts[u.role || 'sem_role'] || 0) + 1;
  });

  const roleSummary = Object.entries(roleCounts)
    .map(([role, count]) => `${role}: ${count}`)
    .join(', ');

  const text = `${users.length} usuários. Por tipo: ${roleSummary}`;

  return { text, data: { total: users.length, roleCounts, users } };
}

// User Details - Detalhes completos de um usuário
async function handleUserDetails(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting user details...', params);
  
  let userId = params?.user_id;

  if (!userId && params?.email) {
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('email', params.email)
      .limit(1);
    if (users?.length) userId = users[0].id;
  }

  if (!userId) {
    return { text: 'Preciso do ID ou email do usuário.', data: null };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { text: 'Usuário não encontrado.', data: null };
  }

  const text = `Usuário ${user.nome || 'Sem nome'}. ` +
    `Email: ${user.email}. Telefone: ${user.telefone || 'não informado'}. ` +
    `Role: ${user.role}. Cadastrado em ${formatDate(user.created_at)}.`;

  return { text, data: user };
}

// Get Sindicos Interessados
async function handleGetSindicos(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting sindicos...');
  
  const { data: sindicos, error } = await supabase
    .from('configuracoes_sindico')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !sindicos?.length) {
    return { text: 'Nenhuma configuração de síndico encontrada.', data: [] };
  }

  const text = `${sindicos.length} configurações de síndico cadastradas.`;

  return { text, data: { total: sindicos.length, sindicos } };
}

// Get Logos - Logos de clientes
async function handleGetLogos(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting logos...');
  
  const { data: logos, error } = await supabase
    .from('client_logos')
    .select('*')
    .order('order_position', { ascending: true });

  if (error || !logos?.length) {
    return { text: 'Nenhum logo cadastrado.', data: [] };
  }

  const active = logos.filter(l => l.is_active).length;
  const list = logos.slice(0, 5).map(l => l.name).join(', ');

  const text = `${logos.length} logos cadastrados (${active} ativos). Clientes: ${list}`;

  return { text, data: { total: logos.length, active, logos } };
}

// Get Homepage Config
async function handleGetHomepageConfig(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting homepage config...');
  
  const { data: config, error } = await supabase
    .from('homepage_config')
    .select('*')
    .limit(1)
    .single();

  if (error || !config) {
    return { text: 'Configuração da homepage não encontrada.', data: null };
  }

  const text = `Configuração da homepage carregada. ` +
    `Título hero: ${config.hero_title || 'N/A'}. ` +
    `Subtítulo: ${config.hero_subtitle || 'N/A'}. ` +
    `Vídeo principal: ${config.video_url ? 'configurado' : 'não configurado'}.`;

  return { text, data: config };
}

// Get Notifications
async function handleGetNotifications(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting notifications...', params);
  
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (params?.unread_only) {
    query = query.eq('read', false);
  }

  const { data: notifications, error } = await query;

  if (error || !notifications?.length) {
    return { text: 'Nenhuma notificação encontrada.', data: [] };
  }

  const unread = notifications.filter(n => !n.read).length;
  const list = notifications.slice(0, 5).map(n => 
    `${n.title || 'Notificação'}: ${n.message?.substring(0, 40) || 'N/A'}...`
  ).join('. ');

  const text = `${notifications.length} notificações (${unread} não lidas). Recentes: ${list}`;

  return { text, data: { total: notifications.length, unread, notifications } };
}

// Get Parcelas - Todas as parcelas
async function handleGetParcelas(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting all parcelas...', params);
  
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('parcelas')
    .select(`
      id, valor, status, data_vencimento, numero_parcela,
      pedidos!inner(id, client_id)
    `)
    .order('data_vencimento', { ascending: false })
    .limit(50);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data: parcelas, error } = await query;

  if (error || !parcelas?.length) {
    return { text: 'Nenhuma parcela encontrada.', data: [] };
  }

  const pending = parcelas.filter(p => p.status === 'pendente');
  const overdue = pending.filter(p => p.data_vencimento < today);
  const totalPending = pending.reduce((sum, p) => sum + (p.valor || 0), 0);
  const totalOverdue = overdue.reduce((sum, p) => sum + (p.valor || 0), 0);

  const text = `${parcelas.length} parcelas no total. ` +
    `${pending.length} pendentes (${formatCurrency(totalPending)}). ` +
    `${overdue.length} em atraso (${formatCurrency(totalOverdue)}).`;

  return { text, data: { total: parcelas.length, pending: pending.length, overdue: overdue.length, totalPending, totalOverdue, parcelas } };
}

// Get Assinaturas - Contratos recorrentes/ativos
async function handleGetAssinaturas(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting assinaturas...');
  
  const { data: contracts, error } = await supabase
    .from('contratos_legais')
    .select('*')
    .in('status', ['ativo', 'assinado'])
    .order('created_at', { ascending: false });

  if (error || !contracts?.length) {
    return { text: 'Nenhuma assinatura/contrato ativo.', data: [] };
  }

  const totalValue = contracts.reduce((sum, c) => sum + (c.valor_total || 0), 0);

  const text = `${contracts.length} contratos ativos totalizando ${formatCurrency(totalValue)}.`;

  return { text, data: { total: contracts.length, totalValue, contracts } };
}

// Get Conversation Analytics
async function handleGetConversationAnalytics(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting conversation analytics...');
  
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [conversationsResult, messagesResult] = await Promise.all([
    supabase.from('conversations').select('id, agent_key, status, awaiting_response').gte('last_message_at', weekAgo),
    supabase.from('messages').select('id, direction, created_at').gte('created_at', weekAgo)
  ]);

  const conversations = conversationsResult.data || [];
  const messages = messagesResult.data || [];

  const inbound = messages.filter(m => m.direction === 'inbound').length;
  const outbound = messages.filter(m => m.direction === 'outbound').length;
  const awaiting = conversations.filter(c => c.awaiting_response).length;

  const agentCounts: Record<string, number> = {};
  conversations.forEach(c => {
    agentCounts[c.agent_key || 'desconhecido'] = (agentCounts[c.agent_key || 'desconhecido'] || 0) + 1;
  });

  const text = `Analytics de conversas (última semana): ` +
    `${conversations.length} conversas, ${messages.length} mensagens (${inbound} recebidas, ${outbound} enviadas). ` +
    `${awaiting} aguardando resposta.`;

  return { text, data: { conversations: conversations.length, messages: messages.length, inbound, outbound, awaiting, agentCounts } };
}

// Get Security Logs
async function handleGetSecurityLogs(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting security logs...');
  
  const [authLogsResult, apiLogsResult] = await Promise.all([
    supabase.from('auth_detailed_logs').select('id, event_type, email, success, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('api_logs').select('id, api_name, endpoint, success, created_at').order('created_at', { ascending: false }).limit(20)
  ]);

  const authLogs = authLogsResult.data || [];
  const apiLogs = apiLogsResult.data || [];

  const failedAuth = authLogs.filter(l => !l.success).length;
  const failedApi = apiLogs.filter(l => !l.success).length;

  const text = `Logs de segurança: ${authLogs.length} eventos de autenticação (${failedAuth} falhas), ` +
    `${apiLogs.length} chamadas de API (${failedApi} falhas).`;

  return { text, data: { authLogs, apiLogs, failedAuth, failedApi } };
}

// Get Email Templates
async function handleGetEmailTemplates(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting email templates...');
  
  const { data: templates, error } = await supabase
    .from('email_templates_cache')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !templates?.length) {
    return { text: 'Nenhum template de email encontrado.', data: [] };
  }

  const list = templates.map(t => t.template_name || t.id).join(', ');

  const text = `${templates.length} templates de email: ${list}`;

  return { text, data: { total: templates.length, templates } };
}

// Get Generated Reports
async function handleGetGeneratedReports(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting generated reports...');
  
  const { data: reports, error } = await supabase
    .from('generated_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !reports?.length) {
    return { text: 'Nenhum relatório gerado encontrado.', data: [] };
  }

  const list = reports.slice(0, 5).map(r => 
    `${r.report_type || 'Relatório'}: ${formatDate(r.created_at)}`
  ).join(', ');

  const text = `${reports.length} relatórios gerados. Recentes: ${list}`;

  return { text, data: { total: reports.length, reports } };
}

// Get Escalacao Vendedores
async function handleGetEscalacao(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting escalacao...');
  
  const { data: escalacao, error } = await supabase
    .from('escalacao_vendedores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !escalacao?.length) {
    return { text: 'Nenhuma escalação de vendedor configurada.', data: [] };
  }

  const active = escalacao.filter(e => e.ativo !== false).length;

  const text = `${escalacao.length} vendedores na escalação (${active} ativos).`;

  return { text, data: { total: escalacao.length, active, escalacao } };
}

// Get QR Codes
async function handleGetQrCodes(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting QR codes...');
  
  const { data: qrCodes, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !qrCodes?.length) {
    return { text: 'Nenhum QR code cadastrado.', data: [] };
  }

  const text = `${qrCodes.length} QR codes cadastrados.`;

  return { text, data: { total: qrCodes.length, qrCodes } };
}

// Get Quick Replies
async function handleGetQuickReplies(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting quick replies...');
  
  const { data: replies, error } = await supabase
    .from('quick_replies')
    .select('*')
    .order('usage_count', { ascending: false });

  if (error || !replies?.length) {
    return { text: 'Nenhuma resposta rápida configurada.', data: [] };
  }

  const active = replies.filter(r => r.active !== false).length;
  const list = replies.slice(0, 5).map(r => r.title || r.shortcut || 'N/A').join(', ');

  const text = `${replies.length} respostas rápidas (${active} ativas). Mais usadas: ${list}`;

  return { text, data: { total: replies.length, active, replies } };
}

// Get Display Stats - ESTATÍSTICAS DE EXIBIÇÃO (VÍDEOS/VISUALIZAÇÕES)
async function handleGetDisplayStats(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting display stats...');
  
  const { data: buildings, error } = await supabase
    .from('buildings')
    .select('id, nome, visualizacoes_mes, publico_estimado, quantidade_telas')
    .not('visualizacoes_mes', 'is', null)
    .order('visualizacoes_mes', { ascending: false });

  const { data: panels } = await supabase
    .from('painels')
    .select('id, status, last_heartbeat')
    .eq('status', 'ativo');

  const buildingsData = buildings || [];
  const panelsData = panels || [];

  const totalViews = buildingsData.reduce((sum, b) => sum + (b.visualizacoes_mes || 0), 0);
  const totalAudience = buildingsData.reduce((sum, b) => sum + (b.publico_estimado || 0), 0);
  const totalScreens = buildingsData.reduce((sum, b) => sum + (b.quantidade_telas || 0), 0);

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const onlinePanels = panelsData.filter(p => p.last_heartbeat && new Date(p.last_heartbeat) > fiveMinutesAgo).length;

  const topBuildings = buildingsData.slice(0, 5).map(b => 
    `${b.nome}: ${(b.visualizacoes_mes || 0).toLocaleString('pt-BR')} views`
  ).join(', ');

  const text = `ESTATÍSTICAS DE EXIBIÇÃO: ` +
    `${totalViews.toLocaleString('pt-BR')} visualizações este mês. ` +
    `Público estimado: ${totalAudience.toLocaleString('pt-BR')} pessoas. ` +
    `${totalScreens} telas ativas em ${buildingsData.length} prédios. ` +
    `${onlinePanels} painéis online agora. ` +
    `Top prédios: ${topBuildings || 'N/A'}`;

  return { 
    text, 
    data: { 
      totalViews, 
      totalAudience, 
      totalScreens, 
      buildingsWithData: buildingsData.length,
      onlinePanels,
      buildings: buildingsData.slice(0, 10) 
    } 
  };
}

// Get Portfolio
async function handleGetPortfolio(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting portfolio...');
  
  const { data: portfolio, error } = await supabase
    .from('campanhas_portfolio')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !portfolio?.length) {
    return { text: 'Nenhum item de portfolio encontrado.', data: [] };
  }

  const categories: Record<string, number> = {};
  portfolio.forEach(p => {
    categories[p.categoria || 'outros'] = (categories[p.categoria || 'outros'] || 0) + 1;
  });

  const categorySummary = Object.entries(categories)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(', ');

  const text = `${portfolio.length} itens no portfolio. Por categoria: ${categorySummary}`;

  return { text, data: { total: portfolio.length, categories, portfolio } };
}

// Get Agents Config
async function handleGetAgentsConfig(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting agents config...');
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !agents?.length) {
    return { text: 'Nenhum agente IA configurado.', data: [] };
  }

  const active = agents.filter(a => a.is_active).length;
  const list = agents.map(a => `${a.display_name || a.key}: ${a.is_active ? 'ativo' : 'inativo'}`).join(', ');

  const text = `${agents.length} agentes IA configurados (${active} ativos). Agentes: ${list}`;

  return { text, data: { total: agents.length, active, agents } };
}

// Get Cortesias
async function handleGetCortesias(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting cortesias...');
  
  const { data: cortesias, error } = await supabase
    .from('cortesia_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !cortesias?.length) {
    return { text: 'Nenhum código de cortesia encontrado.', data: [] };
  }

  const active = cortesias.filter(c => c.is_active !== false).length;
  const used = cortesias.filter(c => c.used_at).length;

  const text = `${cortesias.length} códigos de cortesia (${active} ativos, ${used} usados).`;

  return { text, data: { total: cortesias.length, active, used, cortesias } };
}

// ==================== NOVOS INTENTS - CONTEXTO E APRENDIZADO ====================

// Get User Context - Rastrear onde o usuário está
async function handleGetUserContext(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting user context...', params);
  
  const email = params?.email;
  const userId = params?.user_id;
  
  if (!email && !userId) {
    return { text: 'Preciso do email ou ID do usuário para rastrear.', data: null };
  }

  // Buscar usuário
  let targetUser: any = null;
  if (email) {
    const { data: user } = await supabase
      .from('users')
      .select('id, nome, email, role')
      .eq('email', email)
      .single();
    targetUser = user;
  } else if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('id, nome, email, role')
      .eq('id', userId)
      .single();
    targetUser = user;
  }

  if (!targetUser) {
    return { text: `Usuário ${email || userId} não encontrado.`, data: null };
  }

  // Buscar última atividade/comportamento
  const { data: activity } = await supabase
    .from('user_behavior_tracking')
    .select('page_url, page_title, event_type, time_spent_seconds, created_at, metadata')
    .eq('user_id', targetUser.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Buscar sessão ativa
  const { data: session } = await supabase
    .from('active_sessions_monitor')
    .select('*')
    .eq('user_id', targetUser.id)
    .eq('is_active', true)
    .order('last_activity', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Buscar ações recentes
  const { data: recentActions } = await supabase
    .from('system_activity_feed')
    .select('activity_type, action, entity_type, details, created_at')
    .eq('user_id', targetUser.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const currentPage = activity?.[0];
  const isOnline = session?.is_active && session?.last_activity && 
    (new Date().getTime() - new Date(session.last_activity).getTime()) < 15 * 60 * 1000; // 15 min

  let text = `Contexto de ${targetUser.nome || targetUser.email}: `;
  
  if (isOnline) {
    text += `ONLINE agora. `;
    if (currentPage) {
      text += `Está na página "${currentPage.page_title || currentPage.page_url}". `;
      text += `Tempo na página: ${currentPage.time_spent_seconds || 0} segundos. `;
    }
  } else {
    text += `OFFLINE. `;
    if (activity?.length) {
      text += `Última atividade em ${timeAgo(activity[0].created_at)}: ${activity[0].page_title || activity[0].page_url}. `;
    } else {
      text += `Sem atividade registrada recente. `;
    }
  }

  // Resumo de ações recentes
  if (recentActions?.length) {
    const actionsList = recentActions.slice(0, 3).map(a => a.action || a.activity_type).join(', ');
    text += `Ações recentes: ${actionsList}. `;
  }

  // Resumo das páginas mais visitadas
  if (activity?.length) {
    const pagesVisited = [...new Set(activity.map(a => a.page_title || a.page_url?.split('/').pop()))].slice(0, 3);
    text += `Páginas visitadas: ${pagesVisited.join(', ')}.`;
  }

  return { 
    text, 
    data: { 
      user: targetUser,
      isOnline,
      currentPage, 
      recentActivity: activity, 
      session,
      recentActions
    } 
  };
}

// Sofia Learn - Registrar aprendizado
async function handleSofiaLearn(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Learning...', params);
  
  const { category, topic, content, user_id, confidence, source } = params;
  
  if (!category || !topic || !content) {
    return { text: 'Preciso de categoria, tópico e conteúdo para aprender.', data: null };
  }

  const { data: learning, error } = await supabase
    .from('sofia_learning')
    .insert({
      user_id: user_id || null,
      category,
      topic,
      content,
      confidence: confidence || 0.7,
      source: source || 'conversation',
      metadata: params.metadata || {},
      learned_from_user_id: params.learned_from || null
    })
    .select()
    .single();

  if (error) {
    console.error('[Sofia JARVIS] Learning error:', error);
    return { text: `Não consegui salvar esse aprendizado: ${error.message}`, data: null };
  }

  return { 
    text: `Guardei esse conhecimento sobre "${topic}" (categoria: ${category}). Confiança: ${(confidence || 0.7) * 100}%. Vou lembrar disso!`, 
    data: learning 
  };
}

// Get Sofia Knowledge - Buscar conhecimento acumulado
async function handleGetSofiaKnowledge(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting knowledge...', params);
  
  const { topic, category, user_id, search } = params;

  let query = supabase
    .from('sofia_learning')
    .select('*')
    .eq('is_active', true)
    .order('confidence', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  if (topic) query = query.ilike('topic', `%${topic}%`);
  if (category) query = query.eq('category', category);
  if (user_id) query = query.eq('user_id', user_id);
  if (search) query = query.or(`topic.ilike.%${search}%,content.ilike.%${search}%`);

  const { data: knowledge, error } = await query;

  if (error) {
    return { text: `Erro ao buscar conhecimento: ${error.message}`, data: [] };
  }

  if (!knowledge?.length) {
    return { text: 'Ainda não tenho conhecimento guardado sobre isso.', data: [] };
  }

  // Agrupar por categoria
  const byCategory: Record<string, any[]> = {};
  knowledge.forEach(k => {
    if (!byCategory[k.category]) byCategory[k.category] = [];
    byCategory[k.category].push(k);
  });

  const categorySummary = Object.entries(byCategory)
    .map(([cat, items]) => `${cat}: ${items.length}`)
    .join(', ');

  const items = knowledge.slice(0, 5).map(k => 
    `• ${k.topic}: ${k.content.substring(0, 60)}... (${Math.round(k.confidence * 100)}% confiança)`
  ).join('\n');

  const text = `Encontrei ${knowledge.length} conhecimentos${topic ? ` sobre "${topic}"` : ''}. Por categoria: ${categorySummary}. Top 5:\n${items}`;

  return { text, data: { total: knowledge.length, byCategory, knowledge } };
}

// Get Admin Session - Contexto do admin atual
async function handleGetAdminSession(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting admin session context...');

  // Buscar sessões ativas de admins
  const { data: sessions } = await supabase
    .from('active_sessions_monitor')
    .select('*, users(nome, email, role)')
    .eq('is_active', true)
    .order('last_activity', { ascending: false })
    .limit(10);

  if (!sessions?.length) {
    return { text: 'Nenhum admin online no momento.', data: null };
  }

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const activeAdmins = sessions.filter(s => {
    const user = s.users as any;
    const isAdmin = ['admin', 'super_admin'].includes(user?.role);
    const isRecent = s.last_activity && new Date(s.last_activity) > fifteenMinutesAgo;
    return isAdmin && isRecent;
  });

  if (!activeAdmins.length) {
    return { text: 'Nenhum admin ativo nos últimos 15 minutos.', data: { sessions } };
  }

  // Para cada admin ativo, buscar a página atual
  const adminsWithContext = await Promise.all(activeAdmins.slice(0, 5).map(async (session) => {
    const user = session.users as any;
    
    // Buscar última atividade
    const { data: activity } = await supabase
      .from('user_behavior_tracking')
      .select('page_url, page_title, time_spent_seconds')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Buscar ações recentes
    const { data: actions } = await supabase
      .from('system_activity_feed')
      .select('action, entity_type, created_at')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false })
      .limit(3);

    return {
      ...session,
      userName: user?.nome || user?.email,
      userEmail: user?.email,
      userRole: user?.role,
      currentPage: activity?.page_title || activity?.page_url || 'desconhecida',
      recentActions: actions
    };
  }));

  const adminList = adminsWithContext.map(a => 
    `${a.userName} (${a.userRole}): página "${a.currentPage}", ações: ${a.recentActions?.map(r => r.action).join(', ') || 'nenhuma'}`
  ).join('. ');

  const text = `${activeAdmins.length} admin(s) online agora. ${adminList}`;

  return { 
    text, 
    data: { 
      activeAdmins: adminsWithContext.length,
      admins: adminsWithContext,
      allSessions: sessions
    } 
  };
}

// Get Today's Eduardo Conversations - Conversas do Eduardo HOJE especificamente
async function handleEduardoToday(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting Eduardo conversations for TODAY...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Buscar conversas do Eduardo hoje
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id, contact_name, contact_phone, status, last_message_at, awaiting_response, agent_key,
      messages(id, direction, created_at)
    `)
    .eq('agent_key', 'eduardo')
    .gte('last_message_at', todayISO)
    .order('last_message_at', { ascending: false });

  if (error) {
    return { text: `Erro ao buscar conversas: ${error.message}`, data: [] };
  }

  if (!conversations?.length) {
    // Verificar se Eduardo tem conversas em geral
    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id, last_message_at')
      .eq('agent_key', 'eduardo')
      .order('last_message_at', { ascending: false })
      .limit(5);

    if (allConversations?.length) {
      const lastConv = allConversations[0];
      return { 
        text: `Eduardo não teve conversas HOJE (${formatDate(todayISO)}). A última conversa foi ${timeAgo(lastConv.last_message_at)}. Total de conversas recentes: ${allConversations.length}.`, 
        data: { todayCount: 0, recentConversations: allConversations } 
      };
    }

    return { text: `Eduardo não tem conversas registradas hoje (${formatDate(todayISO)}).`, data: [] };
  }

  const awaitingResponse = conversations.filter(c => c.awaiting_response).length;
  const totalMessages = conversations.reduce((sum, c) => sum + ((c.messages as any[])?.length || 0), 0);

  const convList = conversations.slice(0, 5).map(c => {
    const msgs = c.messages as any[];
    return `${c.contact_name} (${msgs?.length || 0} msgs) - ${c.awaiting_response ? '⏳ aguardando' : '✓'} - ${timeAgo(c.last_message_at)}`;
  }).join('. ');

  const text = `Eduardo teve ${conversations.length} conversas HOJE (${formatDate(todayISO)}). ` +
    `${totalMessages} mensagens no total. ${awaitingResponse} aguardando resposta. ` +
    `Conversas: ${convList}`;

  return { 
    text, 
    data: { 
      todayCount: conversations.length, 
      totalMessages,
      awaitingResponse, 
      conversations 
    } 
  };
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  console.log(`[Sofia JARVIS] ${req.method} request received at ${new Date().toISOString()}`);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // GET endpoint for testing
  if (req.method === 'GET') {
    console.log('[Sofia JARVIS] Health check request');
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Sofia JARVIS is running',
      timestamp: new Date().toISOString(),
      version: '2.0'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const bodyText = await req.text();
    console.log('[Sofia JARVIS] Raw body received:', bodyText);
    
    const body = JSON.parse(bodyText);
    const intent = body.intent;
    
    // Support both params (object) and params_json (string from ElevenLabs)
    let params = body.params || {};
    if (body.params_json && typeof body.params_json === 'string') {
      try {
        params = JSON.parse(body.params_json);
      } catch (e) {
        console.log('[Sofia JARVIS] Failed to parse params_json, using empty params');
        params = {};
      }
    }
    
    console.log(`[Sofia JARVIS] Intent: ${intent}`, params);

    let result: { text: string; data: any };

    switch (intent) {
      case 'overview':
        result = await handleOverview();
        break;
      case 'query_buildings':
        result = await handleQueryBuildings(params);
        break;
      case 'building_details':
        result = await handleBuildingDetails(params);
        break;
      case 'panel_status':
        result = await handlePanelStatus(params);
        break;
      case 'sales_metrics':
        result = await handleSalesMetrics(params);
        break;
      case 'read_conversation':
        result = await handleReadConversation(params);
        break;
      case 'agent_conversations':
        result = await handleAgentConversations(params);
        break;
      case 'search_conversations':
        result = await handleSearchConversations(params);
        break;
      case 'get_contracts':
        result = await handleGetContracts(params);
        break;
      case 'financial_summary':
        result = await handleFinancialSummary(params);
        break;
      case 'overdue_payments':
        result = await handleOverduePayments();
        break;
      case 'get_leads':
        result = await handleGetLeads(params);
        break;
      case 'search_client':
        result = await handleSearchClient(params);
        break;
      case 'client_details':
        result = await handleClientDetails(params);
        break;
      case 'crm_notes':
        result = await handleCrmNotes(params);
        break;
      case 'get_coupons':
        result = await handleGetCoupons();
        break;
      case 'get_alerts':
        result = await handleGetAlerts();
        break;
      case 'get_proposals':
        result = await handleGetProposals(params);
        break;
      // ========== PROPOSAL DETAIL INTENTS ==========
      case 'proposal_details':
      case 'detalhes_proposta':
      case 'proposta_detalhes':
        result = await handleGetProposalDetails(params);
        break;
      case 'proposal_vs_pedido':
      case 'proposta_pedido':
      case 'diferenca_proposta_pedido':
      case 'proposta_vs_pedido':
      case 'o_que_e_proposta':
        result = await handleProposalVsPedido(params);
        break;
      case 'proposal_timeline':
      case 'timeline_proposta':
      case 'historico_proposta':
      case 'proposta_timeline':
        result = await handleProposalTimeline(params);
        break;
      case 'propostas_quentes':
      case 'hot_proposals':
      case 'visualizando_agora':
      case 'quem_esta_vendo':
      case 'propostas_ativas':
        result = await handlePropostasQuentes(params);
        break;
      case 'order_details':
        result = await handleOrderDetails(params);
        break;
      case 'get_videos':
        result = await handleGetVideos(params);
        break;
      case 'email_history':
        result = await handleEmailHistory(params);
        break;
      case 'daily_metrics':
        result = await handleDailyMetrics();
        break;
      // ========== ADMIN MASTER INTENTS ==========
      case 'conversation_heat_analysis':
        result = await handleConversationHeatAnalysis();
        break;
      case 'leads_at_risk':
        result = await handleLeadsAtRisk();
        break;
      case 'abandoned_leads':
        result = await handleAbandonedLeads();
        break;
      case 'full_financial_report':
        result = await handleFullFinancialReport();
        break;
      case 'agent_performance':
        result = await handleAgentPerformance();
        break;
      case 'contract_status_full':
        result = await handleContractStatusFull();
        break;
      // ========== NEW INTENTS - COMPLETE SYSTEM ACCESS ==========
      case 'company_info':
        result = await handleCompanyInfo();
        break;
      case 'get_benefits':
        result = await handleGetBenefits();
        break;
      case 'get_providers':
        result = await handleGetProviders();
        break;
      case 'get_campaigns':
        result = await handleGetCampaigns(params);
        break;
      case 'campaign_details':
        result = await handleCampaignDetails(params);
        break;
      case 'get_products':
        result = await handleGetProducts();
        break;
      case 'get_users':
        result = await handleGetUsers(params);
        break;
      case 'user_details':
        result = await handleUserDetails(params);
        break;
      case 'get_sindicos':
        result = await handleGetSindicos();
        break;
      case 'get_logos':
        result = await handleGetLogos();
        break;
      case 'get_homepage_config':
        result = await handleGetHomepageConfig();
        break;
      case 'get_notifications':
        result = await handleGetNotifications(params);
        break;
      case 'get_parcelas':
        result = await handleGetParcelas(params);
        break;
      case 'get_assinaturas':
        result = await handleGetAssinaturas();
        break;
      case 'get_conversation_analytics':
        result = await handleGetConversationAnalytics();
        break;
      case 'get_security_logs':
        result = await handleGetSecurityLogs();
        break;
      case 'get_email_templates':
        result = await handleGetEmailTemplates();
        break;
      case 'get_generated_reports':
        result = await handleGetGeneratedReports();
        break;
      case 'get_escalacao':
        result = await handleGetEscalacao();
        break;
      case 'get_qr_codes':
        result = await handleGetQrCodes();
        break;
      case 'get_quick_replies':
        result = await handleGetQuickReplies();
        break;
      case 'get_display_stats':
        result = await handleGetDisplayStats();
        break;
      case 'get_portfolio':
        result = await handleGetPortfolio();
        break;
      case 'get_agents_config':
        result = await handleGetAgentsConfig();
        break;
      case 'get_cortesias':
        result = await handleGetCortesias();
        break;
      // ========== NOVOS INTENTS - CONTEXTO E APRENDIZADO ==========
      case 'get_user_context':
      case 'user_context':
      case 'where_is_user':
      case 'rastrear_usuario':
      case 'track_user':
        result = await handleGetUserContext(params);
        break;
      case 'sofia_learn':
      case 'learn':
      case 'remember':
      case 'aprender':
      case 'lembrar':
        result = await handleSofiaLearn(params);
        break;
      case 'get_sofia_knowledge':
      case 'knowledge':
      case 'what_do_you_know':
      case 'conhecimento':
      case 'o_que_sabe':
        result = await handleGetSofiaKnowledge(params);
        break;
      case 'get_admin_session':
      case 'admin_context':
      case 'current_admin':
      case 'admins_online':
      case 'quem_esta_online':
        result = await handleGetAdminSession(params);
        break;
      case 'eduardo_today':
      case 'eduardo_hoje':
      case 'conversas_eduardo_hoje':
        result = await handleEduardoToday();
        break;
      // ========== ALIASES / SYNONYMS ==========
      case 'building_info':
      case 'buildings':
      case 'predios':
        result = await handleQueryBuildings(params);
        break;
      case 'contract_details':
      case 'contracts':
      case 'contratos':
        result = await handleGetContracts(params);
        break;
      case 'recent_conversations':
      case 'conversations':
      case 'conversas':
        result = await handleAgentConversations(params);
        break;
      case 'leads_summary':
      case 'leads':
        result = await handleGetLeads(params);
        break;
      case 'system_health':
      case 'health':
      case 'status':
        result = await handleOverview();
        break;
      // ========== PROPOSTAS - TODOS OS ALIASES ==========
      case 'proposals':
      case 'propostas':
      case 'listar_propostas':
      case 'ver_propostas':
      case 'minhas_propostas':
      case 'todas_propostas':
        result = await handleGetProposals(params);
        break;
      case 'proposta':
        // Se tem parâmetro específico, busca detalhes, senão lista
        if (params?.number || params?.proposal_id || params?.client_name) {
          result = await handleGetProposalDetails(params);
        } else {
          result = await handleGetProposals(params);
        }
        break;
      // ========== PAINÉIS - TODOS OS ALIASES ==========
      case 'paineis':
      case 'panels':
      case 'paineis_status':
      case 'panel_status':
      case 'status_paineis':
      case 'dispositivos':
      case 'devices':
      case 'telas':
      case 'monitores':
      case 'paineis_online':
      case 'paineis_offline':
        result = await handlePanelStatus(params);
        break;
      // ========== FINANCEIRO - TODOS OS ALIASES ==========
      case 'financeiro':
      case 'financial':
      case 'financas':
      case 'dinheiro':
      case 'receita':
      case 'faturamento':
        result = await handleFinancialSummary(params);
        break;
      // ========== PEDIDOS/VENDAS - TODOS OS ALIASES ==========
      case 'pedidos':
      case 'orders':
      case 'vendas':
      case 'sales':
      case 'compras':
      case 'ordens':
        result = await handleSalesMetrics(params);
        break;
      // ========== VÍDEOS - TODOS OS ALIASES ==========
      case 'videos':
      case 'video':
      case 'midias':
      case 'media':
      case 'conteudo':
        result = await handleGetVideos(params);
        break;
      // ========== DASHBOARD/OVERVIEW - TODOS OS ALIASES ==========
      case 'dashboard':
      case 'inicio':
      case 'home':
      case 'resumo':
      case 'geral':
      case 'visao_geral':
        result = await handleOverview();
        break;
      // ========== USUÁRIOS - TODOS OS ALIASES ==========
      case 'usuarios':
      case 'users':
      case 'equipe':
      case 'time':
      case 'colaboradores':
      case 'admins':
        result = await handleGetUsers(params);
        break;
      // ========== CLIENTES - TODOS OS ALIASES ==========
      case 'clientes':
      case 'clients':
      case 'cliente':
      case 'client':
      case 'anunciantes':
        result = await handleSearchClient(params);
        break;
      // ========== RELATÓRIOS - TODOS OS ALIASES ==========
      case 'relatorios':
      case 'reports':
      case 'analytics':
      case 'metricas':
      case 'estatisticas':
        result = await handleDailyMetrics();
        break;
      // ========== CONFIGURAÇÕES - TODOS OS ALIASES ==========
      case 'configuracoes':
      case 'settings':
      case 'config':
      case 'preferencias':
        result = await handleCompanyInfo();
        break;
      // ========== FLUXO PROPOSTA → PEDIDO → CONTRATO ==========
      case 'explicar_fluxo':
      case 'fluxo':
      case 'fluxo_proposta':
      case 'fluxo_sistema':
      case 'como_funciona':
      case 'proposta_vs_pedido':
      case 'proposta_vs_contrato':
      case 'pedido_vs_contrato':
      case 'diferenca_proposta_pedido':
      case 'diferenca_proposta_contrato':
      case 'o_que_e_proposta':
      case 'o_que_e_pedido':
      case 'o_que_e_contrato':
        result = await handleExplicarFluxo();
        break;
      case 'proposta_com_contrato':
      case 'propostas_convertidas_contrato':
      case 'propostas_que_viraram_contrato':
        result = await handlePropostaComContrato();
        break;
      default:
        result = { text: `Não entendi a consulta "${intent}". Posso ajudar com: visão geral (overview), prédios, painéis, vendas, conversas, contratos, financeiro, leads, clientes, cupons, alertas, PROPOSTAS (detalhes, timeline, quem está vendo), FLUXO (diferença proposta vs pedido vs contrato), vídeos, emails, benefícios, prestadores, campanhas, produtos, usuários, síndicos, logos, configurações, notificações, parcelas, assinaturas, analytics, segurança, templates, relatórios, escalação, QR codes, respostas rápidas, estatísticas de exibição, portfolio, agentes IA, cortesias, informações da empresa, rastrear usuário, aprendizado da Sofia, conhecimento acumulado, e contexto do admin.`, data: null };
    }

    console.log(`[Sofia JARVIS] Response:`, result.text.substring(0, 100) + '...');

    // Aplicar truncamento para evitar cortes no ElevenLabs
    const responseText = truncateForVoice(result.text);

    return new Response(JSON.stringify({
      success: true,
      response_text: responseText,
      data: result.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Sofia JARVIS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      response_text: 'Desculpe, ocorreu um erro ao processar sua consulta.',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
