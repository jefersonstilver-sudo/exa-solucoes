import { useState } from 'react';
import { Shield, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSecurityMetrics } from '@/hooks/useSecurityMetrics';
import { useRealtimeSecurityEvents } from '@/hooks/useRealtimeSecurityEvents';
import { SecurityMetricsCards } from '@/components/admin/security/SecurityMetricsCards';
import { ThreatLevelIndicator } from '@/components/admin/security/ThreatLevelIndicator';
import { SecurityEventTimeline } from '@/components/admin/security/SecurityEventTimeline';
import { SecurityCharts } from '@/components/admin/security/SecurityCharts';
import { SuspiciousActivityAlert } from '@/components/admin/security/SuspiciousActivityAlert';
import { SecurityAnalytics } from '@/services/securityAnalytics';
import { toast } from 'sonner';

export default function SecurityDashboard() {
  const [isExporting, setIsExporting] = useState(false);
  const { metrics, eventsByType, eventsByHour, topIPs, isLoading, refetchMetrics } = useSecurityMetrics();
  const { events, isConnected } = useRealtimeSecurityEvents();

  const handleRefresh = async () => {
    await refetchMetrics();
    toast.success('Dashboard atualizado com sucesso');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = await SecurityAnalytics.exportToCSV(30);
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `security-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Relatório exportado com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Monitoramento de Segurança</h1>
            <p className="text-muted-foreground">Dashboard em tempo real</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Threat Level Indicator */}
      <ThreatLevelIndicator metrics={metrics} />

      {/* Suspicious Activity Alert */}
      <SuspiciousActivityAlert />

      {/* Metrics Cards */}
      <SecurityMetricsCards metrics={metrics} isLoading={isLoading} />

      {/* Charts and Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts - 2 columns */}
        <div className="lg:col-span-2">
          <SecurityCharts
            eventsByHour={eventsByHour}
            eventsByType={eventsByType}
            topIPs={topIPs}
          />
        </div>

        {/* Timeline - 1 column */}
        <div className="lg:col-span-1">
          <SecurityEventTimeline events={events} isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}
