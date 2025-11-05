import { useQuery } from '@tanstack/react-query';
import { SecurityAnalytics } from '@/services/securityAnalytics';
import type { SecurityMetrics, EventsByType, EventsByHour, TopIP } from '@/types/security';

export const useSecurityMetrics = () => {
  const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery<SecurityMetrics>({
    queryKey: ['security-metrics'],
    queryFn: () => SecurityAnalytics.calculateMetrics(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 20000
  });

  const { data: eventsByType, isLoading: isLoadingEventsByType } = useQuery<EventsByType[]>({
    queryKey: ['security-events-by-type'],
    queryFn: () => SecurityAnalytics.getEventsByType(24),
    refetchInterval: 30000,
    staleTime: 20000
  });

  const { data: eventsByHour, isLoading: isLoadingEventsByHour } = useQuery<EventsByHour[]>({
    queryKey: ['security-events-by-hour'],
    queryFn: () => SecurityAnalytics.getEventsByHour(24),
    refetchInterval: 30000,
    staleTime: 20000
  });

  const { data: topIPs, isLoading: isLoadingTopIPs } = useQuery<TopIP[]>({
    queryKey: ['security-top-ips'],
    queryFn: () => SecurityAnalytics.getTopIPs(10),
    refetchInterval: 30000,
    staleTime: 20000
  });

  return {
    metrics,
    eventsByType: eventsByType || [],
    eventsByHour: eventsByHour || [],
    topIPs: topIPs || [],
    isLoading: isLoadingMetrics || isLoadingEventsByType || isLoadingEventsByHour || isLoadingTopIPs,
    refetchMetrics
  };
};
