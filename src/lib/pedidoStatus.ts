/**
 * Rotulos e cores dos status de pedido, num lugar so (antes cada tela mostrava o codigo cru, ex.: "aguardando_video").
 */
export interface PedidoStatusInfo {
  label: string;
  /** classes do selo (fundo claro + texto) */
  cls: string;
  /** classes do selo solido (fundo forte + texto branco) */
  solid: string;
  /** cor do pontinho */
  dot: string;
}

const MAPA: Record<string, PedidoStatusInfo> = {
  pendente: { label: 'Pendente', cls: 'bg-gray-100 text-gray-700', solid: 'bg-gray-500 text-white', dot: 'bg-gray-400' },
  aguardando_pagamento: { label: 'Aguardando pagamento', cls: 'bg-yellow-100 text-yellow-800', solid: 'bg-yellow-500 text-white', dot: 'bg-yellow-500' },
  aguardando_contrato: { label: 'Aguardando contrato', cls: 'bg-amber-100 text-amber-800', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
  aguardando_video: { label: 'Aguardando vídeo', cls: 'bg-orange-100 text-orange-800', solid: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  pago_pendente_video: { label: 'Aguardando vídeo', cls: 'bg-orange-100 text-orange-800', solid: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  pago: { label: 'Pago', cls: 'bg-green-100 text-green-800', solid: 'bg-green-600 text-white', dot: 'bg-green-500' },
  video_enviado: { label: 'Vídeo em análise', cls: 'bg-blue-100 text-blue-800', solid: 'bg-blue-600 text-white', dot: 'bg-blue-500' },
  video_aprovado: { label: 'Vídeo aprovado', cls: 'bg-emerald-100 text-emerald-800', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500' },
  ativo: { label: 'Ativo', cls: 'bg-green-100 text-green-800', solid: 'bg-green-600 text-white', dot: 'bg-green-500' },
  finalizado: { label: 'Finalizado', cls: 'bg-slate-100 text-slate-700', solid: 'bg-slate-600 text-white', dot: 'bg-slate-400' },
  bloqueado: { label: 'Suspenso', cls: 'bg-amber-100 text-amber-900', solid: 'bg-amber-600 text-white', dot: 'bg-amber-500' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-800', solid: 'bg-red-600 text-white', dot: 'bg-red-500' },
  cancelado_automaticamente: { label: 'Cancelado (automático)', cls: 'bg-red-100 text-red-800', solid: 'bg-red-600 text-white', dot: 'bg-red-500' },
};

export function pedidoStatusInfo(status?: string | null): PedidoStatusInfo {
  const s = String(status || '');
  return MAPA[s] || {
    label: s ? s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '—',
    cls: 'bg-gray-100 text-gray-700',
    solid: 'bg-gray-500 text-white',
    dot: 'bg-gray-400',
  };
}
