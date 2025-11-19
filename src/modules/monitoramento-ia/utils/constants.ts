/**
 * Constants - Constantes do módulo de monitoramento
 */

export const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

export const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Desconhecido',
} as const;

export const STATUS_COLORS = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  unknown: 'bg-gray-400',
} as const;

export const SEVERITY_LABELS = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
} as const;

export const SEVERITY_COLORS = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-gray-900',
  low: 'bg-blue-500 text-white',
} as const;

export const ALERT_STATUS_LABELS = {
  open: 'Aberto',
  scheduled: 'Agendado',
  resolved: 'Resolvido',
  ignored: 'Ignorado',
} as const;

export const MODULE_VERSION = 'v1.0.0';
