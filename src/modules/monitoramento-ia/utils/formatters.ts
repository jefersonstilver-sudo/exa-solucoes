/**
 * Formatters - Utilitários de formatação para o módulo de monitoramento
 */

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uptime em segundos para formato legível
 * @param seconds - Segundos de uptime
 * @returns String formatada (ex: "2d 5h 30m")
 */
export function formatUptime(seconds?: number): string {
  if (!seconds) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  
  return parts.join(' ');
}

/**
 * Formata temperatura para exibição
 * @param temp - Temperatura em Celsius
 * @returns String formatada (ex: "45°C")
 */
export function formatTemperature(temp?: number): string {
  if (temp === undefined || temp === null) return 'N/A';
  return `${temp}°C`;
}

/**
 * Humaniza data para "há X tempo"
 * @param date - Data ISO ou Date object
 * @returns String humanizada (ex: "há 2 horas")
 */
export function humanizeDate(date?: string | Date | null): string {
  if (!date) return 'Nunca';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return 'Data inválida';
  }
}

/**
 * Trunca texto longo com ellipsis
 * @param text - Texto a truncar
 * @param maxLength - Tamanho máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formata número com separadores de milhares
 * @param num - Número a formatar
 * @returns String formatada
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}
