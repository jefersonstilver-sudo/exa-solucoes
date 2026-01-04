import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, Plus, Send, Eye, CheckCircle, XCircle, Clock, 
  TrendingUp, DollarSign, Search, MoreVertical, BarChart3
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

interface TabPropostasProps {
  contact: Contact;
}

interface Proposal {
  id: string;
  number: string | null;
  client_name: string | null;
  status: string;
  fidel_monthly_value: number | null;
  cash_total_value: number | null;
  duration_months: number | null;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  view_count: number | null;
  total_time_spent_seconds: number | null;
  converted_order_id: string | null;
  total_panels: number | null;
}

export const TabPropostas: React.FC<TabPropostasProps> = ({ contact }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [propostas, setPropostas] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [stats, setStats] = useState({
    total: 0,
    enviadas: 0,
    aceitas: 0,
    taxaConversao: 0,
    valorTotal: 0
  });

  useEffect(() => {
    fetchPropostas();
  }, [contact.id, contact.telefone, contact.email]);

  const fetchPropostas = async () => {
    try {
      setLoading(true);
      const phone = contact.telefone?.replace(/\D/g, '') || '';
      const email = contact.email || '';
      
      let query = supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (email && phone) {
        query = query.or(`client_email.eq.${email},client_phone.ilike.%${phone}%`);
      } else if (email) {
        query = query.eq('client_email', email);
      } else if (phone) {
        query = query.ilike('client_phone', `%${phone}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      setPropostas(data || []);
      
      const total = data?.length || 0;
      const enviadas = data?.filter(p => p.sent_at).length || 0;
      const aceitas = data?.filter(p => p.status === 'aceita' || p.converted_order_id).length || 0;
      const valorTotal = data?.reduce((sum, p) => sum + (p.cash_total_value || p.fidel_monthly_value || 0), 0) || 0;
      
      setStats({
        total,
        enviadas,
        aceitas,
        taxaConversao: enviadas > 0 ? Math.round((aceitas / enviadas) * 100) : 0,
        valorTotal
      });
      
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (proposal: Proposal) => {
    if (proposal.converted_order_id) {
      return { label: 'Convertida', color: 'bg-emerald-100 text-emerald-700' };
    }
    switch (proposal.status?.toLowerCase()) {
      case 'aceita':
        return { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700' };
      case 'rejeitada':
        return { label: 'Rejeitada', color: 'bg-red-100 text-red-700' };
      case 'expirada':
        return { label: 'Expirada', color: 'bg-gray-100 text-gray-700' };
      case 'enviada':
        return { label: 'Enviada', color: 'bg-blue-100 text-blue-700' };
      case 'visualizada':
        return { label: 'Visualizada', color: 'bg-purple-100 text-purple-700' };
      case 'rascunho':
      default:
        return { label: 'Rascunho', color: 'bg-amber-100 text-amber-700' };
    }
  };

  const filterOptions = [
    { key: 'all', label: 'Todas', count: propostas.length },
    { key: 'sent', label: 'Enviadas', count: propostas.filter(p => p.sent_at).length },
    { key: 'accepted', label: 'Aceitas', count: propostas.filter(p => p.status === 'aceita' || p.converted_order_id).length },
    { key: 'pending', label: 'Aguardando', count: propostas.filter(p => p.status === 'enviada' || p.status === 'visualizada').length },
  ];

  const filteredPropostas = propostas.filter(p => {
    const matchesSearch = (p.number || p.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'sent' && p.sent_at) ||
      (filter === 'accepted' && (p.status === 'aceita' || p.converted_order_id)) ||
      (filter === 'pending' && (p.status === 'enviada' || p.status === 'visualizada'));
    return matchesSearch && matchesFilter;
  });

  const paginatedPropostas = filteredPropostas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredPropostas.length / itemsPerPage);

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
          label="Total Propostas (R$)"
          value={`R$ ${stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
          variation={15}
          icon={DollarSign}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatsCardLarge
          label="Taxa de Conversão"
          value={`${stats.taxaConversao}%`}
          variation={5}
          icon={TrendingUp}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCardLarge
          label="Última Ação"
          value={propostas.length > 0 ? format(new Date(propostas[0].created_at), 'dd/MM', { locale: ptBR }) : '-'}
          icon={Clock}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCardLarge
          label="Aguardando Resposta"
          value={propostas.filter(p => p.status === 'enviada' || p.status === 'visualizada').length.toString()}
          icon={Send}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Histórico de Propostas */}
      <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Histórico de Propostas</h3>
                  <p className="text-xs text-muted-foreground">{filteredPropostas.length} registro(s)</p>
                </div>
              </div>
              <Button size="sm" className="bg-[#9C1E1E] hover:bg-[#7d1818]" onClick={() => navigate(buildPath('propostas/nova'))}>
                <Plus className="w-4 h-4 mr-1" />
                Nova Proposta
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <FilterPills options={filterOptions} selected={filter} onSelect={setFilter} />
              <div className="relative flex-1 max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proposta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-8 bg-gray-50 border-0 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredPropostas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-foreground">Nenhuma proposta encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma proposta comercial para este contato
              </p>
              <Button variant="outline" className="mt-4" size="sm" onClick={() => navigate(buildPath('propostas/nova'))}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Criar Primeira Proposta
              </Button>
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
                  {paginatedPropostas.map((proposta) => {
                    const statusConfig = getStatusConfig(proposta);
                    return (
                      <TableRow 
                        key={proposta.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(buildPath(`propostas/${proposta.id}`))}
                      >
                        <TableCell>
                          <span className="text-[#9C1E1E] font-semibold text-sm">
                            #PROP-{proposta.number || proposta.id.slice(0, 3).toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>
                            <span className="text-muted-foreground">{format(new Date(proposta.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {format(new Date(proposta.created_at), 'HH:mm')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">Proposta Comercial</p>
                            <p className="text-xs text-muted-foreground">
                              {proposta.duration_months || 12} meses • {proposta.total_panels || 0} painéis
                              {proposta.view_count && proposta.view_count > 0 && (
                                <span className="ml-2 inline-flex items-center gap-0.5">
                                  <Eye className="w-3 h-3" /> {proposta.view_count}x
                                </span>
                              )}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          R$ {(proposta.cash_total_value || proposta.fidel_monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
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
                  totalItems={filteredPropostas.length}
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

export default TabPropostas;
