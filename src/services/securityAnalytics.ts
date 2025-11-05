import { supabase } from '@/integrations/supabase/client';
import type { SecurityMetrics, EventsByType, EventsByHour, TopIP, SuspiciousIP } from '@/types/security';

export class SecurityAnalytics {
  // Calculate aggregated security metrics
  static async calculateMetrics(): Promise<SecurityMetrics> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Get events from last 24h
      const { data: events, error } = await supabase
        .from('log_eventos_sistema')
        .select('*')
        .gte('created_at', twentyFourHoursAgo);

      if (error) throw error;

      const totalEvents24h = events?.length || 0;

      // Count blocked attempts (rate limit, failed login, etc)
      const blockedAttempts = events?.filter(e => 
        e.tipo_evento.includes('rate_limit') || 
        e.tipo_evento.includes('failed_login') ||
        e.tipo_evento.includes('suspicious')
      ).length || 0;

      // Count unique IPs
      const uniqueIPs = new Set(events?.map(e => e.ip || 'unknown')).size;

      // Count suspicious activities
      const suspiciousActivities = events?.filter(e =>
        e.tipo_evento.includes('suspicious') ||
        e.tipo_evento.includes('admin_action') ||
        e.tipo_evento === 'rate_limit_exceeded'
      ).length || 0;

      // Calculate threat score (0-100)
      const threatScore = this.calculateThreatScore(
        totalEvents24h,
        blockedAttempts,
        suspiciousActivities
      );

      // Determine threat level
      let threatLevel: 'low' | 'medium' | 'high' = 'low';
      if (threatScore >= 70) threatLevel = 'high';
      else if (threatScore >= 40) threatLevel = 'medium';

      return {
        totalEvents24h,
        blockedAttempts,
        uniqueIPs,
        suspiciousActivities,
        threatLevel,
        threatScore
      };
    } catch (error) {
      console.error('Error calculating security metrics:', error);
      return {
        totalEvents24h: 0,
        blockedAttempts: 0,
        uniqueIPs: 0,
        suspiciousActivities: 0,
        threatLevel: 'low',
        threatScore: 0
      };
    }
  }

  // Calculate threat score based on metrics
  private static calculateThreatScore(
    totalEvents: number,
    blockedAttempts: number,
    suspiciousActivities: number
  ): number {
    let score = 0;

    // More events = higher score (but capped)
    score += Math.min(totalEvents / 10, 30);

    // Blocked attempts are serious
    score += blockedAttempts * 5;

    // Suspicious activities are very serious
    score += suspiciousActivities * 8;

    return Math.min(Math.round(score), 100);
  }

  // Get events grouped by type
  static async getEventsByType(hours: number = 24): Promise<EventsByType[]> {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('tipo_evento')
        .gte('created_at', hoursAgo);

      if (error) throw error;

      const grouped = (data || []).reduce((acc, event) => {
        const type = event.tipo_evento || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting events by type:', error);
      return [];
    }
  }

  // Get events grouped by hour
  static async getEventsByHour(hours: number = 24): Promise<EventsByHour[]> {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('created_at')
        .gte('created_at', hoursAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const hourlyData: Record<string, number> = {};

      // Initialize all hours with 0
      for (let i = hours - 1; i >= 0; i--) {
        const hour = new Date(Date.now() - i * 60 * 60 * 1000);
        const hourKey = hour.getHours().toString().padStart(2, '0') + ':00';
        hourlyData[hourKey] = 0;
      }

      // Count events per hour
      (data || []).forEach(event => {
        const date = new Date(event.created_at);
        const hourKey = date.getHours().toString().padStart(2, '0') + ':00';
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
      });

      return Object.entries(hourlyData).map(([hour, count]) => ({ hour, count }));
    } catch (error) {
      console.error('Error getting events by hour:', error);
      return [];
    }
  }

  // Get top active IPs
  static async getTopIPs(limit: number = 10): Promise<TopIP[]> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('ip, created_at')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ipCounts: Record<string, { count: number; lastSeen: string }> = {};

      (data || []).forEach(event => {
        const ip = event.ip || 'unknown';
        if (!ipCounts[ip]) {
          ipCounts[ip] = { count: 0, lastSeen: event.created_at };
        }
        ipCounts[ip].count++;
        if (event.created_at > ipCounts[ip].lastSeen) {
          ipCounts[ip].lastSeen = event.created_at;
        }
      });

      return Object.entries(ipCounts)
        .map(([ip, data]) => ({ ip, count: data.count, lastSeen: data.lastSeen }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top IPs:', error);
      return [];
    }
  }

  // Detect suspicious IPs (multiple failed attempts, rate limits, etc)
  static async detectSuspiciousIPs(): Promise<SuspiciousIP[]> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('ip, tipo_evento, created_at')
        .gte('created_at', oneHourAgo)
        .or('tipo_evento.ilike.%failed%,tipo_evento.ilike.%suspicious%,tipo_evento.ilike.%rate_limit%');

      if (error) throw error;

      const suspiciousIPs: Record<string, SuspiciousIP> = {};

      (data || []).forEach(event => {
        const ip = event.ip || 'unknown';
        if (!suspiciousIPs[ip]) {
          suspiciousIPs[ip] = {
            ip,
            attempts: 0,
            lastAttempt: event.created_at,
            eventTypes: []
          };
        }
        suspiciousIPs[ip].attempts++;
        if (event.created_at > suspiciousIPs[ip].lastAttempt) {
          suspiciousIPs[ip].lastAttempt = event.created_at;
        }
        if (!suspiciousIPs[ip].eventTypes.includes(event.tipo_evento)) {
          suspiciousIPs[ip].eventTypes.push(event.tipo_evento);
        }
      });

      // Only return IPs with 3+ suspicious events
      return Object.values(suspiciousIPs)
        .filter(ip => ip.attempts >= 3)
        .sort((a, b) => b.attempts - a.attempts);
    } catch (error) {
      console.error('Error detecting suspicious IPs:', error);
      return [];
    }
  }

  // Export security data to CSV format
  static async exportToCSV(days: number = 30): Promise<string> {
    try {
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('*')
        .gte('created_at', daysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const headers = ['Data/Hora', 'Tipo de Evento', 'Descrição', 'IP', 'User Agent'];
      const rows = (data || []).map(event => [
        new Date(event.created_at).toLocaleString('pt-BR'),
        event.tipo_evento,
        event.descricao,
        event.ip || 'unknown',
        event.user_agent || 'unknown'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return '';
    }
  }
}
