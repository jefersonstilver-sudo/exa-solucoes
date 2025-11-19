/**
 * Página: Painéis
 * 
 * CRUD avançado de painéis monitorados via AnyDesk
 * - Exibição em cards mobile-first (número do painel + nome do prédio centralizado)
 * - Atualização automática a cada 5 minutos
 * - Filtros avançados (status, condomínio, torre)
 * - Ordenação customizável
 * - Modal detalhado com guias: Overview | Status & Métricas | Sistema | Histórico | Ações
 * 
 * Metadados esperados em devices.metadata (populados pela String via AnyDesk API):
 * - torre: string
 * - elevador: string
 * - last_drop_at: timestamp
 * - uptime: number (segundos)
 * - ip_address: string
 * - os_info: string
 * - temperature: number
 * - last_seen: timestamp
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Device,
  DevicesFilters,
  DevicesSort,
  fetchDevices,
  calculateDeviceStats,
  createDevice,
  updateDevice,
} from '../utils/devices';
import { PanelCard } from '../components/PanelCard';
import { PanelDetailModal } from '../components/PanelDetailModal';
import { FiltersBar } from '../components/FiltersBar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PaineisPage = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filters, setFilters] = useState<DevicesFilters>({});
  const [sort, setSort] = useState<DevicesSort>({
    field: 'name',
    order: 'asc',
  });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    loadDevices();
    const interval = setInterval(() => {
      loadDevices();
    }, 5 * 60 * 1000); // 300000ms = 5 minutos

    return () => clearInterval(interval);
  }, [page, filters, sort]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const { devices: data, total: totalCount } = await fetchDevices(
        page,
        30,
        filters,
        sort
      );
      setDevices(data);
      setTotal(totalCount);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar painéis:', error);
      toast.error('Erro ao carregar painéis');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.info('Atualizando painéis...');
    loadDevices();
  };

  const stats = calculateDeviceStats(devices);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#0A0A0A]">
              Painéis
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Última atualização:{' '}
              {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <div className="text-xs text-gray-500 hidden lg:block">
              Auto-atualização: 5 min
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} color="blue" />
          <StatCard label="Online" value={stats.online} color="green" />
          <StatCard label="Offline" value={stats.offline} color="red" />
          <StatCard label="Desconhecido" value={stats.unknown} color="gray" />
        </div>

        {/* Filtros */}
        <FiltersBar
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onNewPanel={() => setShowNewModal(true)}
        />

        {/* Loading state */}
        {loading && devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD000]"></div>
            <p className="mt-4 text-gray-500">Carregando painéis...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">Nenhum painel encontrado</p>
          </div>
        ) : (
          <>
            {/* Grid de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <PanelCard
                  key={device.id}
                  device={device}
                  onClick={() => setSelectedDevice(device)}
                />
              ))}
            </div>

            {/* Paginação */}
            {total > 30 && (
              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Página {page + 1} de {Math.ceil(total / 30)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 30 >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes */}
      {selectedDevice && (
        <PanelDetailModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onUpdate={loadDevices}
        />
      )}

      {/* Modal de novo painel */}
      {showNewModal && (
        <NewPanelModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            loadDevices();
          }}
        />
      )}
    </div>
  );
};

// Componente de card estatístico
const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'gray';
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div
      className={`rounded-xl p-4 border ${colorClasses[color]}`}
    >
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
};

// Modal para criar novo painel
const NewPanelModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    condominio_name: '',
    anydesk_client_id: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.condominio_name || !formData.anydesk_client_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await createDevice(formData);
      toast.success('Painel criado com sucesso');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar painel:', error);
      toast.error(error.message || 'Erro ao criar painel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#0A0A0A]">Novo Painel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Painel *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
              placeholder="Ex: Painel 01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Condomínio *
            </label>
            <input
              type="text"
              value={formData.condominio_name}
              onChange={(e) =>
                setFormData({ ...formData, condominio_name: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
              placeholder="Ex: Edifício São Paulo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AnyDesk Client ID *
            </label>
            <input
              type="text"
              value={formData.anydesk_client_id}
              onChange={(e) =>
                setFormData({ ...formData, anydesk_client_id: e.target.value })
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD000]"
              placeholder="Ex: 123456789"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#FFD000] hover:bg-[#E6BB00] text-[#0A0A0A] font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar Painel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
