import { supabase } from '@/integrations/supabase/client';
import type { BlockedIP } from '@/types/security';

class IPBlockingService {
  async getBlockedIPs(): Promise<BlockedIP[]> {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select(`
        *,
        users:blocked_by (nome, email)
      `)
      .eq('is_active', true)
      .order('blocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocked IPs:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      blocked_by_name: item.users?.nome,
      blocked_by_email: item.users?.email
    }));
  }

  async blockIP(
    ipAddress: string,
    reason: string,
    expiresInHours?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = expiresInHours
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from('blocked_ips').insert({
        ip_address: ipAddress,
        reason,
        expires_at: expiresAt,
        is_active: true
      });

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'IP já está bloqueado' };
        }
        throw error;
      }

      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'IP_BLOCKED',
        descricao: `IP ${ipAddress} bloqueado: ${reason}`,
        ip: ipAddress
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error blocking IP:', error);
      return { success: false, error: error.message };
    }
  }

  async unblockIP(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: blockedIP, error: fetchError } = await supabase
        .from('blocked_ips')
        .select('ip_address')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('blocked_ips')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'IP_UNBLOCKED',
        descricao: `IP ${blockedIP.ip_address} desbloqueado`,
        ip: blockedIP.ip_address
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error unblocking IP:', error);
      return { success: false, error: error.message };
    }
  }

  async isIPBlocked(ipAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error checking blocked IP:', error);
      return false;
    }

    return !!data;
  }
}

export const ipBlockingService = new IPBlockingService();
