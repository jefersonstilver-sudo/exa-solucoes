import { useState } from 'react';
import { Monitor, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDevices } from '../hooks/useDevices';
import { calculateDeviceStats } from '../utils/devices';
import { StatCard } from '../components/StatCard';
import { PanelCard } from '../components/PanelCard';
import { PanelsTable } from '../components/PanelsTable';
import { PanelDetailModal } from '../components/PanelDetailModal';
import { ViewToggle } from '../components/ViewToggle';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { FiltersBar } from '../components/FiltersBar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Device } from '../utils/devices';

export const MonitoramentoIADashboard = () => {
  const { devices, loading, lastUpdate, filters, setFilters, sort, setSort, refresh } = useDevices();
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const stats = calculateDeviceStats(devices);
  const criticalCount = devices.filter(d => (d as any).has_critical_alert === true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              IA & Monitoramento EXA
            </h1>
            <p className="text-[#A0A0A0]">
              Monitoramento em tempo real dos painéis via AnyDesk
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportCsvButton devices={devices} />
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="bg-red-600 text-white px-6 py-4 rounded-xl flex items-center justify-between animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold text-lg">
                {criticalCount} Alerta{criticalCount > 1 ? 's' : ''} Crítico{criticalCount > 1 ? 's' : ''}
              </p>
              <p className="text-sm opacity-90">
                Requer atenção imediata
              </p>
            </div>
          </div>
          <Link to="/admin/monitoramento-ia/alertas">
            <Button variant="secondary" size="sm">
              Ver Alertas
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Online"
          value={stats.online}
          icon={CheckCircle2}
          iconColor="text-green-500"
        />
        <StatCard
          title="Offline"
          value={stats.offline}
          icon={AlertTriangle}
          iconColor="text-red-500"
        />
        <StatCard
          title="Total de Painéis"
          value={stats.total}
          icon={Monitor}
          iconColor="text-[#9C1E1E]"
        />
        <StatCard
          title="Status do Sistema"
          value="Operacional"
          icon={Activity}
          iconColor="text-green-500"
        />
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <FiltersBar
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onNewPanel={() => {}}
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <PanelCard
              key={device.id}
              device={device}
              onClick={() => setSelectedDevice(device)}
            />
          ))}
        </div>
      ) : (
        <PanelsTable
          devices={devices}
          onViewDetails={setSelectedDevice}
        />
      )}

      {devices.length === 0 && !loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Monitor className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum painel cadastrado</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDevice && (
        <PanelDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdate={refresh}
        />
      )}
    </div>
  );
};
