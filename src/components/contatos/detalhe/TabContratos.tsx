import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Plus, Eye, Calendar, AlertTriangle, CheckCircle, Clock, Send, FileText, ExternalLink } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface TabContratosProps {
  contact: Contact;
}

interface PedidoComContrato {
  id: string;
  nome_pedido: string | null;
  valor_total: number;
  data_inicio: string | null;
  data_fim: string | null;
  contrato_status: string | null;
  contrato_enviado_em: string | null;
  contrato_assinado_em: string | null;
  exigir_contrato: boolean | null;
  status: string;
}

export const TabContratos: React.FC<TabContratosProps> = ({ contact }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [contratos, setContratos] = useState<PedidoComContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    assinados: 0,
    pendentes: 0,
    enviados: 0
  });

  useEffect(() => {
    fetchContratos();
  }, [contact.id, contact.telefone, contact.email]);

  const fetchContratos = async () => {
    try {
      setLoading(true);
      const email = contact.email || '';
      
      // Buscar pedidos que exigem contrato
      let query = supabase
        .from('pedidos')
        .select('id, nome_pedido, valor_total, data_inicio, data_fim, contrato_status, contrato_enviado_em, contrato_assinado_em, exigir_contrato, status, email')
        .eq('exigir_contrato', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query.limit(100);

      if (error) throw error;
      
      // Filtrar por email do contato
      const filteredContratos = (data || []).filter(pedido => {
        if (email && pedido.email && pedido.email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
        return false;
      });
      
      setContratos(filteredContratos);
      
      // Calcular estatísticas
      const assinados = filteredContratos.filter(c => c.contrato_status === 'assinado').length;
      const enviados = filteredContratos.filter(c => c.contrato_status === 'enviado').length;
      const pendentes = filteredContratos.filter(c => c.contrato_status === 'pendente' || !c.contrato_status).length;
      
      setStats({
        total: filteredContratos.length,
        assinados,
        enviados,
        pendentes
      });
      
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContratoStatusConfig = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'assinado':
        return { 
          label: 'Assinado', 
          color: 'bg-green-100 text-green-700', 
          icon: CheckCircle,
          iconColor: 'text-green-500'
        };
      case 'enviado':
        return { 
          label: 'Enviado', 
          color: 'bg-blue-100 text-blue-700', 
          icon: Send,
          iconColor: 'text-blue-500'
        };
      case 'pendente':
      default:
        return { 
          label: 'Pendente', 
          color: 'bg-yellow-100 text-yellow-700', 
          icon: Clock,
          iconColor: 'text-yellow-500'
        };
    }
  };

  const handleViewContrato = (pedidoId: string) => {
    navigate(buildPath(`pedidos/${pedidoId}`));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardContent className="p-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="py-8">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Contratos</p>
                <p className="text-base font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assinados</p>
                <p className="text-base font-bold text-green-600">{stats.assinados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enviados</p>
                <p className="text-base font-bold">{stats.enviados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-base font-bold text-yellow-600">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Contratos</p>
                <p className="text-xs text-muted-foreground">{contratos.length} contrato(s)</p>
              </div>
            </div>
            <Button size="sm" className="h-8" disabled>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Contrato
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-0">
          {contratos.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum contrato encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Este contato ainda não possui contratos
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Contratos são gerados automaticamente em pedidos que exigem contrato
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contratos.map((contrato) => {
                const statusConfig = getContratoStatusConfig(contrato.contrato_status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div
                    key={contrato.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewContrato(contrato.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {contrato.nome_pedido || `Contrato #${contrato.id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {contrato.data_inicio && contrato.data_fim && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(contrato.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(contrato.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                          {contrato.contrato_assinado_em && (
                            <span className="text-green-600">
                              Assinado em {format(new Date(contrato.contrato_assinado_em), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                          {!contrato.contrato_assinado_em && contrato.contrato_enviado_em && (
                            <span className="text-blue-600">
                              Enviado em {format(new Date(contrato.contrato_enviado_em), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <p className="font-bold text-sm min-w-[80px] text-right">
                        R$ {(contrato.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabContratos;
