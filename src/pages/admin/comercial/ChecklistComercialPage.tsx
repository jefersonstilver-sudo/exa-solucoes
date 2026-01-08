import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Filter, ArrowLeft, AlertTriangle, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { useChecklistComercial, ChecklistItem } from '@/hooks/comercial/useChecklistComercial';
import { cn } from '@/lib/utils';

const ChecklistComercialPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: checklist, loading } = useChecklistComercial();
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');

  // Combinar todos os itens
  const todosItens = [
    ...checklist.urgentes,
    ...checklist.importantes,
    ...checklist.normais
  ];

  // Aplicar filtros
  const itensFiltrados = todosItens.filter(item => {
    if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;
    if (filtroPrioridade !== 'todos' && item.prioridade !== filtroPrioridade) return false;
    return true;
  });

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'lead_novo': 'Lead Novo',
      'lead_quente': 'Lead Quente',
      'proposta_vencendo': 'Proposta Vencendo',
      'proposta_aceita_sem_venda': 'Proposta Aceita sem Venda',
      'followup_hoje': 'Follow-up',
      'proposta_aguardando': 'Proposta Aguardando'
    };
    return labels[tipo] || tipo;
  };

  const getPrioridadeConfig = (prioridade: string) => {
    const configs: Record<string, { cor: string; bg: string; icon: string }> = {
      'urgente': { cor: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '🔴' },
      'importante': { cor: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '🟡' },
      'normal': { cor: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: '🟢' }
    };
    return configs[prioridade] || configs['normal'];
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/super_admin/comercial')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="h-7 w-7 text-red-600" />
                Checklist Comercial Detalhado
              </h1>
              <p className="text-muted-foreground mt-1">
                {itensFiltrados.length} itens pendentes
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="lead_novo">Lead Novo</SelectItem>
                  <SelectItem value="lead_quente">Lead Quente</SelectItem>
                  <SelectItem value="proposta_vencendo">Proposta Vencendo</SelectItem>
                  <SelectItem value="proposta_aceita_sem_venda">Aceita sem Venda</SelectItem>
                  <SelectItem value="followup_hoje">Follow-up</SelectItem>
                  <SelectItem value="proposta_aguardando">Aguardando Resposta</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas prioridades</SelectItem>
                  <SelectItem value="urgente">🔴 Urgente</SelectItem>
                  <SelectItem value="importante">🟡 Importante</SelectItem>
                  <SelectItem value="normal">🟢 Normal</SelectItem>
                </SelectContent>
              </Select>

              {(filtroTipo !== 'todos' || filtroPrioridade !== 'todos') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setFiltroTipo('todos');
                    setFiltroPrioridade('todos');
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ações Pendentes</span>
              <Badge variant="outline">{itensFiltrados.length} itens</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : itensFiltrados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckSquare className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="font-medium text-lg text-green-700">Nenhum item pendente!</p>
                <p className="text-sm mt-1">
                  {filtroTipo !== 'todos' || filtroPrioridade !== 'todos'
                    ? 'Tente ajustar os filtros'
                    : 'Todas as ações comerciais estão em dia'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {itensFiltrados.map(item => {
                  const config = getPrioridadeConfig(item.prioridade);
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(item.link_acao)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                        config.bg
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{config.icon}</span>
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(item.tipo)}
                            </Badge>
                          </div>
                          <p className={cn("font-medium", config.cor)}>
                            {item.titulo}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.descricao}
                          </p>
                          {item.dias_parado !== undefined && item.dias_parado > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3" />
                              Parado há {item.dias_parado} dias
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {item.valor && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <DollarSign className="h-3 w-3 mr-1" />
                              R$ {item.valor.toLocaleString('pt-BR')}
                            </Badge>
                          )}
                          <Button size="sm" variant="ghost" className="text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ChecklistComercialPage;
