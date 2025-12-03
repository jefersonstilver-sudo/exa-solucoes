import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Search, Clock, Check, X, Eye, Send, Copy, ExternalLink, MessageSquare, Mail, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import MobilePageHeader from '@/components/admin/shared/MobilePageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_cnpj?: string | null;
  client_phone: string | null;
  client_email: string | null;
  total_panels: number;
  total_impressions_month: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  discount_percent: number;
  duration_months: number;
  status: string;
  created_at: string;
  sent_at: string | null;
  expires_at: string | null;
  selected_buildings: any[];
}

const PropostasPage = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todas');

  // Buscar propostas do banco
  const { data: proposals = [], isLoading, refetch } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Proposal[];
    }
  });

  // Filtrar propostas
  const filteredProposals = proposals.filter(p => {
    // Filtro de busca
    const matchesSearch = !searchTerm || 
      p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de status
    let matchesFilter = true;
    if (activeFilter === 'pendentes') {
      matchesFilter = ['pendente', 'enviada', 'visualizada'].includes(p.status);
    } else if (activeFilter === 'aceitas') {
      matchesFilter = p.status === 'aceita';
    } else if (activeFilter === 'recusadas') {
      matchesFilter = p.status === 'recusada';
    }

    return matchesSearch && matchesFilter;
  });

  // Calcular estatísticas
  const stats = {
    proposalsToday: proposals.filter(p => isToday(new Date(p.created_at))).length,
    pendentes: proposals.filter(p => ['pendente', 'enviada', 'visualizada'].includes(p.status)).length,
    aceitasMes: proposals.filter(p => {
      const createdAt = new Date(p.created_at);
      return p.status === 'aceita' && 
        createdAt >= startOfMonth(new Date()) && 
        createdAt <= endOfMonth(new Date());
    }).length,
    valorPotencial: proposals
      .filter(p => ['pendente', 'enviada', 'visualizada'].includes(p.status))
      .reduce((sum, p) => sum + (p.fidel_monthly_value * p.duration_months), 0)
  };

  const filters = [
    { id: 'todas', label: 'Todas', count: proposals.length },
    { id: 'pendentes', label: 'Pendentes', count: stats.pendentes, color: 'bg-amber-500' },
    { id: 'aceitas', label: 'Aceitas', count: stats.aceitasMes, color: 'bg-emerald-500' },
    { id: 'recusadas', label: 'Recusadas', count: proposals.filter(p => p.status === 'recusada').length, color: 'bg-red-500' },
  ];

  const statsCards = [
    { label: 'Propostas Hoje', value: stats.proposalsToday.toString(), icon: FileText, color: 'text-blue-600' },
    { label: 'Pendentes', value: stats.pendentes.toString(), icon: Clock, color: 'text-amber-600' },
    { label: 'Aceitas (mês)', value: stats.aceitasMes.toString(), icon: Check, color: 'text-emerald-600' },
    { label: 'Valor Potencial', value: formatCurrency(stats.valorPotencial), icon: Eye, color: 'text-purple-600' },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendente: { label: 'Pendente', variant: 'secondary' },
      enviada: { label: 'Enviada', variant: 'default' },
      visualizada: { label: 'Visualizada', variant: 'outline' },
      aceita: { label: 'Aceita', variant: 'default' },
      recusada: { label: 'Recusada', variant: 'destructive' },
      expirada: { label: 'Expirada', variant: 'secondary' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    return (
      <Badge 
        variant={config.variant}
        className={status === 'aceita' ? 'bg-emerald-500 hover:bg-emerald-600' : status === 'enviada' ? 'bg-primary' : ''}
      >
        {config.label}
      </Badge>
    );
  };

  const handleCopyLink = (proposal: Proposal) => {
    const link = `https://examidia.com.br/propostacomercial/${proposal.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleResend = async (proposal: Proposal, via: 'whatsapp' | 'email') => {
    try {
      if (via === 'whatsapp' && proposal.client_phone) {
        await supabase.functions.invoke('send-proposal-whatsapp', {
          body: { proposalId: proposal.id }
        });
        toast.success('Proposta reenviada via WhatsApp!');
      } else if (via === 'email' && proposal.client_email) {
        await supabase.functions.invoke('send-proposal-email', {
          body: { proposalId: proposal.id }
        });
        toast.success('Proposta reenviada via E-mail!');
      } else {
        toast.error(`${via === 'whatsapp' ? 'Telefone' : 'E-mail'} não cadastrado`);
      }
      refetch();
    } catch (error) {
      console.error('Erro ao reenviar:', error);
      toast.error('Erro ao reenviar proposta');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header Mobile */}
      {isMobile ? (
        <MobilePageHeader
          title="Propostas"
          subtitle="Gerencie suas propostas comerciais"
          icon={FileText}
        />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Propostas Comerciais</h1>
              <p className="text-sm text-muted-foreground">Crie e gerencie propostas para seus clientes</p>
            </div>
            <Button 
              onClick={() => navigate(buildPath('propostas/nova'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 md:p-6 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsCards.map((stat) => (
            <Card key={stat.label} className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-lg font-bold mt-1">{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-white/50"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? 'bg-[#9C1E1E] text-white shadow-md'
                    : 'bg-white/80 text-muted-foreground hover:bg-white'
                }`}
              >
                {filter.color && (
                  <span className={`w-2 h-2 rounded-full ${filter.color}`} />
                )}
                {filter.label}
                <span className={`px-1.5 rounded-full text-[10px] ${
                  activeFilter === filter.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Propostas */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white/80 backdrop-blur-sm border-white/50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-white/50 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma proposta encontrada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Tente uma busca diferente' : 'Comece criando sua primeira proposta comercial'}
            </p>
            <Button 
              onClick={() => navigate(buildPath('propostas/nova'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Proposta
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-primary font-semibold">{proposal.number}</span>
                      {getStatusBadge(proposal.status)}
                    </div>
                    
                    {/* Cliente */}
                    <h3 className="font-medium text-sm truncate">{proposal.client_name}</h3>
                    
                    {/* Info */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      <span>🏢 {(proposal.selected_buildings as any[])?.length || 0} prédios</span>
                      <span>📺 {proposal.total_panels} telas</span>
                      <span>⏱️ {proposal.duration_months} meses</span>
                    </div>

                    {/* Valores */}
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs">
                        💳 <strong className="text-foreground">{formatCurrency(proposal.fidel_monthly_value)}</strong>/mês
                      </span>
                      <span className="text-xs">
                        💵 <strong className="text-emerald-600">{formatCurrency(proposal.cash_total_value)}</strong> à vista
                      </span>
                    </div>

                    {/* Data */}
                    <div className="text-[10px] text-muted-foreground mt-2">
                      Criada em {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopyLink(proposal)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`https://examidia.com.br/propostacomercial/${proposal.id}`, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => {
                        try {
                          const exporter = new ProposalPDFExporter();
                          await exporter.generateProposalPDF(proposal as any, 'Equipe EXA');
                          toast.success('PDF gerado!');
                        } catch (err) {
                          toast.error('Erro ao gerar PDF');
                        }
                      }}>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </DropdownMenuItem>
                      {proposal.client_phone && (
                        <DropdownMenuItem onClick={() => handleResend(proposal, 'whatsapp')}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Reenviar WhatsApp
                        </DropdownMenuItem>
                      )}
                      {proposal.client_email && (
                        <DropdownMenuItem onClick={() => handleResend(proposal, 'email')}>
                          <Mail className="h-4 w-4 mr-2" />
                          Reenviar E-mail
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* FAB Mobile */}
        {isMobile && (
          <button
            onClick={() => navigate(buildPath('propostas/nova'))}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-[#9C1E1E] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#7D1818] transition-colors"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default PropostasPage;
