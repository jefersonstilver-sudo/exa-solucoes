export interface SecurityEvent {
  id: string;
  tipo_evento: string;
  descricao: string;
  ip: string;
  user_agent: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface SecurityMetrics {
  totalEvents24h: number;
  blockedAttempts: number;
  uniqueIPs: number;
  suspiciousActivities: number;
  threatLevel: 'low' | 'medium' | 'high';
  threatScore: number;
}

export interface EventsByType {
  type: string;
  count: number;
}

export interface EventsByHour {
  hour: string;
  count: number;
}

export interface TopIP {
  ip: string;
  count: number;
  lastSeen: string;
}

export interface SuspiciousIP {
  ip: string;
  attempts: number;
  lastAttempt: string;
  eventTypes: string[];
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  blocked_by: string;
  blocked_at: string;
  reason: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  blocked_by_name?: string;
  blocked_by_email?: string;
}
