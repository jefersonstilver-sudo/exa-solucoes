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

// ==================== INTENT HANDLERS ====================

// Overview - Visão geral completa do sistema
async function handleOverview(): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting system overview...');
  
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  
  // Parallel queries for speed
  const [
    buildingsResult,
    panelsResult,
    ordersResult,
    leadsResult,
    conversationsResult,
    alertsResult
  ] = await Promise.all([
    supabase.from('buildings').select('id, status').eq('status', 'ativo'),
    supabase.from('painels').select('id, status, last_heartbeat'),
    supabase.from('pedidos').select('id, status, valor_total, created_at').gte('created_at', `${thisMonth}-01`),
    supabase.from('leads_exa').select('id, status, created_at').gte('created_at', `${thisMonth}-01`),
    supabase.from('conversations').select('id, last_message_at').gte('last_message_at', today),
    supabase.from('panel_alerts').select('id, severity').eq('resolved', false)
  ]);

  const buildings = buildingsResult.data || [];
  const panels = panelsResult.data || [];
  const orders = ordersResult.data || [];
  const leads = leadsResult.data || [];
  const conversations = conversationsResult.data || [];
  const alerts = alertsResult.data || [];

  const onlinePanels = panels.filter(p => {
    if (!p.last_heartbeat) return false;
    const lastBeat = new Date(p.last_heartbeat);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastBeat > fiveMinutesAgo;
  });

  const totalRevenue = orders
    .filter(o => ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(o.status))
    .reduce((sum, o) => sum + (o.valor_total || 0), 0);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  const data = {
    buildings: buildings.length,
    panels: { total: panels.length, online: onlinePanels.length },
    monthlyRevenue: totalRevenue,
    monthlyOrders: orders.length,
    monthlyLeads: leads.length,
    todayConversations: conversations.length,
    criticalAlerts
  };

  const text = `Visão geral do sistema: Temos ${buildings.length} prédios ativos, ${onlinePanels.length} de ${panels.length} painéis online. Este mês: faturamento de ${formatCurrency(totalRevenue)}, ${orders.length} pedidos e ${leads.length} leads. Hoje tivemos ${conversations.length} conversas. ${criticalAlerts > 0 ? `Atenção: ${criticalAlerts} alertas críticos ativos.` : 'Sem alertas críticos.'}`;

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

