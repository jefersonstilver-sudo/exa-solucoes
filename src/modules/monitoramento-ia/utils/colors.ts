/**
 * Colors - Paleta de cores EXA para o módulo de monitoramento
 * 
 * IMPORTANTE: Estas cores devem ser usadas exclusivamente no módulo IA & Monitoramento
 * para manter consistência visual com o branding corporativo EXA.
 */

export const EXA_COLORS = {
  // Cores primárias EXA
  BLACK: '#0A0A0A',           // Preto EXA - backgrounds principais
  RED: '#9C1E1E',             // Vermelho EXA - acentos, highlights, CTA
  GRAY_DARK: '#1A1A1A',       // Cinza corporativo - cards, painéis
  WHITE: '#FFFFFF',           // Branco puro - textos principais
  
  // Variações de cinza para textos secundários
  GRAY_LIGHT: '#A0A0A0',      // Textos secundários
  GRAY_MUTED: '#6B7280',      // Textos terciários
  
  // Estados de status (mantidos para compatibilidade)
  STATUS_ONLINE: '#22C55E',   // Verde - online
  STATUS_OFFLINE: '#EF4444',  // Vermelho - offline
  STATUS_UNKNOWN: '#9CA3AF',  // Cinza - desconhecido
  
  // Alertas (severidade)
  ALERT_CRITICAL: '#DC2626',  // Crítico
  ALERT_HIGH: '#F97316',      // Alto
  ALERT_MEDIUM: '#EAB308',    // Médio
  ALERT_LOW: '#3B82F6',       // Baixo
} as const;

/**
 * Classes Tailwind prontas para uso direto
 */
export const EXA_CLASSES = {
  // Backgrounds
  bgPrimary: 'bg-[#0A0A0A]',
  bgCard: 'bg-[#1A1A1A]',
  bgHover: 'hover:bg-[#9C1E1E]',
  
  // Textos
  textPrimary: 'text-white',
  textSecondary: 'text-[#A0A0A0]',
  textMuted: 'text-[#6B7280]',
  
  // Bordas
  borderDefault: 'border-[#1A1A1A]',
  borderAccent: 'border-[#9C1E1E]',
  
  // Estados
  activeRed: 'bg-[#9C1E1E] text-white',
  hoverRed: 'hover:bg-[#9C1E1E]/90',
} as const;
