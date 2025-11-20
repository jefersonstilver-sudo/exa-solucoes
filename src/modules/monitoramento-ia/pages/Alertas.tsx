import { useState, useEffect } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertStatsCards } from '../components/AlertStatsCards';
import { AlertsFilters } from '../components/AlertsFilters';
import { AlertCard } from '../components/AlertCard';
import { AlertsTable } from '../components/AlertsTable';
import { AlertDetailModal } from '../components/AlertDetailModal';
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
  const [filters, setFilters] = useState<AlertFilters>({});
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
    setFilters({});
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
      <div className="bg-module-card rounded-xl border-module border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-module-primary mb-2">
              Alertas de Painéis
            </h1>
            <p className="text-module-secondary">
              Monitoramento técnico em tempo real da rede EXA.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-module-tertiary">
              <Clock className="w-4 h-4" />
              <span>
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              className="bg-module-accent hover:bg-module-accent-hover text-white border-0"
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
        <div className="text-center py-12 bg-module-card rounded-xl border-module border">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9C1E1E]"></div>
          <p className="mt-4 text-module-secondary">Carregando alertas...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-module-card rounded-xl border-module border">
          <p className="text-module-secondary">Nenhum alerta encontrado</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="block md:hidden space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onClick={() => handleViewDetails(alert)}
              />
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block">
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
