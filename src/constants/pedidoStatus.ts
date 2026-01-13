/**
 * MÁQUINA DE ESTADOS CANÔNICA v1.0
 * 
 * Este arquivo é a ÚNICA FONTE DE VERDADE para status de pedidos.
 * 
 * REGRAS:
 * 1. Nenhum novo status pode ser criado no frontend sem existir aqui
 * 2. Nenhum componente deve ter labels/cores hardcoded - use este mapper
 * 3. A constraint `pedidos_status_check` no banco DEVE refletir exatamente esses valores
 * 
 * FLUXO PADRÃO:
 * pendente → aguardando_contrato → aguardando_video → video_enviado → video_aprovado → ativo → finalizado
 *                                                                                          ↓
 *                                                                                    cancelado/bloqueado
 */

// ============================================================================
// TIPOS
// ============================================================================

export type PedidoStatusCanonical = 
  | 'pendente'
  | 'aguardando_contrato'
  | 'aguardando_video'
  | 'video_enviado'
  | 'video_aprovado'
  | 'ativo'
  | 'finalizado'
  | 'cancelado'
  | 'cancelado_automaticamente'
  | 'bloqueado';

export interface StatusConfig {
  label: string;
  shortLabel: string;
  icon: string;
  className: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  /** Grupo para agrupamento em abas */
  group: 'active' | 'processing' | 'pending' | 'blocked' | 'canceled' | 'completed';
  /** Ordem no fluxo (para ordenação visual) */
  order: number;
}

// ============================================================================
// MAPPER CENTRAL - ÚNICA FONTE DE VERDADE
// ============================================================================

export const PEDIDO_STATUS: Record<PedidoStatusCanonical, StatusConfig> = {
  // ⏳ PENDENTES (Aguardando pagamento)
  pendente: {
    label: 'Aguardando Pagamento',
    shortLabel: 'Pendente',
    icon: '⏳',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    textColor: 'text-orange-800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    description: 'Pedido criado, aguardando confirmação de pagamento',
    group: 'pending',
    order: 1
  },

  // 📄 AGUARDANDO CONTRATO (Pagamento confirmado, contrato pendente)
  aguardando_contrato: {
    label: 'Aguardando Contrato',
    shortLabel: 'Ag. Contrato',
    icon: '📄',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    description: 'Pagamento confirmado, aguardando assinatura do contrato',
    group: 'processing',
    order: 2
  },

  // 📹 AGUARDANDO VÍDEO (Contrato assinado, vídeo pendente)
  aguardando_video: {
    label: 'Aguardando Vídeo',
    shortLabel: 'Ag. Vídeo',
    icon: '📹',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    textColor: 'text-blue-800',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    description: 'Contrato assinado, aguardando envio do vídeo pelo cliente',
    group: 'processing',
    order: 3
  },

  // 📤 VÍDEO ENVIADO (Em análise)
  video_enviado: {
    label: 'Vídeo Enviado',
    shortLabel: 'Enviado',
    icon: '📤',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    textColor: 'text-purple-800',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    description: 'Vídeo enviado pelo cliente, aguardando análise da equipe',
    group: 'processing',
    order: 4
  },

  // ✅ VÍDEO APROVADO (Pronto para ativar)
  video_aprovado: {
    label: 'Vídeo Aprovado',
    shortLabel: 'Aprovado',
    icon: '✅',
    className: 'bg-green-100 text-green-800 border-green-200',
    textColor: 'text-green-800',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    description: 'Vídeo aprovado, campanha pronta para ativação',
    group: 'processing',
    order: 5
  },

  // 🟢 ATIVO (Em exibição)
  ativo: {
    label: 'Em Exibição',
    shortLabel: 'Ativo',
    icon: '🟢',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    description: 'Campanha ativa, vídeo em exibição nos painéis',
    group: 'active',
    order: 6
  },

  // ✔️ FINALIZADO (Período encerrado)
  finalizado: {
    label: 'Finalizado',
    shortLabel: 'Finalizado',
    icon: '✔️',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    description: 'Campanha encerrada, período contratado finalizado',
    group: 'completed',
    order: 7
  },

  // ❌ CANCELADO (Cancelamento manual)
  cancelado: {
    label: 'Cancelado',
    shortLabel: 'Cancelado',
    icon: '❌',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: 'Pedido cancelado manualmente',
    group: 'canceled',
    order: 8
  },

  // ⏰ CANCELADO AUTOMATICAMENTE (Timeout/expiração)
  cancelado_automaticamente: {
    label: 'Cancelado (Auto)',
    shortLabel: 'Cancelado',
    icon: '⏰',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: 'Pedido cancelado automaticamente por timeout ou expiração',
    group: 'canceled',
    order: 9
  },

  // 🔒 BLOQUEADO (Inadimplência ou problema operacional)
  bloqueado: {
    label: 'Bloqueado',
    shortLabel: 'Bloqueado',
    icon: '🔒',
    className: 'bg-red-100 text-red-800 border-red-200',
    textColor: 'text-red-800',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    description: 'Pedido bloqueado por inadimplência ou problema operacional',
    group: 'blocked',
    order: 10
  }
};

