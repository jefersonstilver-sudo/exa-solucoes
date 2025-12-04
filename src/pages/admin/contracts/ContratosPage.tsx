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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ShoppingBag,
  AlertCircle,
  UserCheck
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

  // Buscar contratos
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

  // Buscar pedidos sem contrato
  const { data: pedidosSemContrato, isLoading: loadingPedidos } = useQuery({
    queryKey: ['pedidos-sem-contrato'],
    queryFn: async () => {
      // Buscar pedidos pagos
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pago', 'ativo', 'pago_pendente_video', 'video_enviado', 'video_aprovado'])
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      // Buscar contratos existentes
      const { data: contratosExistentes, error: contratosError } = await supabase
        .from('contratos_legais')
        .select('pedido_id')
        .not('pedido_id', 'is', null);

      if (contratosError) throw contratosError;

      // Filtrar pedidos que não têm contrato
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

  // Stats
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Jurídico</h1>
            <p className="text-sm text-muted-foreground">Gestão de Contratos e Documentos Legais</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate(buildPath('juridico/novo'))}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="p-4 bg-white/80 backdrop-blur-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white/80 backdrop-blur-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Assinados</p>
              <p className="text-xl font-bold text-emerald-600">{stats.assinados}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white/80 backdrop-blur-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-amber-600">{stats.pendentes}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white/80 backdrop-blur-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa</p>
              <p className="text-xl font-bold text-purple-600">{stats.taxaAssinatura}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white/80 backdrop-blur-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sem Contrato</p>
              <p className="text-xl font-bold text-red-600">{stats.pedidosSemContrato}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white/80 p-1">
          <TabsTrigger value="contratos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Scale className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
        <TabsTrigger value="pedidos-sem-contrato" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            Pedidos Sem Contrato
            {stats.pedidosSemContrato > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{stats.pedidosSemContrato}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signatarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserCheck className="h-4 w-4 mr-2" />
            Signatários EXA
          </TabsTrigger>
        </TabsList>

        {/* Tab: Contratos */}
        <TabsContent value="contratos" className="mt-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, número ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} className="bg-white/80">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Tabs por tipo */}
          <Tabs defaultValue="todos" onValueChange={setTipoFilter} className="mb-6">
            <TabsList className="bg-white/80 p-1">
              <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Todos
              </TabsTrigger>
              <TabsTrigger value="anunciante" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                Anunciantes
              </TabsTrigger>
              <TabsTrigger value="sindico" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="h-4 w-4 mr-2" />
                Síndicos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Status Filter Pills */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['todos', 'rascunho', 'enviado', 'visualizado', 'assinado', 'recusado', 'expirado'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`whitespace-nowrap ${statusFilter === status ? 'bg-primary' : 'bg-white/80'}`}
              >
                {status === 'todos' ? 'Todos' : statusConfig[status]?.label}
              </Button>
            ))}
          </div>

          {/* Contracts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredContratos.length === 0 ? (
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie um novo contrato para começar.
              </p>
              <Button onClick={() => navigate(buildPath('juridico/novo'))}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Contrato
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredContratos.map((contrato) => {
                const status = statusConfig[contrato.status] || statusConfig.rascunho;
                const StatusIcon = status.icon;

                return (
                  <Card 
                    key={contrato.id} 
                    className="p-4 bg-white/80 backdrop-blur-sm border border-white/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(buildPath(`juridico/${contrato.id}`))}
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info Principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {contrato.numero_contrato}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {contrato.tipo_contrato === 'anunciante' ? 'Anunciante' : 'Síndico'}
                          </Badge>
                          <Badge className={`${status.color} text-white text-xs`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold truncate">{contrato.cliente_nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {contrato.cliente_cnpj || contrato.cliente_cpf || 'Sem documento'}
                        </p>
                      </div>

                      {/* Valor e Datas */}
                      <div className="flex flex-col md:items-end gap-1">
                        <span className="font-bold text-lg">
                          {formatCurrency(contrato.valor_total)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Criado em {format(new Date(contrato.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {contrato.assinado_em && (
                          <span className="text-xs text-emerald-600">
                            Assinado em {format(new Date(contrato.assinado_em), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Ações
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
                                Baixar PDF Assinado
                              </DropdownMenuItem>
                            )}
                            {['enviado', 'visualizado'].includes(contrato.status) && (
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reenviar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Pedidos Sem Contrato */}
        <TabsContent value="pedidos-sem-contrato" className="mt-4">
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido por cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80"
              />
            </div>
          </div>

          {loadingPedidos ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredPedidos.length === 0 ? (
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Todos os pedidos possuem contrato!</h3>
              <p className="text-muted-foreground">
                Não há pedidos pagos aguardando geração de contrato.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPedidos.map((pedido) => (
                <Card 
                  key={pedido.id} 
                  className="p-4 bg-white/80 backdrop-blur-sm border border-white/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Info Principal */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{pedido.client_name || 'Cliente'}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {pedido.id.slice(0, 8)}... • {pedido.plano_meses || 1} meses
                        </p>
                        {pedido.metodo_pagamento && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {pedido.metodo_pagamento === 'pix_fidelidade' ? 'PIX Fidelidade' : 
                             pedido.metodo_pagamento === 'boleto_fidelidade' ? 'Boleto Fidelidade' :
                             pedido.metodo_pagamento === 'pix_avista' ? 'PIX à Vista' : 
                             pedido.metodo_pagamento}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Valor e Status */}
                    <div className="flex flex-col md:items-end gap-1">
                      <span className="font-bold text-lg">
                        {formatCurrency(pedido.valor_total)}
                      </span>
                      <Badge className="bg-amber-500 text-white text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Contrato Pendente
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(pedido.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(buildPath(`juridico/novo?pedido_id=${pedido.id}`))}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Scale className="h-4 w-4 mr-2" />
                        Gerar Contrato
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Signatários EXA */}
        <TabsContent value="signatarios" className="mt-4">
          <SignatariosExaManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContratosPage;
