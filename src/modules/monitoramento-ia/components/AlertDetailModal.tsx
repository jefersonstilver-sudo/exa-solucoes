import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Clock, AlertCircle, CheckCircle, Calendar, MessageSquare, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { DeviceAlert } from '../utils/alerts';
import { updateAlertStatus, fetchAnyDeskMetadataStub } from '../utils/alerts';

interface AlertDetailModalProps {
  alert: DeviceAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const AlertDetailModal = ({ alert, isOpen, onClose, onUpdate }: AlertDetailModalProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (alert && isOpen) {
      // Call stub to simulate future AnyDesk integration
      fetchAnyDeskMetadataStub(alert.device_id);
    }
  }, [alert, isOpen]);

  if (!alert) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      const additionalData: any = {};
      
      if (newStatus === 'resolved') {
        additionalData.closed_at = new Date().toISOString();
      }

      await updateAlertStatus(alert.id, newStatus, additionalData);
      toast.success('Status atualizado com sucesso');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const timeOpen = formatDistanceToNow(new Date(alert.opened_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0A0A0A] border-[#2C2C2C] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#E30613]" />
            Detalhes do Alerta
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[#1A1A1A]">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-[#E30613]">
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-white data-[state=active]:bg-[#E30613]">
              Timeline
            </TabsTrigger>
            <TabsTrigger value="conversations" className="text-white data-[state=active]:bg-[#E30613]">
              Conversas
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-white data-[state=active]:bg-[#E30613]">
              Métricas
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-white data-[state=active]:bg-[#E30613]">
              Ações
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/50 mb-1">Status</p>
                  <p className="text-lg font-semibold text-white capitalize">{alert.status}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Severidade</p>
                  <p className="text-lg font-semibold text-[#E30613] uppercase">{alert.severity}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Painel</p>
                  <p className="text-lg font-semibold text-white">{alert.devices?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Condomínio</p>
                  <p className="text-lg font-semibold text-white">{alert.devices?.condominio_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Tempo aberto</p>
                  <p className="text-lg font-semibold text-white">{timeOpen}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Tipo de alerta</p>
                  <p className="text-lg font-semibold text-white">{alert.alert_type}</p>
                </div>
              </div>

              {alert.evidence && (
                <div>
                  <p className="text-sm text-white/50 mb-2">Evidências</p>
                  <pre className="bg-[#0A0A0A] p-4 rounded text-xs text-white/70 overflow-auto">
                    {JSON.stringify(alert.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#E30613] mt-2" />
                  <div className="flex-1">
                    <p className="text-white font-medium">Alerta aberto</p>
                    <p className="text-sm text-white/50">
                      {format(new Date(alert.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {alert.closed_at && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-white font-medium">Alerta fechado</p>
                      <p className="text-sm text-white/50">
                        {format(new Date(alert.closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* CONVERSATIONS TAB */}
          <TabsContent value="conversations" className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-6 text-center">
              <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">
                Integração com conversas será implementada futuramente.
              </p>
              <p className="text-sm text-white/50 mt-2">
                Aqui aparecerão mensagens relacionadas ao device_id: {alert.device_id}
              </p>
            </div>
          </TabsContent>

          {/* METRICS TAB */}
          <TabsContent value="metrics" className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Métricas do Sistema</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] p-4 rounded">
                  <p className="text-sm text-white/50 mb-1">Status do dispositivo</p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {alert.devices?.status || 'Desconhecido'}
                  </p>
                </div>
                <div className="bg-[#0A0A0A] p-4 rounded">
                  <p className="text-sm text-white/50 mb-1">Última conexão</p>
                  <p className="text-lg font-semibold text-white">
                    {alert.devices?.last_online_at 
                      ? formatDistanceToNow(new Date(alert.devices.last_online_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-[#0A0A0A] p-4 rounded">
                <p className="text-sm text-white/50 mb-2">Metadados AnyDesk</p>
                <p className="text-xs text-white/30">
                  Integração futura: temperatura, uptime, OS, IP, etc.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ACTIONS TAB */}
          <TabsContent value="actions" className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-lg p-6 space-y-3">
              <Button
                onClick={() => handleStatusChange('resolved')}
                disabled={loading || alert.status === 'resolved'}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Resolvido
              </Button>

              <Button
                onClick={() => handleStatusChange('scheduled')}
                disabled={loading || alert.status === 'scheduled'}
                className="w-full bg-[#2C2C2C] hover:bg-[#2C2C2C]/80 text-white"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Agendar Manutenção
              </Button>

              <Button
                onClick={() => handleStatusChange('open')}
                disabled={loading || alert.status === 'open'}
                className="w-full bg-[#E30613] hover:bg-[#E30613]/80 text-white"
              >
                <Activity className="w-4 h-4 mr-2" />
                Reabrir Alerta
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-[#2C2C2C] text-white hover:bg-[#2C2C2C]"
              >
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
