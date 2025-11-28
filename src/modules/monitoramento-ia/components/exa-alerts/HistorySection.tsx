import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Calendar, Filter, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertHistory {
  id: string;
  tipo_alerta: string;
  destinatario_nome: string | null;
  destinatario_telefone: string;
  mensagem_enviada: string;
  status: 'enviado' | 'entregue' | 'lido' | 'respondido' | 'erro';
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export const HistorySection = () => {
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    enviados: 0,
    entregues: 0,
    lidos: 0,
    erros: 0
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exa_alerts_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setHistory((data as AlertHistory[]) || []);
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        enviados: data?.filter(h => h.status === 'enviado').length || 0,
        entregues: data?.filter(h => h.status === 'entregue').length || 0,
        lidos: data?.filter(h => h.status === 'lido').length || 0,
        erros: data?.filter(h => h.status === 'erro').length || 0
      };
      setStats(stats);
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'bg-blue-100 text-blue-700';
      case 'entregue': return 'bg-green-100 text-green-700';
      case 'lido': return 'bg-purple-100 text-purple-700';
      case 'respondido': return 'bg-indigo-100 text-indigo-700';
      case 'erro': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'enviado': return 'Enviado';
      case 'entregue': return 'Entregue';
      case 'lido': return 'Lido';
      case 'respondido': return 'Respondido';
      case 'erro': return 'Erro';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9C1E1E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Histórico de Alertas</h2>
          <p className="text-sm text-gray-600 mt-1">
            Últimos 50 alertas enviados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 rounded-xl border border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-600">Enviados</p>
          <p className="text-2xl font-bold text-blue-700">{stats.enviados}</p>
        </Card>
        <Card className="p-4 rounded-xl border border-green-200 bg-green-50">
          <p className="text-sm text-green-600">Entregues</p>
          <p className="text-2xl font-bold text-green-700">{stats.entregues}</p>
        </Card>
        <Card className="p-4 rounded-xl border border-purple-200 bg-purple-50">
          <p className="text-sm text-purple-600">Lidos</p>
          <p className="text-2xl font-bold text-purple-700">{stats.lidos}</p>
        </Card>
        <Card className="p-4 rounded-xl border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">Erros</p>
          <p className="text-2xl font-bold text-red-700">{stats.erros}</p>
        </Card>
      </div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        {history.length === 0 ? (
          <Card className="p-8 text-center rounded-xl border-2 border-dashed border-gray-200">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum alerta enviado ainda</p>
          </Card>
        ) : (
          history.map((alert) => (
            <Card key={alert.id} className="p-4 rounded-xl border border-gray-200 hover:border-[#9C1E1E]/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(alert.status)}>
                      {getStatusLabel(alert.status)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.tipo_alerta}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    {alert.destinatario_nome || alert.destinatario_telefone}
                  </p>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {alert.mensagem_enviada}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </motion.div>
    </div>
  );
};
