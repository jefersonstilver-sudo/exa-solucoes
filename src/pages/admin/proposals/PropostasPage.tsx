import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Search, Clock, Check, X, Eye, Send, Copy, ExternalLink, MessageSquare, Mail, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import MobilePageHeader from '@/components/admin/shared/MobilePageHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, startOfMonth, endOfMonth, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Tracking fields
  view_count: number | null;
  total_time_spent_seconds: number | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  // Conversion fields
  converted_order_id?: string | null;
  // Seller info
  created_by?: string | null;
  seller_name?: string | null;
}

interface LiveViewNotification {
  id: string;
  proposalId: string;
  clientName: string;
  timestamp: Date;
}

const PropostasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todas');
  const [liveViewNotifications, setLiveViewNotifications] = useState<LiveViewNotification[]>([]);

  // Buscar propostas do banco com nome do vendedor
  const { data: proposals = [], isLoading, refetch } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar nomes dos vendedores
      const proposalsWithSellers = await Promise.all((data || []).map(async (proposal: any) => {
        if (proposal.created_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('nome')
            .eq('id', proposal.created_by)
            .single();
          return { ...proposal, seller_name: userData?.nome || null };
        }
        return proposal;
      }));
      
      return proposalsWithSellers as Proposal[];
    }
  });

  // Real-time subscription para proposal_views
  useEffect(() => {
    const viewsChannel = supabase
      .channel('proposal-views-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proposal_views'
        },
        async (payload) => {
          console.log('🔔 Nova visualização de proposta em tempo real:', payload);
          
          const proposalId = payload.new.proposal_id;
          
          // Buscar nome do cliente da proposta
          const proposal = proposals.find(p => p.id === proposalId);
          const clientName = proposal?.client_name || 'Cliente';
          
          // Adicionar notificação
          const notification: LiveViewNotification = {
            id: crypto.randomUUID(),
            proposalId,
            clientName,
            timestamp: new Date()
          };
          
          setLiveViewNotifications(prev => [notification, ...prev.slice(0, 4)]);
          
          // Remover notificação após 5 segundos
          setTimeout(() => {
            setLiveViewNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 5000);
          
          // Refetch para atualizar contadores
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime proposal_views status:', status);
      });

    // ✅ NOVO: Canal para mudanças de STATUS em tempo real
    const statusChannel = supabase
      .channel('proposal-status-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proposals'
        },
        async (payload) => {
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          
          if (oldStatus !== newStatus) {
            console.log(`🔄 Status mudou: ${oldStatus} → ${newStatus}`);
            
            // Refetch para atualizar lista
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
            
            // Notificações especiais para status importantes
            if (newStatus === 'aceita') {
              toast.success('🎉 Proposta aceita!', {
                description: `${(payload.new as any)?.client_name} aceitou a proposta`
              });
            } else if (newStatus === 'paga' || newStatus === 'convertida') {
              toast.success('💰 Pagamento confirmado!', {
                description: `Proposta de ${(payload.new as any)?.client_name} foi paga`
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime proposal_status status:', status);
      });

    return () => {
      supabase.removeChannel(viewsChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [proposals, queryClient]);

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
      matchesFilter = ['aceita', 'paga', 'convertida'].includes(p.status);
    } else if (activeFilter === 'recusadas') {
      matchesFilter = p.status === 'recusada';
    } else if (activeFilter === 'pagas') {
      matchesFilter = ['paga', 'convertida'].includes(p.status);
    }

    return matchesSearch && matchesFilter;
  });

  // Calcular estatísticas
  const pagasCount = proposals.filter(p => ['paga', 'convertida'].includes(p.status)).length;
  const stats = {
    proposalsToday: proposals.filter(p => isToday(new Date(p.created_at))).length,
    pendentes: proposals.filter(p => ['pendente', 'enviada', 'visualizada'].includes(p.status)).length,
    aceitasMes: proposals.filter(p => {
      const createdAt = new Date(p.created_at);
      return ['aceita', 'paga', 'convertida'].includes(p.status) && 
        createdAt >= startOfMonth(new Date()) && 
        createdAt <= endOfMonth(new Date());
    }).length,
    valorPotencial: proposals
      .filter(p => ['pendente', 'enviada', 'visualizada'].includes(p.status))
      .reduce((sum, p) => sum + (p.fidel_monthly_value * p.duration_months), 0)
  };

  const filters = [
    { id: 'todas', label: 'Todas', count: proposals.length },
    { id: 'pendentes', label: '⏳ Pendentes', count: stats.pendentes, color: 'bg-amber-500' },
    { id: 'aceitas', label: '✅ Aceitas', count: stats.aceitasMes, color: 'bg-emerald-500' },
    { id: 'pagas', label: '💰 Pagas', count: pagasCount, color: 'bg-green-600' },
    { id: 'recusadas', label: 'Recusadas', count: proposals.filter(p => p.status === 'recusada').length, color: 'bg-red-500' },
  ];

  const statsCards = [
    { label: 'Propostas Hoje', value: stats.proposalsToday.toString(), icon: FileText, color: 'text-blue-600' },
    { label: 'Pendentes', value: stats.pendentes.toString(), icon: Clock, color: 'text-amber-600' },
    { label: 'Aceitas (mês)', value: stats.aceitasMes.toString(), icon: Check, color: 'text-emerald-600' },
    { label: 'Valor Potencial', value: formatCurrency(stats.valorPotencial), icon: Eye, color: 'text-purple-600' },
  ];

  const getStatusBadge = (status: string, proposal?: Proposal) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string; animated?: boolean }> = {
      pendente: { label: 'Pendente', variant: 'secondary' },
      enviada: { label: 'Enviada', variant: 'default', className: 'bg-primary' },
      visualizada: { label: '👁️ Visualizada', variant: 'outline', className: 'border-purple-400 text-purple-600 bg-purple-50' },
      aceita: { label: '✅ Aceita', variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-600' },
      paga: { label: '💰 Paga', variant: 'default', className: 'bg-green-600 hover:bg-green-700', animated: true },
      convertida: { label: '🎉 Pedido Criado', variant: 'default', className: 'bg-green-700 hover:bg-green-800' },
      recusada: { label: 'Recusada', variant: 'destructive' },
      expirada: { label: 'Expirada', variant: 'secondary' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
    
    return (
      <Badge 
        variant={config.variant}
        className={`${config.className || ''} ${config.animated ? 'animate-pulse' : ''}`}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 relative">
      {/* Notificações de Visualização em Tempo Real - Estilo Apple */}
      <AnimatePresence>
        {liveViewNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ top: `${80 + index * 70}px` }}
            className="fixed right-4 z-50 max-w-xs"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {notification.clientName}
                </p>
                <p className="text-[10px] text-purple-600 font-medium">
                  Visualizando proposta agora 👀
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
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
              <Card 
                key={proposal.id} 
                className="p-4 bg-white/80 backdrop-blur-sm border-white/50 cursor-pointer shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => navigate(buildPath(`propostas/${proposal.id}`))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-primary font-semibold">{proposal.number}</span>
                      {getStatusBadge(proposal.status)}
                      
                      {/* Link para o pedido se convertida */}
                      {proposal.converted_order_id && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] border-blue-400 text-blue-600 bg-blue-50 cursor-pointer hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(buildPath(`pedidos/${proposal.converted_order_id}`));
                          }}
                        >
                          📦 Ver Pedido
                        </Badge>
                      )}
                      
                      {/* Indicador de visualização */}
                      {proposal.view_count && proposal.view_count > 0 && (
                        <div className="flex items-center gap-1 text-purple-600 text-[10px] bg-purple-50 px-1.5 py-0.5 rounded-full">
                          <Eye className="h-3 w-3" />
                          <span>{proposal.view_count}x</span>
                          {proposal.last_viewed_at && (
                            <span className="text-purple-400">
                              • {formatDistanceToNow(new Date(proposal.last_viewed_at), { locale: ptBR, addSuffix: false })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Cliente + Vendedor */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm truncate">{proposal.client_name}</h3>
                      {proposal.seller_name && (
                        <span className="text-[10px] text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          👤 {proposal.seller_name}
                        </span>
                      )}
                    </div>
                    
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

                    {/* Data - "há quanto tempo" para pendentes, data fixa para outras */}
                    <div className="text-[10px] text-muted-foreground mt-2">
                      {['pendente', 'enviada', 'visualizada'].includes(proposal.status) ? (
                        <span>📤 Enviada {formatDistanceToNow(new Date(proposal.created_at), { locale: ptBR, addSuffix: true })}</span>
                      ) : (
                        <span>Criada em {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(buildPath(`propostas/${proposal.id}`));
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(proposal);
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://examidia.com.br/propostacomercial/${proposal.id}`, '_blank');
                      }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={async (e) => {
                        e.stopPropagation();
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
                      <DropdownMenuSeparator />
                      {proposal.client_phone && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleResend(proposal, 'whatsapp');
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Reenviar WhatsApp
                        </DropdownMenuItem>
                      )}
                      {proposal.client_email && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleResend(proposal, 'email');
                        }}>
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
