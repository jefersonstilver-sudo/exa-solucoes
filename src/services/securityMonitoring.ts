
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private rateLimitMap = new Map<string, number[]>();

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Log security events
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: event.event_type,
          descricao: event.description,
          ip: event.ip_address || 'unknown',
          user_agent: event.user_agent || 'unknown'
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Rate limiting check
  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.rateLimitMap.has(identifier)) {
      this.rateLimitMap.set(identifier, []);
    }
    
    const attempts = this.rateLimitMap.get(identifier)!;
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(timestamp => timestamp > windowStart);
    this.rateLimitMap.set(identifier, validAttempts);
    
    if (validAttempts.length >= maxAttempts) {
      this.logSecurityEvent({
        event_type: 'rate_limit_exceeded',
        description: `Rate limit exceeded for identifier: ${identifier}`,
        metadata: { attempts: validAttempts.length, maxAttempts }
      });
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.rateLimitMap.set(identifier, validAttempts);
    
    return true;
  }

  // Monitor failed login attempts
  async monitorFailedLogin(email: string, ip: string, userAgent: string): Promise<void> {
    const identifier = `login_${email}_${ip}`;
    
    if (!this.checkRateLimit(identifier, 3, 900000)) { // 3 attempts per 15 minutes
      await this.logSecurityEvent({
        event_type: 'suspicious_login_activity',
        description: `Multiple failed login attempts for email: ${email}`,
        ip_address: ip,
        user_agent: userAgent,
        metadata: { email, suspiciousActivity: true }
      });
    }
    
    await this.logSecurityEvent({
      event_type: 'failed_login_attempt',
      description: `Failed login attempt for email: ${email}`,
      ip_address: ip,
      user_agent: userAgent,
      metadata: { email }
    });
  }

  // Monitor admin actions
  async monitorAdminAction(
    action: string, 
    userId: string, 
    targetResource: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'admin_action',
      description: `Admin action: ${action} on ${targetResource}`,
      user_id: userId,
      metadata: { action, targetResource, ...metadata }
    });
  }

  // Monitor data access
  async monitorDataAccess(
    table: string,
    operation: string,
    userId: string,
    recordCount: number = 1
  ): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'data_access',
      description: `${operation} operation on ${table}`,
      user_id: userId,
      metadata: { table, operation, recordCount }
    });
  }

  // Check for suspicious patterns
  async checkSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      // Check for unusual activity patterns in the last hour
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      
      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('tipo_evento, created_at')
        .gte('created_at', oneHourAgo)
        .like('descricao', `%user_id: ${userId}%`);
      
      if (error) {
        console.error('Error checking suspicious activity:', error);
        return false;
      }
      
      const events = data || [];
      const eventCount = events.length;
      
      // Flag as suspicious if more than 50 events in an hour
      if (eventCount > 50) {
        await this.logSecurityEvent({
          event_type: 'suspicious_activity_detected',
          description: `Suspicious activity detected for user: ${userId}`,
          user_id: userId,
          metadata: { eventCount, timeWindow: '1 hour' }
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in suspicious activity check:', error);
      return false;
    }
  }

  // Clear rate limit data for testing
  clearRateLimits(): void {
    this.rateLimitMap.clear();
  }
}

export const securityMonitor = SecurityMonitor.getInstance();
