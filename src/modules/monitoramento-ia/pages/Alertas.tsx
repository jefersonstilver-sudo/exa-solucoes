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
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              Alertas de Painéis
            </h1>
            <p className="text-white/70">
              Monitoramento técnico em tempo real da rede EXA.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Clock className="w-4 h-4" />
              <span>
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-[#E30613] hover:bg-[#E30613]/80 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
        condominios={condominios}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-[#E30613] mx-auto mb-4" />
          <p className="text-white/70">Carregando alertas...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && alerts.length === 0 && (
        <div className="bg-[#1A1A1A] rounded-lg p-12 text-center">
          <p className="text-white/70 text-lg">Nenhum alerta encontrado.</p>
        </div>
      )}

      {/* Cards View (Mobile) */}
      {!loading && alerts.length > 0 && (
        <div className="md:hidden grid grid-cols-1 gap-4 mb-6">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onClick={() => handleViewDetails(alert)}
            />
          ))}
        </div>
      )}

      {/* Table View (Desktop) */}
      {!loading && alerts.length > 0 && (
        <AlertsTable alerts={alerts} onViewDetails={handleViewDetails} />
      )}

      {/* Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleAlertUpdate}
      />
    </div>
  );
};
