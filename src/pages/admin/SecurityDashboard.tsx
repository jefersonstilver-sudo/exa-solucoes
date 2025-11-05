import { useState } from 'react';
import { Shield, RefreshCw, Download, BarChart3, Activity, Globe, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecurityMetrics } from '@/hooks/useSecurityMetrics';
import { useRealtimeSecurityEvents } from '@/hooks/useRealtimeSecurityEvents';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { SecurityMetricsCards } from '@/components/admin/security/SecurityMetricsCards';
import { ThreatLevelIndicator } from '@/components/admin/security/ThreatLevelIndicator';
import { SecurityEventTimeline } from '@/components/admin/security/SecurityEventTimeline';
import { SecurityCharts } from '@/components/admin/security/SecurityCharts';
import { SuspiciousActivityAlert } from '@/components/admin/security/SuspiciousActivityAlert';
import { ActiveUsersCard } from '@/components/admin/security/ActiveUsersCard';
import { ActiveSessionsList } from '@/components/admin/security/ActiveSessionsList';
import { GeographicDistributionChart } from '@/components/admin/security/GeographicDistributionChart';
import { GeographicSecurityAlert } from '@/components/admin/security/GeographicSecurityAlert';
import { IPBlockingPanel } from '@/components/admin/security/IPBlockingPanel';
import { SecurityAnalytics } from '@/services/securityAnalytics';
import { toast } from 'sonner';

export default function SecurityDashboard() {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { metrics, eventsByType, eventsByHour, topIPs, isLoading, refetchMetrics } = useSecurityMetrics();
  const { events, isConnected } = useRealtimeSecurityEvents();
  const {
    sessions,
    totalActive,
    sessionsByCountry,
    sessionsByRegion,
    internationalSessions,
    vpnSessions,
    isLoading: isLoadingUsers
  } = useActiveUsers();

  const handleRefresh = async () => {
    await refetchMetrics();
    toast.success('Dashboard atualizado com sucesso');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = await SecurityAnalytics.exportToCSV(30);
      
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
      {/* Header Profissional */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoramento de Segurança</h1>
            <p className="text-muted-foreground">Central de segurança e monitoramento em tempo real</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Threat Level - Sempre visível */}
      <ThreatLevelIndicator metrics={metrics} />

      {/* Alertas de Segurança */}
      <div className="space-y-4">
        <GeographicSecurityAlert
          internationalSessions={internationalSessions}
          vpnSessions={vpnSessions}
        />
        <SuspiciousActivityAlert />
      </div>

      {/* Tabs para Organização */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Sessões Ativas</span>
          </TabsTrigger>
          <TabsTrigger value="geographic" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Geolocalização</span>
          </TabsTrigger>
          <TabsTrigger value="blocking" className="gap-2">
            <Ban className="h-4 w-4" />
            <span className="hidden sm:inline">Bloqueio de IPs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <ActiveUsersCard totalActive={totalActive} isLoading={isLoadingUsers} />
            <SecurityMetricsCards metrics={metrics} isLoading={isLoading} />
          </div>

          {/* Gráficos e Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SecurityCharts
                eventsByHour={eventsByHour}
                eventsByType={eventsByType}
                topIPs={topIPs}
              />
            </div>
            <div className="lg:col-span-1">
              <SecurityEventTimeline events={events} isConnected={isConnected} />
            </div>
          </div>
        </TabsContent>

        {/* Tab: Sessões Ativas */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ActiveUsersCard totalActive={totalActive} isLoading={isLoadingUsers} />
            <div className="md:col-span-3">
              <div className="grid gap-4 md:grid-cols-3">
                <SecurityMetricsCards metrics={metrics} isLoading={isLoading} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActiveSessionsList sessions={sessions} />
            <SecurityEventTimeline events={events} isConnected={isConnected} />
          </div>
        </TabsContent>

        {/* Tab: Geolocalização */}
        <TabsContent value="geographic" className="space-y-6">
          <GeographicDistributionChart
            sessionsByCountry={sessionsByCountry}
            sessionsByRegion={sessionsByRegion}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActiveSessionsList sessions={sessions} />
            <SecurityCharts
              eventsByHour={eventsByHour}
              eventsByType={eventsByType}
              topIPs={topIPs}
            />
          </div>
        </TabsContent>

        {/* Tab: Bloqueio de IPs */}
        <TabsContent value="blocking" className="space-y-6">
          <IPBlockingPanel />
          
          <SecurityEventTimeline events={events} isConnected={isConnected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
