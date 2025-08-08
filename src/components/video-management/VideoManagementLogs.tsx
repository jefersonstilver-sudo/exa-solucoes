import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoLog {
  id: string;
  action_type: string;
  slot_from: number | null;
  slot_to: number | null;
  video_from_id: string | null;
  video_to_id: string | null;
  details: any;
  created_at: string;
}

interface VideoManagementLogsProps {
  orderId: string;
}

const getActionText = (log: VideoLog) => {
  switch (log.action_type) {
    case 'set_base_video':
      return 'Vídeo promovido a principal';
    case 'schedule_activated':
      return 'Agendamento ativado';
    case 'schedule_deactivated':
      return 'Agendamento desativado';
    default:
      return log.action_type;
  }
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'set_base_video':
      return <Video className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

export const VideoManagementLogs: React.FC<VideoManagementLogsProps> = ({ orderId }) => {
  const [logs, setLogs] = useState<VideoLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        console.log('📋 [VIDEO_LOGS] Carregando logs para pedido:', orderId);
        
        const { data, error } = await supabase
          .from('video_management_logs')
          .select('*')
          .eq('pedido_id', orderId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('❌ [VIDEO_LOGS] Erro ao carregar logs:', error);
          throw error;
        }

        console.log('✅ [VIDEO_LOGS] Logs carregados:', data);
        setLogs(data || []);
      } catch (error) {
        console.error('💥 [VIDEO_LOGS] Erro geral:', error);
        toast.error('Erro ao carregar histórico de ações');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchLogs();
    }
  }, [orderId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log de Agendamentos
          </CardTitle>
          <CardDescription>
            Carregando histórico de ações...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log de Agendamentos
          </CardTitle>
          <CardDescription>
            Nenhuma ação de gerenciamento de vídeo registrada ainda.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Log de Agendamentos
        </CardTitle>
        <CardDescription>
          Histórico de trocas de vídeo principal e ações de agendamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getActionIcon(log.action_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {getActionText(log)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.action_type}
                    </Badge>
                  </div>
                  
                  {log.slot_from && log.slot_to && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Slot {log.slot_from}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>Slot {log.slot_to}</span>
                    </div>
                  )}
                  
                  {log.details?.schedules_deactivated && (
                    <div className="text-xs text-orange-600 mt-1">
                      • Agendamento desativado automaticamente
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};