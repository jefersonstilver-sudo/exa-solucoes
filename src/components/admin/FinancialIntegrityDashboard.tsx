
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useEnhancedFinancialIntegrityData } from '@/hooks/admin/useEnhancedFinancialIntegrityData';
import DashboardHeader from './financial-integrity/DashboardHeader';
import EnhancedFinancialStatsCards from './financial-integrity/EnhancedFinancialStatsCards';
import AnomaliesCard from './financial-integrity/AnomaliesCard';
import MissingWebhooksAlert from './financial-integrity/MissingWebhooksAlert';
import TransactionRecoveryCard from './financial-integrity/TransactionRecoveryCard';
import LostTransactionsAlert from './financial-integrity/LostTransactionsAlert';

const FinancialIntegrityDashboard: React.FC = () => {
  const {
    stats,
    anomalies,
    reconciliationData,
    loading,
    lastUpdate,
    fetchFinancialData,
    runEmergencyAudit,
    handleAutoFixTransactions
  } = useEnhancedFinancialIntegrityData();

  if (loading && !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Carregando dashboard de integridade financeira...</span>
        </div>
      </div>
    );
  }

  const missingTransactions = reconciliationData?.missing_transactions || 0;
  const estimatedLoss = reconciliationData?.lost_revenue_estimate || 0;

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        onRefresh={fetchFinancialData}
        onRunAudit={runEmergencyAudit}
        loading={loading}
        lastUpdate={lastUpdate}
      />

      <EnhancedFinancialStatsCards 
        stats={stats} 
        anomalies={anomalies}
        reconciliationData={reconciliationData}
      />

      {/* Transaction Recovery Section */}
      <TransactionRecoveryCard />

      {/* Lost Transactions Alert */}
      <LostTransactionsAlert
        missingCount={missingTransactions}
        estimatedLoss={estimatedLoss}
        onInvestigate={fetchFinancialData}
        onAutoFix={handleAutoFixTransactions}
        loading={loading}
      />

      <AnomaliesCard anomalies={anomalies} />

      <MissingWebhooksAlert 
        stats={stats} 
        onRunAudit={runEmergencyAudit} 
        loading={loading} 
      />
    </div>
  );
};

export default FinancialIntegrityDashboard;
