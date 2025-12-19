import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`\n════════════════════════════════════════`);
  console.log(`[SOFIA-CLIENT] ${requestId} - Request received`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const intent = body.intent || 'unknown';
    const params = body.params || {};
    const userId = body.user_id;

    console.log(`[${requestId}] Intent: ${intent}`);
    console.log(`[${requestId}] Params:`, JSON.stringify(params));
    console.log(`[${requestId}] User ID: ${userId || 'not provided'}`);

    // Create Supabase client with service role for database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    let result: { text: string; data?: any; action?: any } = {
      text: 'Desculpe, não entendi sua solicitação.',
    };

    switch (intent) {
      case 'meus_pedidos':
      case 'status_pedidos':
        result = await handleMeusPedidos(supabase, userId, requestId);
        break;

      case 'status_pedido':
        result = await handleStatusPedido(supabase, userId, params.pedido_id, requestId);
        break;

      case 'meus_videos':
      case 'status_video':
        result = await handleMeusVideos(supabase, userId, params.pedido_id, requestId);
        break;

      case 'explicar_produto':
        result = handleExplicarProduto(params.produto_tipo || params.tipo);
        break;

      case 'formas_pagamento':
        result = handleFormasPagamento();
        break;

      case 'navegar':
        result = handleNavegacao(params.pagina);
        break;

      case 'gerar_qrcode':
        result = await handleGerarQRCode(supabase, userId, params.pedido_id, requestId);
        break;

      case 'meus_contratos':
        result = await handleMeusContratos(supabase, userId, requestId);
        break;

      case 'suporte':
        result = handleSuporte();
        break;

      case 'ajuda':
        result = handleAjuda();
        break;

      default:
        console.log(`[${requestId}] Unknown intent: ${intent}`);
    }

    console.log(`[${requestId}] Response:`, result.text.substring(0, 100) + '...');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(JSON.stringify({
      text: 'Desculpe, ocorreu um erro. Tente novamente.',
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// ============ HANDLERS ============

async function handleMeusPedidos(supabase: any, userId: string, requestId: string) {
  if (!userId) {
    return { text: 'Para consultar seus pedidos, você precisa estar logado.' };
  }

  console.log(`[${requestId}] Fetching orders for user: ${userId}`);

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      status,
      valor_total,
      plano_meses,
      created_at,
      data_inicio,
      data_fim,
      pedido_lista_paineis (
        id,
        buildings:building_id (nome, bairro)
      )
    `)
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(`[${requestId}] Error fetching orders:`, error);
    return { text: 'Erro ao buscar seus pedidos. Tente novamente.' };
  }

  if (!pedidos?.length) {
    return {
      text: 'Você ainda não tem pedidos. Quer que eu te leve até a página de prédios para começar?',
      action: { type: 'navigate', page: 'ver_predios' },
    };
  }

  const statusMap: Record<string, string> = {
    'pendente': '⏳ Pendente',
    'aguardando_video': '📹 Aguardando vídeo',
    'em_analise': '🔍 Em análise',
    'ativo': '✅ Ativo',
    'finalizado': '✔️ Finalizado',
    'cancelado': '❌ Cancelado',
  };

  const summary = pedidos.map((p: any) => {
    const status = statusMap[p.status] || p.status;
    const predios = p.pedido_lista_paineis?.map((pl: any) => pl.buildings?.nome).filter(Boolean).slice(0, 2).join(', ') || 'Prédios';
    return `• Pedido ${p.id.slice(0, 8)}: ${status} - ${predios} (${p.plano_meses} meses)`;
  }).join('\n');

  const ativos = pedidos.filter((p: any) => p.status === 'ativo').length;
  const aguardando = pedidos.filter((p: any) => p.status === 'aguardando_video').length;

  let intro = `Você tem ${pedidos.length} pedido(s)`;
  if (ativos > 0) intro += `, ${ativos} ativo(s)`;
  if (aguardando > 0) intro += `, ${aguardando} aguardando vídeo`;
  intro += ':\n\n';

  return {
    text: intro + summary,
    data: pedidos,
    action: aguardando > 0 ? { type: 'navigate', page: 'enviar_video', label: 'Enviar vídeo' } : null,
  };
}

async function handleStatusPedido(supabase: any, userId: string, pedidoId: string, requestId: string) {
  if (!userId) {
    return { text: 'Para consultar o status do pedido, você precisa estar logado.' };
  }

  const query = supabase
    .from('pedidos')
    .select(`
      *,
      pedido_lista_paineis (
        id,
        buildings:building_id (nome, bairro, endereco)
      ),
      pedido_videos (
        id,
        status,
        video_url,
        rejection_reason
      ),
      parcelas (
        id,
        numero_parcela,
        valor,
        data_vencimento,
        status
      )
    `)
    .eq('client_id', userId);

  if (pedidoId) {
    query.eq('id', pedidoId);
  }

  const { data: pedido, error } = await query.order('created_at', { ascending: false }).limit(1).single();

  if (error || !pedido) {
    return { text: 'Não encontrei esse pedido ou você não tem acesso a ele.' };
  }

  const statusLabels: Record<string, string> = {
    'pendente': 'Aguardando pagamento',
    'aguardando_video': 'Falta enviar o vídeo',
    'em_analise': 'Vídeo em análise pela equipe',
    'ativo': 'Campanha está no ar!',
    'finalizado': 'Campanha finalizada',
    'cancelado': 'Pedido cancelado',
  };

  const predios = pedido.pedido_lista_paineis?.map((p: any) => p.buildings?.nome).filter(Boolean).join(', ');
  const video = pedido.pedido_videos?.[0];
  const parcelasPendentes = pedido.parcelas?.filter((p: any) => p.status !== 'pago').length || 0;

  let text = `📋 **Pedido ${pedido.id.slice(0, 8)}**\n`;
  text += `Status: ${statusLabels[pedido.status] || pedido.status}\n`;
  text += `Prédios: ${predios || 'N/A'}\n`;
  text += `Plano: ${pedido.plano_meses} meses\n`;
  text += `Valor: R$ ${pedido.valor_total?.toLocaleString('pt-BR')}\n`;

  if (video) {
    text += `\n📹 Vídeo: ${video.status === 'approved' ? 'Aprovado ✅' : video.status === 'rejected' ? 'Rejeitado ❌' : 'Em análise 🔍'}`;
    if (video.rejection_reason) {
      text += `\nMotivo: ${video.rejection_reason}`;
    }
  } else if (pedido.status === 'aguardando_video') {
    text += '\n⚠️ Envie seu vídeo para ativar a campanha!';
  }

  if (parcelasPendentes > 0) {
    text += `\n💳 ${parcelasPendentes} parcela(s) pendente(s)`;
  }

  const action = pedido.status === 'aguardando_video' && !video
    ? { type: 'navigate', page: 'enviar_video', pedido_id: pedido.id, label: 'Enviar Vídeo' }
    : null;

  return { text, data: pedido, action };
}

async function handleMeusVideos(supabase: any, userId: string, pedidoId: string | null, requestId: string) {
  if (!userId) {
    return { text: 'Para consultar seus vídeos, você precisa estar logado.' };
  }

  let query = supabase
    .from('pedido_videos')
    .select(`
      id,
      status,
      video_url,
      rejection_reason,
      created_at,
      pedidos!inner (
        id,
        client_id,
        status
      )
    `)
    .eq('pedidos.client_id', userId)
    .order('created_at', { ascending: false });

  if (pedidoId) {
    query = query.eq('pedido_id', pedidoId);
  }

  const { data: videos, error } = await query.limit(10);

  if (error) {
    console.error(`[${requestId}] Error fetching videos:`, error);
    return { text: 'Erro ao buscar seus vídeos.' };
  }

  if (!videos?.length) {
    return {
      text: 'Você ainda não enviou nenhum vídeo. Tem um pedido aguardando vídeo?',
      action: { type: 'navigate', page: 'meus_pedidos' },
    };
  }

  const statusMap: Record<string, string> = {
    'pending': '🕐 Aguardando análise',
    'approved': '✅ Aprovado',
    'rejected': '❌ Rejeitado',
    'processing': '⚙️ Processando',
  };

  const summary = videos.map((v: any) => {
    const status = statusMap[v.status] || v.status;
    const date = new Date(v.created_at).toLocaleDateString('pt-BR');
    return `• Vídeo ${v.id.slice(0, 6)} (${date}): ${status}`;
  }).join('\n');

  const aprovados = videos.filter((v: any) => v.status === 'approved').length;
  const rejeitados = videos.filter((v: any) => v.status === 'rejected').length;

  let text = `Você tem ${videos.length} vídeo(s):\n${summary}`;
  
  if (rejeitados > 0) {
    const rejeitado = videos.find((v: any) => v.status === 'rejected');
    if (rejeitado?.rejection_reason) {
      text += `\n\n⚠️ Motivo da rejeição: ${rejeitado.rejection_reason}`;
    }
  }

  return { text, data: videos };
}

function handleExplicarProduto(tipo: string) {
  if (tipo === 'horizontal' || tipo === 'painel_horizontal') {
    return {
      text: `📺 **Painel Horizontal**

• Formato: 1440×1080 pixels (proporção 4:3)
• Duração: 10 segundos por exibição
• Compartilhado: Até 15 anunciantes por painel
• Ideal para: Mensagens rápidas e objetivas
• Vantagem: Custo mais acessível por compartilhar o espaço

O painel horizontal fica nos elevadores e exibe seu anúncio alternando com outros anunciantes. Ótimo para aumentar a visibilidade da sua marca!`,
    };
  }

  if (tipo === 'vertical' || tipo === 'vertical_premium' || tipo === 'premium') {
    return {
      text: `📱 **Painel Vertical Premium**

• Formato: 1080×1920 pixels (proporção 9:16, estilo celular)
• Duração: 15 segundos por exibição
• EXCLUSIVO: 100% do tempo de tela é seu!
• Ideal para: Impacto máximo e campanhas premium
• Vantagem: Atenção total do público, sem divisão

O vertical premium é o formato mais impactante! Seu anúncio ocupa 100% do tempo, garantindo máxima visibilidade. Perfeito para lançamentos e campanhas importantes.`,
    };
  }

  return {
    text: `Temos dois tipos de painéis:

📺 **Horizontal**: Compartilhado, 10 segundos, custo acessível
📱 **Vertical Premium**: Exclusivo, 15 segundos, máximo impacto

Qual você gostaria de conhecer melhor?`,
  };
}

function handleFormasPagamento() {
  return {
    text: `💳 **Formas de Pagamento**

1. **PIX** (Recomendado)
   • 5% de desconto
   • Pagamento instantâneo
   • QR Code gerado na hora

2. **Cartão de Crédito**
   • Parcelamento em até 12x
   • Aprovação imediata
   • Todas as bandeiras

3. **Boleto Bancário**
   • Vencimento em 3 dias úteis
   • Comprovante por email

Qual forma você prefere? Posso gerar um QR code PIX agora mesmo!`,
    action: { type: 'prompt', options: ['PIX', 'Cartão', 'Boleto'] },
  };
}

function handleNavegacao(pagina: string) {
  const routes: Record<string, { path: string; label: string; description: string }> = {
    'meus_pedidos': {
      path: '/advertiser/meus-pedidos',
      label: 'Meus Pedidos',
      description: 'Ver todos os seus pedidos e status',
    },
    'enviar_video': {
      path: '/advertiser/meus-pedidos',
      label: 'Enviar Vídeo',
      description: 'Upload do vídeo para seu pedido',
    },
    'ver_predios': {
      path: '/advertiser/predios',
      label: 'Ver Prédios',
      description: 'Explorar prédios disponíveis para anunciar',
    },
    'perfil': {
      path: '/advertiser/profile',
      label: 'Meu Perfil',
      description: 'Dados da sua conta',
    },
    'carrinho': {
      path: '/advertiser/carrinho',
      label: 'Carrinho',
      description: 'Itens selecionados para compra',
    },
    'suporte': {
      path: '/advertiser/suporte',
      label: 'Suporte',
      description: 'Falar com nossa equipe',
    },
    'dashboard': {
      path: '/advertiser',
      label: 'Dashboard',
      description: 'Página inicial',
    },
  };

  const route = routes[pagina];
  if (!route) {
    return {
      text: `Não encontrei essa página. Posso te levar para: ${Object.keys(routes).join(', ')}`,
    };
  }

  return {
    text: `Claro! Vou abrir a página "${route.label}" para você.`,
    action: {
      type: 'navigate',
      page: pagina,
      path: route.path,
      label: route.label,
      description: route.description,
    },
  };
}

async function handleGerarQRCode(supabase: any, userId: string, pedidoId: string | null, requestId: string) {
  if (!userId) {
    return { text: 'Para gerar um QR code de pagamento, você precisa estar logado.' };
  }

  // Find pending order if no pedidoId provided
  if (!pedidoId) {
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, valor_total, status')
      .eq('client_id', userId)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!pedido) {
      return { text: 'Não encontrei nenhum pedido pendente para gerar o QR code.' };
    }
    pedidoId = pedido.id;
  }

  // Get order details
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('id, valor_total, status')
    .eq('id', pedidoId)
    .eq('client_id', userId)
    .single();

  if (!pedido) {
    return { text: 'Não encontrei esse pedido ou você não tem acesso a ele.' };
  }

  return {
    text: `💰 QR Code PIX para o pedido ${pedido.id.slice(0, 8)}\n\nValor: R$ ${pedido.valor_total?.toLocaleString('pt-BR')}\n\nO QR code será exibido na tela. Escaneie com o app do seu banco!`,
    action: {
      type: 'qrcode',
      pedido_id: pedido.id,
      valor: pedido.valor_total,
    },
  };
}

async function handleMeusContratos(supabase: any, userId: string, requestId: string) {
  if (!userId) {
    return { text: 'Para ver seus contratos, você precisa estar logado.' };
  }

  const { data: contratos, error } = await supabase
    .from('contratos_legais')
    .select('id, status, numero_contrato, created_at, valor_total')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(`[${requestId}] Error fetching contracts:`, error);
    return { text: 'Erro ao buscar seus contratos.' };
  }

  if (!contratos?.length) {
    return { text: 'Você ainda não tem contratos. Os contratos são gerados automaticamente após a confirmação do pagamento.' };
  }

  const statusMap: Record<string, string> = {
    'draft': '📝 Rascunho',
    'pending_signature': '✍️ Aguardando assinatura',
    'signed': '✅ Assinado',
    'cancelled': '❌ Cancelado',
  };

  const summary = contratos.map((c: any) => {
    const status = statusMap[c.status] || c.status;
    const date = new Date(c.created_at).toLocaleDateString('pt-BR');
    return `• Contrato ${c.numero_contrato || c.id.slice(0, 8)} (${date}): ${status}`;
  }).join('\n');

  return {
    text: `📄 Seus contratos:\n\n${summary}`,
    data: contratos,
  };
}

function handleSuporte() {
  return {
    text: `📞 **Precisa de ajuda?**

Nosso time está disponível de segunda a sexta, das 9h às 18h.

• WhatsApp: (11) 99999-9999
• Email: suporte@examidia.com.br

Posso também abrir a página de suporte para você enviar uma mensagem.`,
    action: { type: 'navigate', page: 'suporte', label: 'Abrir Suporte' },
  };
}

function handleAjuda() {
  return {
    text: `🤖 Sou a Sofia, sua assistente virtual!

Posso ajudar você com:
• 📋 Ver seus pedidos e status
• 📹 Status dos seus vídeos
• 📺 Explicar nossos produtos
• 💳 Formas de pagamento
• 🏢 Navegar pelo sistema
• 📄 Ver seus contratos

É só me perguntar! Por exemplo: "Tenho pedido ativo?" ou "Como funciona o painel vertical?"`,
  };
}
