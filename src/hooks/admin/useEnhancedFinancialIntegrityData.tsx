
import { useState, useEffect } from 'react';
import { readAsaasAudit } from '@/services/asaasAuditService';
import { toast } from 'sonner';
import { FinancialStats, AnomaliesData, AuditResult } from '@/components/admin/financial-integrity/types';
import { useTransactionRecovery, AutoFixResult } from './useTransactionRecovery';

export const useEnhancedFinancialIntegrityData = () => {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesData | null>(null);
  const [reconciliationData, setReconciliationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const { 
    runReconciliationCheck, 
    autoFixLostTransactions,
    loading: recoveryLoading 
  } = useTransactionRecovery();

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      const audit = await readAsaasAudit();
      const reconciliation = { supabase_total: audit.total, webhook_count: audit.events.length,
        missing_webhooks: audit.unmatched.length, reconciliation_status: 'NOT_CERTIFIED', anomaly_score: audit.unmatched.length, status: 'Não certificado' };
      const anomaliesData = { duplicate_orders: audit.duplicateChargeIds.length, zero_value_orders: 0,
        suspicious_timing: 0, missing_payment_logs: audit.unmatched.length, anomaly_score: audit.unmatched.length, status: 'Revisão necessária' };
      const reconciliationResult = await runReconciliationCheck();

      // Type casting seguro para garantir compatibilidade
      setStats(reconciliation as unknown as FinancialStats);
      setAnomalies(anomaliesData as unknown as AnomaliesData);
      setReconciliationData(reconciliationResult);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
      
      console.log('📊 Dados financeiros atualizados:', {
        reconciliation,
        anomalies: anomaliesData,
        reconciliationCheck: reconciliationResult
      });

    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast.error('Erro ao carregar dashboard financeiro');
    } finally {
      setLoading(false);
    }
  };

  const runEmergencyAudit = fetchFinancialData;

  const handleAutoFixTransactions = async () => {
    const result = await autoFixLostTransactions();
    if (result && (result as AutoFixResult).transactions_fixed > 0) {
      // Refresh data after auto-fix
      await fetchFinancialData();
    }
    return result;
  };

  useEffect(() => {
    fetchFinancialData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchFinancialData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    anomalies,
    reconciliationData,
    loading: loading || recoveryLoading,
    lastUpdate,
    fetchFinancialData,
    runEmergencyAudit,
    handleAutoFixTransactions
  };
};
