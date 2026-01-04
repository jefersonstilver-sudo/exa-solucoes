import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, Plus, ExternalLink, DollarSign, ShoppingCart, 
  TrendingUp, Search, Eye, MoreVertical, Calendar, Building2, Tv
} from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { StatsCardLarge, FilterPills, PaginationNumeric } from './ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface TabPedidosProps {
  contact: Contact;
}

interface Pedido {
  id: string;
  nome_pedido: string | null;
  valor_total: number;
  status: string;
  created_at: string;
  data_inicio: string | null;
  data_fim: string | null;
  plano_meses: number | null;
  lista_predios: string[] | null;
  metodo_pagamento: string | null;
  contrato_status: string | null;
}

export const TabPedidos: React.FC<TabPedidosProps> = ({ contact }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [stats, setStats] = useState({
    totalInvestido: 0,
    totalPedidos: 0,
    ticketMedio: 0,
    pedidosAtivos: 0
  });

  useEffect(() => {
    fetchPedidos();
  }, [contact.id, contact.email]);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const email = contact.email || '';
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, nome_pedido, valor_total, status, created_at, data_inicio, data_fim, plano_meses, lista_predios, metodo_pagamento, contrato_status, email')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const filteredPedidos = (data || []).filter(pedido => {
        if (email && pedido.email && pedido.email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
        return false;
      });
      
      setPedidos(filteredPedidos);
      
      const aprovados = filteredPedidos.filter(p => 
        p.status === 'aprovado' || p.status === 'concluido' || p.status === 'ativo'
      );
      const totalInvestido = aprovados.reduce((sum, p) => sum + (p.valor_total || 0), 0);
      const ativos = filteredPedidos.filter(p => p.status === 'ativo' || p.status === 'aprovado').length;
      
      setStats({
        totalInvestido,
        totalPedidos: filteredPedidos.length,
        ticketMedio: filteredPedidos.length > 0 ? totalInvestido / filteredPedidos.length : 0,
        pedidosAtivos: ativos
      });
      
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprovado':
      case 'ativo':
        return { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' };
      case 'concluido':
        return { label: 'Concluído', color: 'bg-blue-100 text-blue-700' };
      case 'pendente':
      case 'aguardando':
        return { label: 'Pendente', color: 'bg-amber-100 text-amber-700' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
      case 'expirado':
        return { label: 'Expirado', color: 'bg-gray-100 text-gray-700' };
      default:
        return { label: status || 'Novo', color: 'bg-blue-100 text-blue-700' };
    }
  };

  const filterOptions = [
    { key: 'all', label: 'Todos', count: pedidos.length },
    { key: 'active', label: 'Ativos', count: pedidos.filter(p => p.status === 'ativo' || p.status === 'aprovado').length },
    { key: 'completed', label: 'Concluídos', count: pedidos.filter(p => p.status === 'concluido').length },
  ];

  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = (p.nome_pedido || p.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && (p.status === 'ativo' || p.status === 'aprovado')) ||
      (filter === 'completed' && p.status === 'concluido');
    return matchesSearch && matchesFilter;
  });

  const paginatedPedidos = filteredPedidos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);

  // Active products (from active orders)
  const activePedidos = pedidos.filter(p => p.status === 'ativo' || p.status === 'aprovado');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCardLarge
          label="Total Gasto (LTV)"
          value={`R$ ${stats.totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          variation={12}
          icon={DollarSign}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCardLarge
          label="Total Pedidos"
          value={stats.totalPedidos.toString()}
          variation={8}
          icon={ShoppingCart}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCardLarge
          label="Ticket Médio"
          value={`R$ ${stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          variation={-3}
          icon={TrendingUp}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Produtos Ativos */}
      {activePedidos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Produtos Ativos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activePedidos.slice(0, 2).map(pedido => (
              <Card key={pedido.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(buildPath(`pedidos/${pedido.id}`))}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
                        <Tv className="w-5 h-5 text-[#9C1E1E]" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{pedido.nome_pedido || 'Mídia DOOH'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {pedido.lista_predios?.length || 0} painéis
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">ATIVO</Badge>
                  </div>
                  {pedido.data_fim && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Expira em {format(new Date(pedido.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card className="bg-gray-50 border-2 border-dashed border-gray-200 shadow-none hover:border-gray-300 transition-colors cursor-pointer">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[100px]">
                <Plus className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-sm font-medium text-gray-500">Adicionar Produto</span>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Histórico de Pedidos */}
      <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Histórico de Pedidos</h3>
                  <p className="text-xs text-muted-foreground">{filteredPedidos.length} registro(s)</p>
                </div>
              </div>
              <Button size="sm" className="bg-[#9C1E1E] hover:bg-[#7d1818]" onClick={() => navigate(buildPath('pedidos/novo'))}>
                <Plus className="w-4 h-4 mr-1" />
                Novo Pedido
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <FilterPills options={filterOptions} selected={filter} onSelect={setFilter} />
              <div className="relative flex-1 max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 bg-gray-50 border-0 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum pedido encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Este contato ainda não tem pedidos registrados
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">ID</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Data</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Descrição</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Valor</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPedidos.map((pedido) => {
                    const statusConfig = getStatusConfig(pedido.status);
                    return (
                      <TableRow 
                        key={pedido.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(buildPath(`pedidos/${pedido.id}`))}
                      >
                        <TableCell>
                          <span className="text-[#9C1E1E] font-semibold text-sm">
                            #PED-{pedido.id.slice(0, 4).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(pedido.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{pedido.nome_pedido || 'Pedido'}</p>
                            <p className="text-xs text-muted-foreground">
                              {pedido.plano_meses} meses • {pedido.lista_predios?.length || 0} painéis
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          R$ {(pedido.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <PaginationNumeric
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPedidos.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabPedidos;
