
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface OrderMonitoringResult {
  success: boolean;
  orderId?: string;
  errors?: string[];
  warnings?: string[];
  validationPassed: boolean;
  dataIntegrity: boolean;
}

interface MonitoringStats {
  totalOrders: number;
  successRate: number;
  recentFailures: number;
  averageCreationTime: number;
  lastOrderTime?: string;
}

export const useOrderCreationMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [lastValidation, setLastValidation] = useState<OrderMonitoringResult | null>(null);

  // Validação pré-criação do pedido
  const validatePreOrderCreation = useCallback(async (
    cartItems: any[],
    selectedPlan: number,
    totalPrice: number,
    sessionUser: any
  ): Promise<OrderMonitoringResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validationPassed = true;
    let dataIntegrity = true;

    console.log('🔍 [ORDER_MONITOR] Iniciando validação pré-criação...');

    // Validação básica
    if (!cartItems || cartItems.length === 0) {
      errors.push('Carrinho vazio');
      validationPassed = false;
    }

    if (!selectedPlan || selectedPlan <= 0) {
      errors.push('Plano inválido');
      validationPassed = false;
    }

    if (!totalPrice || totalPrice <= 0) {
      errors.push('Valor total inválido');
      validationPassed = false;
    }

    if (!sessionUser?.id) {
      errors.push('Usuário não autenticado');
      validationPassed = false;
    }

    // Validação dos painéis
    const panelIds = cartItems.map(item => item.panel?.id).filter(Boolean);
    if (panelIds.length === 0) {
      errors.push('Nenhum painel válido encontrado');
      validationPassed = false;
    }

    // Verificar se painéis existem no banco
    if (panelIds.length > 0) {
      const { data: panelData, error: panelError } = await supabase
        .from('painels')
        .select('id, building_id')
        .in('id', panelIds);

      if (panelError) {
        errors.push('Erro ao validar painéis no banco');
        dataIntegrity = false;
      } else if (!panelData || panelData.length !== panelIds.length) {
        warnings.push('Alguns painéis podem não existir no banco');
        dataIntegrity = false;
      }

      // Verificar building_ids
      const buildingIds = [...new Set(panelData?.map(p => p.building_id).filter(Boolean) || [])];
      if (buildingIds.length === 0) {
        errors.push('Nenhum prédio válido encontrado');
        validationPassed = false;
      }
    }

    // Verificar duplicação
    if (sessionUser?.id) {
      const { data: recentOrders } = await supabase
        .from('pedidos')
        .select('id, valor_total, created_at')
        .eq('client_id', sessionUser.id)
        .eq('valor_total', totalPrice)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (recentOrders && recentOrders.length > 0) {
        warnings.push('Possível duplicação detectada - pedido similar existe');
      }
    }

    const result: OrderMonitoringResult = {
      success: validationPassed && dataIntegrity,
      errors,
      warnings,
      validationPassed,
      dataIntegrity
    };

    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      validationPassed ? LogLevel.INFO : LogLevel.ERROR,
      'Validação pré-criação de pedido concluída',
      { 
        result,
        cartItemsCount: cartItems.length,
        panelIds,
        userId: sessionUser?.id?.substring(0, 8)
      }
    );

    setLastValidation(result);
    return result;
  }, []);

  // Monitoramento das estatísticas
  const updateMonitoringStats = useCallback(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Total de pedidos nas últimas 24h
      const { data: totalOrders } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact' })
        .gte('created_at', oneDayAgo);

      // Pedidos com sucesso
      const { data: successfulOrders } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact' })
        .gte('created_at', oneDayAgo)
        .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

      // Pedidos com falha
      const { data: failedOrders } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact' })
        .gte('created_at', oneDayAgo)
        .eq('status', 'erro');

      // Último pedido
      const { data: lastOrder } = await supabase
        .from('pedidos')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      const totalCount = totalOrders?.length || 0;
      const successCount = successfulOrders?.length || 0;
      const failureCount = failedOrders?.length || 0;

      const newStats: MonitoringStats = {
        totalOrders: totalCount,
        successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
        recentFailures: failureCount,
        averageCreationTime: 0, // Pode ser implementado posteriormente
        lastOrderTime: lastOrder?.[0]?.created_at
      };

      setStats(newStats);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  }, []);

  // Ativar monitoramento
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    updateMonitoringStats();
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(updateMonitoringStats, 30000);
    
    toast.success('Monitoramento de pedidos ativado');
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [updateMonitoringStats]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    toast.info('Monitoramento de pedidos desativado');
  }, []);

  // Verificação de saúde do sistema
  const checkSystemHealth = useCallback(async () => {
    try {
      const healthChecks = [];

      // Check 1: Conexão com banco
      const { error: dbError } = await supabase
        .from('pedidos')
        .select('id')
        .limit(1);

      healthChecks.push({
        name: 'Conexão com banco',
        status: !dbError ? 'OK' : 'ERRO',
        details: dbError?.message
      });

      // Check 2: Disponibilidade de painéis
      const { data: panelsData, error: panelsError } = await supabase
        .from('painels')
        .select('id, status')
        .eq('status', 'online');

      healthChecks.push({
        name: 'Painéis online',
        status: !panelsError ? 'OK' : 'ERRO',
        details: `${panelsData?.length || 0} painéis online`
      });

      // Check 3: Últimos pedidos
      const { data: recentOrders, error: ordersError } = await supabase
        .from('pedidos')
        .select('id, status')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      healthChecks.push({
        name: 'Pedidos recentes',
        status: !ordersError ? 'OK' : 'ERRO',
        details: `${recentOrders?.length || 0} pedidos na última hora`
      });

      const overallHealth = healthChecks.every(check => check.status === 'OK');

      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        overallHealth ? LogLevel.INFO : LogLevel.WARNING,
        'Verificação de saúde do sistema',
        { healthChecks, overallHealth }
      );

      return { healthy: overallHealth, checks: healthChecks };
    } catch (error) {
      console.error('Erro na verificação de saúde:', error);
      return { healthy: false, checks: [], error: String(error) };
    }
  }, []);

  return {
    isMonitoring,
    stats,
    lastValidation,
    validatePreOrderCreation,
    startMonitoring,
    stopMonitoring,
    updateMonitoringStats,
    checkSystemHealth
  };
};
