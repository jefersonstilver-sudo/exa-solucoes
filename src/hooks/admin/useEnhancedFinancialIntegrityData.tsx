
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FinancialStats, AnomaliesData, AuditResult } from '@/components/admin/financial-integrity/types';
import { useTransactionRecovery } from './useTransactionRecovery';

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
      
      // Executar reconciliação diária
      const { data: reconciliation, error: reconError } = await supabase
        .rpc('daily_financial_reconciliation');
      
      if (reconError) {
        console.error('Erro na reconciliação:', reconError);
        toast.error('Erro ao executar reconciliação financeira');
        return;
      }

      // Detectar anomalias
      const { data: anomaliesData, error: anomaliesError } = await supabase
        .rpc('detect_financial_anomalies');
      
      if (anomaliesError) {
        console.error('Erro na detecção de anomalias:', anomaliesError);
        toast.error('Erro ao detectar anomalias financeiras');
        return;
      }

      // Executar verificação de reconciliação MercadoPago
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

  const runEmergencyAudit = async () => {
    try {
      setLoading(true);
      toast.loading('Executando auditoria emergencial...');
      
      const { data: auditResult, error } = await supabase
        .rpc('emergency_financial_audit_and_fix');
      
      if (error) {
        console.error('Erro na auditoria emergencial:', error);
        toast.error('Erro ao executar auditoria emergencial');
        return;
      }

      console.log('🔧 Resultado da auditoria emergencial:', auditResult);
      
      // Type casting seguro para garantir acesso às propriedades
      const result = auditResult as unknown as AuditResult;
      
      toast.success(`Auditoria concluída: ${result.duplicates_fixed} duplicados corrigidos, ${result.orphaned_attempts_migrated} tentativas migradas`);
      
      // Atualizar dados após auditoria
      await fetchFinancialData();
      
    } catch (error) {
      console.error('Erro na auditoria emergencial:', error);
      toast.error('Erro ao executar auditoria emergencial');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFixTransactions = async () => {
    const result = await autoFixLostTransactions();
    if (result && result.transactions_fixed > 0) {
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
