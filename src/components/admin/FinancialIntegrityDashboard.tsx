
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useFinancialIntegrityData } from '@/hooks/admin/useFinancialIntegrityData';
import DashboardHeader from './financial-integrity/DashboardHeader';
import FinancialStatsCards from './financial-integrity/FinancialStatsCards';
import AnomaliesCard from './financial-integrity/AnomaliesCard';
import MissingWebhooksAlert from './financial-integrity/MissingWebhooksAlert';

const FinancialIntegrityDashboard: React.FC = () => {
  const {
    stats,
    anomalies,
    loading,
    lastUpdate,
    fetchFinancialData,
    runEmergencyAudit
  } = useFinancialIntegrityData();

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

  return (
    <div className="p-6 space-y-6">
      <DashboardHeader
        onRefresh={fetchFinancialData}
        onRunAudit={runEmergencyAudit}
        loading={loading}
        lastUpdate={lastUpdate}
      />

      <FinancialStatsCards stats={stats} anomalies={anomalies} />

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