// Panel Status - Status dos painéis
async function handlePanelStatus(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting panel status...');

  const { data: panels, error } = await supabase
    .from('painels')
    .select(`
      id, nome_referencia, status, last_heartbeat, ip_address,
      buildings!painels_predio_id_fkey(nome, bairro)
    `)
    .order('last_heartbeat', { ascending: false, nullsFirst: false })
    .limit(20);

  if (error || !panels?.length) {
    return { text: 'Não encontrei informações de painéis.', data: [] };
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const online = panels.filter(p => p.last_heartbeat && new Date(p.last_heartbeat) > fiveMinutesAgo);
  const offline = panels.filter(p => !p.last_heartbeat || new Date(p.last_heartbeat) <= fiveMinutesAgo);

  let text = `Temos ${panels.length} painéis. ${online.length} online e ${offline.length} offline. `;
  
  if (offline.length > 0 && offline.length <= 5) {
    text += `Painéis offline: ${offline.map(p => p.nome_referencia || 'Sem nome').join(', ')}. `;
  } else if (offline.length > 5) {
    text += `Há ${offline.length} painéis offline. `;
  }

  return { text, data: { total: panels.length, online: online.length, offline: offline.length, panels } };
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

  const agentKey = params?.agent_key || 'eduardo';
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('conversations')
    .select(`
      id, contact_name, phone, status, last_message_at, awaiting_response,
      messages!inner(content, direction, created_at)
    `)
    .eq('agent_key', agentKey)
    .order('last_message_at', { ascending: false })
    .limit(10);

  if (params?.period === 'today') {
    query = query.gte('last_message_at', today);
  }

  const { data: conversations, error } = await query;

  if (error || !conversations?.length) {
    return { text: `Sem conversas recentes do ${agentKey}.`, data: [] };
  }

  const awaitingResponse = conversations.filter(c => c.awaiting_response).length;
  
  const convList = conversations.slice(0, 5).map(c => {
    const lastMsg = Array.isArray(c.messages) && c.messages.length > 0 
      ? c.messages[0]?.content?.substring(0, 50) 
      : 'Sem mensagens';
    return `${c.contact_name}: "${lastMsg}..."`;
  }).join(' | ');

  const text = `${agentKey} tem ${conversations.length} conversas recentes. ${awaitingResponse} aguardando resposta. ` +
    `Conversas: ${convList}`;

  return { text, data: { total: conversations.length, awaitingResponse, conversations } };
}

// Search Conversations - Buscar conversas por termo
async function handleSearchConversations(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Searching conversations...', params);

  if (!params?.query) {
    return { text: 'Informe o termo de busca (nome ou telefone).', data: [] };
  }

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, contact_name, phone, agent_key, status, last_message_at')
    .or(`contact_name.ilike.%${params.query}%,phone.ilike.%${params.query}%`)
    .order('last_message_at', { ascending: false })
    .limit(10);

  if (!conversations?.length) {
    return { text: `Não encontrei conversas com "${params.query}".`, data: [] };
  }

  const list = conversations.map(c => 
    `${c.contact_name} (${c.phone}) - agente ${c.agent_key}, ${timeAgo(c.last_message_at)}`
  ).join('. ');

  return { text: `Encontrei ${conversations.length} conversas. ${list}`, data: conversations };
}

// Get Contracts - Listar contratos
async function handleGetContracts(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting contracts...', params);

  let query = supabase
    .from('contratos_legais')
    .select(`
      id, status, nome_empresa, valor_total, created_at,
      assinado_em, cancelado_em
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data: contracts, error } = await query;

  if (error || !contracts?.length) {
    return { text: 'Não encontrei contratos.', data: [] };
  }

  const pending = contracts.filter(c => c.status === 'pendente').length;
  const signed = contracts.filter(c => c.status === 'assinado').length;

  const list = contracts.slice(0, 5).map(c => 
    `${c.nome_empresa}: ${c.status}, ${formatCurrency(c.valor_total || 0)}`
  ).join('. ');

  const text = `${contracts.length} contratos. ${pending} pendentes, ${signed} assinados. ${list}`;

  return { text, data: { total: contracts.length, pending, signed, contracts } };
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

// Get Proposals - Listar propostas
async function handleGetProposals(params: any): Promise<{ text: string; data: any }> {
  console.log('[Sofia JARVIS] Getting proposals...', params);

  let query = supabase
    .from('proposals')
    .select('id, nome_cliente, email_cliente, status, valor_total, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  const { data: proposals } = await query;

  if (!proposals?.length) {
    return { text: 'Sem propostas encontradas.', data: [] };
  }

  const pending = proposals.filter(p => p.status === 'enviada').length;
  const accepted = proposals.filter(p => p.status === 'aceita').length;

  const list = proposals.slice(0, 5).map(p => 
    `${p.nome_cliente}: ${p.status}, ${formatCurrency(p.valor_total || 0)}`
  ).join('. ');

  return { text: `${proposals.length} propostas. ${pending} pendentes, ${accepted} aceitas. ${list}`, data: proposals };
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

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
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
      default:
        result = { text: `Não entendi a consulta "${intent}". Posso ajudar com: visão geral, prédios, painéis, vendas, conversas, contratos, financeiro, leads, clientes, cupons, alertas, propostas, vídeos ou emails.`, data: null };
    }

    console.log(`[Sofia JARVIS] Response:`, result.text.substring(0, 100) + '...');

    return new Response(JSON.stringify({
      success: true,
      response_text: result.text,
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
