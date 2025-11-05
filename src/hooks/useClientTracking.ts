import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientTrackingData {
  userId: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate: Date | null;
  abandonedCarts: number;
  couponsUsed: string[];
  riskScore: number;
  ipHistory: string[];
  deviceHistory: string[];
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * Hook para rastrear informações completas do cliente
 */
export const useClientTracking = (userId: string | null) => {
  const [trackingData, setTrackingData] = useState<ClientTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setTrackingData(null);
      return;
    }

    const fetchClientData = async () => {
      setIsLoading(true);
      try {
        // Buscar pedidos do cliente
        const { data: orders } = await supabase
          .from('pedidos')
          .select('valor_total, created_at, status')
          .eq('client_id', userId)
          .eq('status', 'completed');

        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.valor_total || 0), 0) || 0;
        const lastOrderDate = orders?.[0]?.created_at ? new Date(orders[0].created_at) : null;

        // Buscar tentativas abandonadas (pedidos não completados)
        const { data: abandoned } = await supabase
          .from('pedidos')
          .select('id')
          .eq('client_id', userId)
          .neq('status', 'completed');

        const abandonedCarts = abandoned?.length || 0;

        // Buscar cupons usados
        const { data: coupons } = await supabase
          .from('cupom_usos')
          .select('cupom_id')
          .eq('user_id', userId);

        const couponsUsed = [...new Set(coupons?.map(c => c.cupom_id) || [])];

        // Buscar histórico de IPs e dispositivos
        const { data: sessions } = await supabase
          .from('user_sessions')
          .select('ip_address, device_type, browser, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const ipHistory = [...new Set(sessions?.map(s => s.ip_address) || [])];
        const deviceHistory = [...new Set(
          sessions?.map(s => `${s.device_type} (${s.browser})`) || []
        )];

        const firstSeen = sessions?.[sessions.length - 1]?.created_at 
          ? new Date(sessions[sessions.length - 1].created_at) 
          : new Date();
        const lastSeen = sessions?.[0]?.created_at 
          ? new Date(sessions[0].created_at) 
          : new Date();

        // Calcular score de risco (0-100)
        let riskScore = 0;
        
        // Múltiplos IPs aumentam risco
        if (ipHistory.length > 5) riskScore += 20;
        else if (ipHistory.length > 3) riskScore += 10;
        
        // Alta taxa de abandono aumenta risco
        if (abandonedCarts > totalOrders * 2) riskScore += 30;
        else if (abandonedCarts > totalOrders) riskScore += 15;
        
        // VPN em sessões aumenta risco
        const vpnSessions = sessions?.filter(s => s.ip_address?.includes('VPN')) || [];
        if (vpnSessions.length > 0) riskScore += 25;
        
        // Cliente novo tem risco médio
        const daysSinceFirstSeen = (Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceFirstSeen < 1) riskScore += 15;
        
        // Compras reduzem risco
        if (totalOrders > 3) riskScore -= 20;
        else if (totalOrders > 0) riskScore -= 10;

        riskScore = Math.max(0, Math.min(100, riskScore));

        setTrackingData({
          userId,
          totalOrders,
          totalRevenue,
          lastOrderDate,
          abandonedCarts,
          couponsUsed,
          riskScore,
          ipHistory,
          deviceHistory,
          firstSeen,
          lastSeen
        });
      } catch (error) {
        console.error('Erro ao buscar dados de rastreamento:', error);
        setTrackingData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientData();
  }, [userId]);

  return { trackingData, isLoading };
};
