import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileCheck, Plus, Eye, CheckCircle, Clock, Send, 
  DollarSign, Search, MoreVertical, AlertTriangle, Download
} from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { StatsCardLarge, FilterPills, PaginationNumeric } from './ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

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
  created_at: string;
}

export const TabContratos: React.FC<TabContratosProps> = ({ contact }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [contratos, setContratos] = useState<PedidoComContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [stats, setStats] = useState({
    total: 0,
    assinados: 0,
    valorVigente: 0,
    vencendo: 0
  });

  useEffect(() => {
    fetchContratos();
  }, [contact.id, contact.email]);

  const fetchContratos = async () => {
    try {
      setLoading(true);
      const email = contact.email || '';
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, nome_pedido, valor_total, data_inicio, data_fim, contrato_status, contrato_enviado_em, contrato_assinado_em, exigir_contrato, status, email, created_at')
        .eq('exigir_contrato', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const filteredContratos = (data || []).filter(pedido => {
        if (email && pedido.email && pedido.email.toLowerCase() === email.toLowerCase()) {
          return true;
        }
        return false;
      });
      
      setContratos(filteredContratos);
      
      const assinados = filteredContratos.filter(c => c.contrato_status === 'assinado').length;
      const valorVigente = filteredContratos
        .filter(c => c.contrato_status === 'assinado')
        .reduce((sum, c) => sum + (c.valor_total || 0), 0);
      
      // Contratos vencendo nos próximos 30 dias
      const hoje = new Date();
      const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
      const vencendo = filteredContratos.filter(c => {
        if (!c.data_fim) return false;
        const dataFim = new Date(c.data_fim);
        return dataFim >= hoje && dataFim <= em30Dias;
      }).length;
      
      setStats({
        total: filteredContratos.length,
        assinados,
        valorVigente,
        vencendo
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
        return { label: 'Assinado', color: 'bg-emerald-100 text-emerald-700' };
      case 'enviado':
        return { label: 'Enviado', color: 'bg-blue-100 text-blue-700' };
      case 'pendente':
      default:
        return { label: 'Pendente', color: 'bg-amber-100 text-amber-700' };
    }
  };

  const filterOptions = [
    { key: 'all', label: 'Todos', count: contratos.length },
    { key: 'signed', label: 'Assinados', count: contratos.filter(c => c.contrato_status === 'assinado').length },
    { key: 'pending', label: 'Pendentes', count: contratos.filter(c => c.contrato_status !== 'assinado').length },
  ];

  const filteredContratos = contratos.filter(c => {
    const matchesSearch = (c.nome_pedido || c.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'signed' && c.contrato_status === 'assinado') ||
      (filter === 'pending' && c.contrato_status !== 'assinado');
    return matchesSearch && matchesFilter;
  });

  const paginatedContratos = filteredContratos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredContratos.length / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCardLarge
          label="Total Contratos"
          value={stats.total.toString()}
          icon={FileCheck}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCardLarge
          label="Assinados"
          value={stats.assinados.toString()}
          variation={10}
          icon={CheckCircle}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCardLarge
          label="Valor Vigente"
          value={`R$ ${stats.valorVigente.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCardLarge
          label="Vencendo em Breve"
          value={stats.vencendo.toString()}
          icon={AlertTriangle}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Documentos Legais */}
      <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Documentos Legais</h3>
                  <p className="text-xs text-muted-foreground">{filteredContratos.length} registro(s)</p>
                </div>
              </div>
              <Button size="sm" className="bg-[#9C1E1E] hover:bg-[#7d1818]" disabled>
                <Plus className="w-4 h-4 mr-1" />
                Novo Contrato
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <FilterPills options={filterOptions} selected={filter} onSelect={setFilter} />
              <div className="relative flex-1 max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 bg-gray-50 border-0 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredContratos.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum contrato encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contratos são gerados automaticamente em pedidos
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">ID</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Vigência</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Descrição</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Valor</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContratos.map((contrato) => {
                    const statusConfig = getContratoStatusConfig(contrato.contrato_status);
                    return (
                      <TableRow 
                        key={contrato.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(buildPath(`pedidos/${contrato.id}`))}
                      >
                        <TableCell>
                          <span className="text-[#9C1E1E] font-semibold text-sm">
                            #CTR-{contrato.id.slice(0, 4).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contrato.data_inicio && contrato.data_fim ? (
                            <span>
                              {format(new Date(contrato.data_inicio), 'dd/MM/yy')} - {format(new Date(contrato.data_fim), 'dd/MM/yy')}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{contrato.nome_pedido || 'Contrato de Serviço'}</p>
                            <p className="text-xs text-muted-foreground">
                              {contrato.contrato_assinado_em 
                                ? `Assinado em ${format(new Date(contrato.contrato_assinado_em), 'dd/MM/yyyy')}`
                                : contrato.contrato_enviado_em 
                                  ? `Enviado em ${format(new Date(contrato.contrato_enviado_em), 'dd/MM/yyyy')}`
                                  : 'Aguardando envio'
                              }
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          R$ {(contrato.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                              <Download className="w-4 h-4" />
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
                  totalItems={filteredContratos.length}
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

export default TabContratos;
