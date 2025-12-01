import { usePeriodAlerts, PeriodAlert } from './usePeriodAlerts';

// Re-export do tipo para manter compatibilidade
export type TodayAlert = PeriodAlert;

/**
 * Hook de compatibilidade que usa internamente o usePeriodAlerts com período 'hoje'
 * Mantido para não quebrar código existente que usa useTodayAlerts
 */
export const useTodayAlerts = () => {
  return usePeriodAlerts('hoje');
};
