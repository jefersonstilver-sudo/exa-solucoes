import { useState, useEffect } from 'react';
import { X, Activity, HardDrive, Clock, AlertCircle } from 'lucide-react';
import { Device, formatUptime, formatTemperature, fetchDeviceAlerts } from '../utils/devices';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PanelDetailModalProps {
  device: Device;
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'overview' | 'status' | 'system' | 'history' | 'actions';

export const PanelDetailModal = ({ device, onClose, onUpdate }: PanelDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadAlerts();
    }
  }, [activeTab]);

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const data = await fetchDeviceAlerts(device.id);
      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'status', label: 'Status & Métricas', icon: Activity },
    { id: 'system', label: 'Sistema', icon: HardDrive },
    { id: 'history', label: 'Histórico', icon: Clock },
    { id: 'actions', label: 'Ações', icon: AlertCircle },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-[#0A0A0A]">{device.name}</h2>
            <p className="text-gray-600 mt-1">{device.condominio_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#FFD000] text-[#0A0A0A] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <DetailRow label="Nome" value={device.name} />
              <DetailRow label="Condomínio" value={device.condominio_name} />
              <DetailRow label="AnyDesk ID" value={device.anydesk_client_id} />
              {device.metadata?.torre && (
                <DetailRow label="Torre" value={device.metadata.torre} />
              )}
              {device.metadata?.elevador && (
                <DetailRow label="Elevador" value={device.metadata.elevador} />
              )}
              <DetailRow
                label="Status"
                value={
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      device.status === 'online'
                        ? 'bg-green-100 text-green-700'
                        : device.status === 'offline'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {device.status}
                  </span>
                }
              />
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              <DetailRow
                label="Status Atual"
                value={device.status.toUpperCase()}
              />
              <DetailRow
                label="Último Online"
                value={
                  device.last_online_at
                    ? format(new Date(device.last_online_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })
                    : 'Nunca'
                }
              />
              <DetailRow
                label="Uptime"
                value={formatUptime(device.metadata?.uptime)}
              />
              <DetailRow
                label="Última Queda"
                value={
                  device.metadata?.last_drop_at
                    ? format(new Date(device.metadata.last_drop_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })
                    : 'N/A'
                }
              />
              <DetailRow
                label="IP Address"
                value={device.metadata?.ip_address || 'N/A'}
              />
              <DetailRow
                label="Última Verificação"
                value={
                  device.metadata?.last_seen
                    ? format(new Date(device.metadata.last_seen), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })
                    : 'N/A'
                }
              />
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <DetailRow
                label="Sistema Operacional"
                value={device.metadata?.os_info || 'N/A'}
              />
              <DetailRow
                label="Temperatura"
                value={formatTemperature(device.metadata?.temperature)}
              />
              
              {/* Metadados adicionais */}
              {device.metadata && (
                <>
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Metadados Adicionais
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(device.metadata)
                        .filter(([key]) => 
                          !['torre', 'elevador', 'last_drop_at', 'uptime', 'ip_address', 'os_info', 'temperature', 'last_seen'].includes(key)
                        )
                        .map(([key, value]) => (
                          <DetailRow
                            key={key}
                            label={key}
                            value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          />
                        ))}
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>TODO:</strong> String will populate metadata with AnyDesk API data
                      including: os_info, ip_address, temperature, last_drop_at, uptime, last_seen
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loadingAlerts ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando histórico...
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum alerta registrado
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              alert.severity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'medium'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {alert.alert_type}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            alert.status === 'resolved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(alert.opened_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-[#FFD000] hover:bg-[#E6BB00] text-[#0A0A0A] font-semibold rounded-lg transition-colors">
                Assumir Painel
              </button>
              <button className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                Marcar como Agendado
              </button>
              <button className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
                Criar Alerta Manual
              </button>
              <button className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors">
                Ver Conversas Relacionadas
              </button>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>TODO:</strong> Implementar ações com endpoints apropriados:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Assumir → atualizar owner em devices</li>
                    <li>Marcar Agendado → criar/atualizar device_alerts</li>
                    <li>Criar Alerta → POST /api/device_alerts</li>
                    <li>Ver Conversas → buscar conversations linkadas ao device</li>
                  </ul>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm text-gray-900 font-medium text-right">{value}</span>
  </div>
);