// ============================================================================
// FUNÇÕES HELPER
// ============================================================================

/**
 * Obtém a configuração de status.
 * Se o status não for canônico, retorna configuração fallback.
 */
export const getStatusConfig = (status: string): StatusConfig => {
  const config = PEDIDO_STATUS[status as PedidoStatusCanonical];
  
  if (config) {
    return config;
  }
  
  // Fallback para status desconhecido (não deveria acontecer)
  console.warn(`[PEDIDO_STATUS] Status não canônico detectado: "${status}". Adicione ao mapper.`);
  
  return {
    label: status || 'Desconhecido',
    shortLabel: status || '???',
    icon: '❓',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    description: 'Status não mapeado',
    group: 'pending',
    order: 99
  };
};

/**
 * Obtém label formatada do status
 */
export const getStatusLabel = (status: string): string => {
  return getStatusConfig(status).label;
};

/**
 * Obtém ícone do status
 */
export const getStatusIcon = (status: string): string => {
  return getStatusConfig(status).icon;
};

/**
 * Obtém className do status (para Badge)
 */
export const getStatusClassName = (status: string): string => {
  return getStatusConfig(status).className;
};

/**
 * Verifica se um status é canônico (válido)
 */
export const isCanonicalStatus = (status: string): status is PedidoStatusCanonical => {
  return status in PEDIDO_STATUS;
};

/**
 * Lista todos os status canônicos
 */
export const getAllCanonicalStatuses = (): PedidoStatusCanonical[] => {
  return Object.keys(PEDIDO_STATUS) as PedidoStatusCanonical[];
};

/**
 * Obtém status por grupo
 */
export const getStatusesByGroup = (group: StatusConfig['group']): PedidoStatusCanonical[] => {
  return Object.entries(PEDIDO_STATUS)
    .filter(([_, config]) => config.group === group)
    .map(([status]) => status as PedidoStatusCanonical);
};

// ============================================================================
// CONSTANTES PARA USO EM QUERIES
// ============================================================================

/** Status que indicam pagamento confirmado */
export const PAID_STATUSES: PedidoStatusCanonical[] = [
  'aguardando_contrato',
  'aguardando_video',
  'video_enviado',
  'video_aprovado',
  'ativo',
  'finalizado'
];

/** Status do pipeline de processamento */
export const PROCESSING_STATUSES: PedidoStatusCanonical[] = [
  'aguardando_contrato',
  'aguardando_video',
  'video_enviado',
  'video_aprovado'
];

/** Status que permitem upload de vídeo */
export const VIDEO_UPLOAD_ALLOWED_STATUSES: PedidoStatusCanonical[] = [
  'aguardando_video',
  'video_enviado',
  'video_aprovado',
  'ativo'
];

/** Status finais (não mudam mais) */
export const TERMINAL_STATUSES: PedidoStatusCanonical[] = [
  'finalizado',
  'cancelado',
  'cancelado_automaticamente'
];

/** Status de cancelamento */
export const CANCELED_STATUSES: PedidoStatusCanonical[] = [
  'cancelado',
  'cancelado_automaticamente'
];
