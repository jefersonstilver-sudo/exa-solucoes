import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Plus,
  Search,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Eye,
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
  UserCheck,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { SignatariosExaManager } from '@/components/admin/contracts/SignatariosExaManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-500', icon: FileText },
  enviado: { label: 'Enviado', color: 'bg-blue-500', icon: Send },
  visualizado: { label: 'Visualizado', color: 'bg-amber-500', icon: Eye },
  assinado: { label: 'Assinado', color: 'bg-emerald-500', icon: CheckCircle2 },
  recusado: { label: 'Recusado', color: 'bg-red-500', icon: XCircle },
  expirado: { label: 'Expirado', color: 'bg-orange-500', icon: Clock },
  cancelado: { label: 'Cancelado', color: 'bg-gray-700', icon: XCircle },
};

const ContratosPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { isMobile } = useResponsiveLayout();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<string>('contratos');

  const { data: contratos, isLoading, refetch } = useQuery({
    queryKey: ['contratos-legais', statusFilter, tipoFilter],
    queryFn: async () => {
      let query = supabase
        .from('contratos_legais')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      if (tipoFilter !== 'todos') {
        query = query.eq('tipo_contrato', tipoFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pedidosSemContrato, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos-sem-contrato'],
    queryFn: async () => {
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pago', 'ativo', 'pago_pendente_video', 'video_enviado', 'video_aprovado'])
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      const { data: contratosExistentes, error: contratosError } = await supabase
        .from('contratos_legais')
        .select('pedido_id')
        .not('pedido_id', 'is', null);

      if (contratosError) throw contratosError;

      const pedidosComContrato = new Set(contratosExistentes?.map(c => c.pedido_id));
      return pedidos?.filter(p => !pedidosComContrato.has(p.id)) || [];
    },
    enabled: activeTab === 'pedidos-sem-contrato'
  });

  const filteredContratos = contratos?.filter(c =>
    c.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.numero_contrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cliente_cnpj?.includes(searchTerm)
  ) || [];

  const filteredPedidos = pedidosSemContrato?.filter(p =>
    p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.includes(searchTerm)
  ) || [];

  const stats = {
    total: contratos?.length || 0,
    assinados: contratos?.filter(c => c.status === 'assinado').length || 0,
    pendentes: contratos?.filter(c => ['enviado', 'visualizado'].includes(c.status)).length || 0,
    taxaAssinatura: contratos?.length 
      ? Math.round((contratos.filter(c => c.status === 'assinado').length / contratos.length) * 100) 
      : 0,
    pedidosSemContrato: pedidosSemContrato?.length || 0
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const tabs = [
    { id: 'contratos', label: 'Contratos', icon: Scale },
    { id: 'pedidos-sem-contrato', label: 'Sem Contrato', icon: AlertCircle, badge: stats.pedidosSemContrato },
    { id: 'signatarios', label: 'Signatários', icon: UserCheck },
  ];

  const statusFilters = ['todos', 'rascunho', 'enviado', 'visualizado', 'assinado', 'recusado', 'expirado'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Mobile Header */}
      {isMobile ? (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#9C1E1E]/10 rounded-xl">
                <Scale className="h-5 w-5 text-[#9C1E1E]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Jurídico</h1>
                <p className="text-[11px] text-muted-foreground">Contratos e Documentos</p>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => navigate(buildPath('juridico/novo'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] h-9 px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#9C1E1E]/10 rounded-xl">
                <Scale className="h-6 w-6 text-[#9C1E1E]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Jurídico</h1>
                <p className="text-sm text-muted-foreground">Gestão de Contratos e Documentos Legais</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate(buildPath('juridico/novo'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 md:p-6 space-y-4">
        {/* Stats - 2x2 Grid Mobile */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-5">
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Assinados</p>
                <p className="text-lg font-bold text-emerald-600">{stats.assinados}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold text-amber-600">{stats.pendentes}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Sem Contrato</p>
                <p className="text-lg font-bold text-red-600">{stats.pedidosSemContrato}</p>
              </div>
            </div>
          </Card>
          {!isMobile && (
            <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Scale className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Taxa Assinatura</p>
                  <p className="text-lg font-bold text-purple-600">{stats.taxaAssinatura}%</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Tabs Horizontais Scrolláveis */}
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
          <div className="inline-flex gap-2 min-w-max pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 min-h-[36px] ${
                    activeTab === tab.id
                      ? 'bg-[#9C1E1E] text-white shadow-md'
                      : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-red-500 text-white'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'contratos' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 h-10"
              />
            </div>

            {/* Status Pills */}
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
              <div className="inline-flex gap-1.5 min-w-max pb-2">
                {statusFilters.map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-[#9C1E1E] text-white'
                        : 'bg-white/80 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {status === 'todos' ? 'Todos' : statusConfig[status]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contracts List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredContratos.length === 0 ? (
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                <Scale className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-sm font-semibold mb-1">Nenhum contrato</h3>
                <p className="text-xs text-muted-foreground mb-3">Crie um novo contrato para começar</p>
                <Button size="sm" onClick={() => navigate(buildPath('juridico/novo'))}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Criar
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredContratos.map((contrato) => {
                  const status = statusConfig[contrato.status] || statusConfig.rascunho;
                  const StatusIcon = status.icon;

                  return (
                    <Card 
                      key={contrato.id} 
                      className="p-3 bg-white/80 backdrop-blur-sm border-white/50 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                      onClick={() => navigate(buildPath(`juridico/${contrato.id}`))}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono text-xs font-semibold text-[#9C1E1E]">
                              {contrato.numero_contrato}
                            </span>
                            <Badge className={`${status.color} text-white text-[10px] px-1.5 py-0`}>
                              {status.label}
                            </Badge>
                          </div>
                          <h3 className="font-medium text-sm truncate">{contrato.cliente_nome}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(contrato.created_at), "dd/MM/yy", { locale: ptBR })}
                            </span>
                            <span className="text-sm font-semibold">
                              {formatCurrency(contrato.valor_total)}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(buildPath(`juridico/${contrato.id}`))}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {contrato.status === 'assinado' && contrato.clicksign_download_url && (
                              <DropdownMenuItem onClick={() => window.open(contrato.clicksign_download_url, '_blank')}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'pedidos-sem-contrato' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 h-10"
              />
            </div>

            {loadingPedidos ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPedidos.length === 0 ? (
              <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold">Todos os pedidos têm contrato!</h3>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredPedidos.map((pedido) => (
                  <Card 
                    key={pedido.id}
                    className="p-3 bg-white/80 backdrop-blur-sm border-white/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{pedido.client_name || 'Cliente'}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(pedido.created_at), "dd/MM/yy", { locale: ptBR })} • {formatCurrency(pedido.valor_total)}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => navigate(buildPath(`juridico/novo?pedido_id=${pedido.id}`))}
                        className="h-8 px-3 text-xs bg-[#9C1E1E]"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Criar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'signatarios' && (
          <SignatariosExaManager />
        )}
      </div>
    </div>
  );
};

export default ContratosPage;
