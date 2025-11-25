import { useState, useEffect } from 'react';
import { RefreshCw, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertStatsCards } from '../components/AlertStatsCards';
import { AlertsFilters } from '../components/AlertsFilters';
import { AlertCard } from '../components/AlertCard';
import { AlertsTable } from '../components/AlertsTable';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { startOfDay, endOfDay } from 'date-fns';
import {
  fetchAlerts,
  calculateAlertStats,
  getUniqueCondominios,
  type DeviceAlert,
  type AlertStats,
  type AlertFilters,
} from '../utils/alerts';

export const AlertasPage = () => {
  const [alerts, setAlerts] = useState<DeviceAlert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    open: 0,
    scheduled: 0,
    resolved: 0,
    ignored: 0,
    critical: 0,
  });
  const [condominios, setCondominios] = useState<string[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date())
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedAlert, setSelectedAlert] = useState<DeviceAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, statsData, condominiosData] = await Promise.all([
        fetchAlerts(filters),
        calculateAlertStats(),
        getUniqueCondominios(),
      ]);
      setAlerts(alertsData);
      setStats(statsData);
      setCondominios(condominiosData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleRefresh = () => {
    toast.info('Atualizando alertas...');
    loadData();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date())
    });
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Painel', 'Condomínio', 'Torre', 'Tipo', 'Provedor', 'Severidade', 'Status', 'Aberto em', 'Fechado em'];
      const rows = alerts.map(alert => [
        alert.devices?.name || 'Desconhecido',
        alert.devices?.condominio_name || 'N/A',
        alert.devices?.comments?.split('-')[1]?.trim() || '-',
        alert.alert_type,
        alert.provider || 'AnyDesk',
        alert.severity,
        alert.status,
        new Date(alert.opened_at).toLocaleString('pt-BR'),
        alert.closed_at ? new Date(alert.closed_at).toLocaleString('pt-BR') : '-'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const handleViewDetails = (alert: DeviceAlert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedAlert(null);
  };

  const handleAlertUpdate = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Alertas de Painéis
            </h1>
            <p className="text-muted-foreground">
              Monitoramento técnico em tempo real da rede EXA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              disabled={alerts.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <AlertStatsCards stats={stats} />

      {/* Filters */}
      <AlertsFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        condominios={condominios}
      />

      {/* Loading State */}
      {loading && alerts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando alertas...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm">
          <p className="text-muted-foreground">Nenhum alerta encontrado</p>
        </div>
      ) : (
        <>
          {/* Total Count */}
          <div className="text-sm text-muted-foreground mb-4">
            Mostrando <span className="font-semibold text-foreground">{alerts.length}</span> alertas
          </div>

          {/* Mobile: Cards */}
          <div className="block lg:hidden space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={() => handleViewDetails(alert)}
              />
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block">
            <AlertsTable alerts={alerts} onViewDetails={handleViewDetails} />
          </div>
        </>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedAlert && (
        <AlertDetailModal
          isOpen={isModalOpen}
          alert={selectedAlert}
          onClose={handleModalClose}
          onUpdate={handleAlertUpdate}
        />
      )}
    </div>
  );
};
