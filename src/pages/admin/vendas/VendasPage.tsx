import React, { useState } from 'react';
import { useVendas } from '@/hooks/vendas/useVendas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { StatusVenda, StatusCampanhaOperacional, VendaComDetalhes } from '@/types/vendas';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

// Badge de status da venda
const VendaStatusBadge = ({ status }: { status: StatusVenda }) => {
  const config = {
    em_negociacao: { label: 'Em Negociação', variant: 'warning' as const, icon: Clock },
    ganha: { label: 'Ganha', variant: 'success' as const, icon: CheckCircle },
    perdida: { label: 'Perdida', variant: 'destructive' as const, icon: XCircle },
  };

  const { label, variant, icon: Icon } = config[status] || config.em_negociacao;

  return (
    <Badge variant={variant === 'success' ? 'default' : variant === 'warning' ? 'secondary' : 'destructive'} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

// Badge de status do contrato
const ContratoStatusBadge = ({ status }: { status?: string | null }) => {
  if (!status) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const config: Record<string, { label: string; className: string }> = {
    assinado: { label: '✅ Assinado', className: 'text-green-600' },
    enviado: { label: '⏳ Enviado', className: 'text-yellow-600' },
    pendente: { label: '📄 Pendente', className: 'text-orange-600' },
    cancelado: { label: '❌ Cancelado', className: 'text-red-600' },
  };

  const { label, className } = config[status] || { label: status, className: 'text-muted-foreground' };

  return <span className={`text-sm font-medium ${className}`}>{label}</span>;
};

// Badge de status da campanha
const CampanhaStatusBadge = ({ status }: { status?: StatusCampanhaOperacional | null }) => {
  if (!status) {
    return <span className="text-muted-foreground text-sm">— Aguardando</span>;
  }

  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    aguardando_contrato: { label: 'Aguard. Contrato', icon: <FileText className="h-3 w-3" />, className: 'text-orange-600' },
    aguardando_video: { label: 'Aguard. Vídeo', icon: <AlertCircle className="h-3 w-3" />, className: 'text-yellow-600' },
    em_revisao: { label: 'Em Revisão', icon: <Clock className="h-3 w-3" />, className: 'text-blue-600' },
    ativa: { label: 'Ativa', icon: <Play className="h-3 w-3" />, className: 'text-green-600' },
    pausada: { label: 'Pausada', icon: <Pause className="h-3 w-3" />, className: 'text-gray-600' },
    encerrada: { label: 'Encerrada', icon: <XCircle className="h-3 w-3" />, className: 'text-red-600' },
  };

  const { label, icon, className } = config[status] || { label: status, icon: null, className: 'text-muted-foreground' };

  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
};

// Card mobile para uma venda
const VendaCard = ({ venda, onClick }: { venda: VendaComDetalhes; onClick?: () => void }) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">{venda.cliente_nome}</p>
            <p className="text-sm text-muted-foreground">{venda.cliente_email}</p>
          </div>
          <VendaStatusBadge status={venda.status_venda} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-semibold text-primary">{formatCurrency(venda.valor_total)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Plano:</span>
            <p className="font-medium">{venda.plano_meses} {venda.plano_meses === 1 ? 'mês' : 'meses'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <ContratoStatusBadge status={venda.contrato_status} />
          <CampanhaStatusBadge status={venda.campanha_status} />
        </div>
      </CardContent>
    </Card>
  );
};

const VendasPage = () => {
  const { isMobile } = useAdvancedResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<StatusVenda | 'todas'>('todas');
  
  const { 
    vendas, 
    loading, 
    metrics, 
    filters, 
    setFilters, 
    refetch 
  } = useVendas({ status_venda: activeTab });

  // Atualizar filtros quando a busca muda
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  // Atualizar filtro de status
  const handleTabChange = (status: StatusVenda | 'todas') => {
    setActiveTab(status);
    setFilters({ ...filters, status_venda: status });
  };

  // Filtrar vendas localmente pela busca
  const filteredVendas = vendas.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.cliente_nome?.toLowerCase().includes(term) ||
      v.cliente_email?.toLowerCase().includes(term) ||
      v.id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">💼 Vendas</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gestão comercial unificada</p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('todas')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className="text-xl md:text-2xl font-bold">{metrics.total}</p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('em_negociacao')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Em Negociação</p>
                <p className="text-xl md:text-2xl font-bold text-yellow-600">{metrics.em_negociacao}</p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('ganha')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Ganhas</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{metrics.ganhas}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('perdida')}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Perdidas</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{metrics.perdidas}</p>
              </div>
              <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valor total e taxa */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Valor Total (Ganhas)</p>
            <p className="text-lg md:text-xl font-bold text-primary">{formatCurrency(metrics.valor_total_ganhas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Taxa de Conversão</p>
            <p className="text-lg md:text-xl font-bold text-green-600">{metrics.taxa_conversao.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, email ou ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabs de status */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['todas', 'em_negociacao', 'ganha', 'perdida'] as const).map((status) => (
                <Button
                  key={status}
                  variant={activeTab === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTabChange(status)}
                  className="whitespace-nowrap"
                >
                  {status === 'todas' ? 'Todas' : 
                   status === 'em_negociacao' ? 'Negociando' :
                   status === 'ganha' ? 'Ganhas' : 'Perdidas'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vendas */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVendas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma venda encontrada</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile: Cards */
        <div className="space-y-3">
          {filteredVendas.map((venda) => (
            <VendaCard key={venda.id} venda={venda} />
          ))}
        </div>
      ) : (
        /* Desktop: Tabela */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status Venda</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Campanha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas.map((venda) => (
                  <TableRow key={venda.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{venda.cliente_nome}</p>
                        <p className="text-sm text-muted-foreground">{venda.cliente_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">{formatCurrency(venda.valor_total)}</span>
                    </TableCell>
                    <TableCell>
                      {venda.plano_meses} {venda.plano_meses === 1 ? 'mês' : 'meses'}
                    </TableCell>
                    <TableCell>
                      <VendaStatusBadge status={venda.status_venda} />
                    </TableCell>
                    <TableCell>
                      <ContratoStatusBadge status={venda.contrato_status} />
                    </TableCell>
                    <TableCell>
                      <CampanhaStatusBadge status={venda.campanha_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendasPage;
