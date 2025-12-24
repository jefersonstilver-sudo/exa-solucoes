import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Search, Clock, Check, X, Eye, Send, Copy, ExternalLink, MessageSquare, Mail, MoreVertical, Download, Trash2, DollarSign, TrendingUp, Phone, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useAuth } from '@/hooks/useAuth';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, startOfMonth, endOfMonth, formatDistanceToNow, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';
import { ProposalMobileList } from '@/components/admin/proposals/ProposalMobileList';
import { ProposalPreviewModal } from '@/components/admin/proposals/ProposalPreviewModal';
import { ProposalsPeriodSelector, getDefaultPeriod, type PeriodRange } from '@/components/admin/proposals/ProposalsPeriodSelector';
import { SellerStatsPanel } from '@/components/admin/proposals/SellerStatsPanel';
import { ProposalReminderIndicator } from '@/components/admin/proposals/ProposalReminderIndicator';
import { motion, AnimatePresence } from 'framer-motion';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_cnpj?: string | null;
  client_phone: string | null;
  client_email: string | null;
  client_company_name?: string | null;
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
  view_count: number | null;
  total_time_spent_seconds: number | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  is_viewing?: boolean;
  last_heartbeat_at?: string | null;
  converted_order_id?: string | null;
  created_by?: string | null;
  seller_name?: string | null;
  seller_phone?: string | null;
  seller_email?: string | null;
  payment_type?: string | null;
  custom_installments?: Array<{
    installment: number;
    due_date: string;
    amount: number;
  }> | null;
  metadata?: { type?: string };
}

interface LiveViewNotification {
  id: string;
  proposalId: string;
  clientName: string;
  timestamp: Date;
}

const formatCurrency = (value: number) => {
  return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

const formatCurrencyCompact = (value: number) => {
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
};

const PropostasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();
  const { isSuperAdmin, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todas');
  const [showExpiredCanceled, setShowExpiredCanceled] = useState(false);
  const [liveViewNotifications, setLiveViewNotifications] = useState<LiveViewNotification[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodRange>(getDefaultPeriod());
  const [showSellerStats, setShowSellerStats] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [proposalForResend, setProposalForResend] = useState<Proposal | null>(null);

  const { data: proposals = [], isLoading, refetch } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const proposalsWithSellers = await Promise.all((data || []).map(async (proposal: any) => {
        if (proposal.created_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('nome, telefone, email')
            .eq('id', proposal.created_by)
            .single();
          return { 
            ...proposal, 
            seller_name: userData?.nome || null,
            seller_phone: userData?.telefone || null,
            seller_email: userData?.email || null
          };
        }
        return proposal;
      }));
      
      return proposalsWithSellers as Proposal[];
    }
  });

  // Query para buscar valores recebidos e a receber (agrupado por vendedor) com filtro de período
  const { data: financialData } = useQuery({
    queryKey: ['proposals-financial', selectedPeriod],
    queryFn: async () => {
      // Buscar pedidos com proposal_id não nulo e dados da proposta associada
      const { data: orders, error: ordersError } = await supabase
        .from('pedidos')
        .select('id, proposal_id, valor_total, status, created_at')
        .not('proposal_id', 'is', null);
      
      if (ordersError) throw ordersError;

      // Buscar proposals para mapear created_by
      const proposalIds = orders?.map(o => o.proposal_id).filter(Boolean) || [];
      const { data: proposalsData } = await supabase
        .from('proposals')
        .select('id, created_by')
        .in('id', proposalIds);
      
      const proposalCreatorMap = new Map<string, string>();
      proposalsData?.forEach(p => {
        if (p.created_by) proposalCreatorMap.set(p.id, p.created_by);
      });

      // Buscar parcelas (sem filtro de período para mostrar totais reais)
      const { data: parcelas, error: parcelasError } = await supabase
        .from('parcelas')
        .select('pedido_id, valor_final, status, data_pagamento, data_vencimento');
      
      if (parcelasError) throw parcelasError;

      // Calcular valores totais e por vendedor
      let valorRecebido = 0;
      let valorAReceber = 0;
      const sellerFinancials = new Map<string, { received: number; toReceive: number }>();

      orders?.forEach(order => {
        const creatorId = order.proposal_id ? proposalCreatorMap.get(order.proposal_id) : null;
        const orderParcelas = parcelas?.filter(p => p.pedido_id === order.id) || [];
        
        orderParcelas.forEach(p => {
          const isPaid = p.status === 'pago' || p.status === 'paga';
          const isPending = p.status === 'pendente' || p.status === 'aguardando_pagamento';
          
          if (isPaid) {
            valorRecebido += p.valor_final || 0;
            if (creatorId) {
              const existing = sellerFinancials.get(creatorId) || { received: 0, toReceive: 0 };
              existing.received += p.valor_final || 0;
              sellerFinancials.set(creatorId, existing);
            }
          } else if (isPending) {
            valorAReceber += p.valor_final || 0;
            if (creatorId) {
              const existing = sellerFinancials.get(creatorId) || { received: 0, toReceive: 0 };
              existing.toReceive += p.valor_final || 0;
              sellerFinancials.set(creatorId, existing);
            }
          }
        });
      });

      return { valorRecebido, valorAReceber, sellerFinancials };
    }
  });

  useEffect(() => {
    const viewsChannel = supabase
      .channel('proposal-views-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'proposal_views' },
        async (payload) => {
          const proposalId = payload.new.proposal_id;
          const proposal = proposals.find(p => p.id === proposalId);
          const clientName = proposal?.client_name || 'Cliente';
          
          const notification: LiveViewNotification = {
            id: crypto.randomUUID(),
            proposalId,
            clientName,
            timestamp: new Date()
          };
          
          setLiveViewNotifications(prev => [notification, ...prev.slice(0, 4)]);
          setTimeout(() => {
            setLiveViewNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 5000);
          
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
        }
      )
      .subscribe();

    const statusChannel = supabase
      .channel('proposal-status-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'proposals' },
        async (payload) => {
          const oldStatus = (payload.old as any)?.status;
          const newStatus = (payload.new as any)?.status;
          
          if (oldStatus !== newStatus) {
            queryClient.invalidateQueries({ queryKey: ['proposals'] });
            
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
      .subscribe();

    return () => {
      supabase.removeChannel(viewsChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [proposals, queryClient]);

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = !searchTerm || 
      p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtrar expiradas/canceladas por padrão (a menos que toggle ativo)
    const isExpiredOrCanceled = ['expirada', 'cancelada'].includes(p.status);
    if (isExpiredOrCanceled && !showExpiredCanceled && activeFilter !== 'expiradas') {
      return false;
    }

    let matchesFilter = true;
    if (activeFilter === 'pendentes') {
      matchesFilter = ['pendente', 'enviada', 'visualizada'].includes(p.status);
    } else if (activeFilter === 'aceitas') {
      matchesFilter = ['aceita', 'paga', 'convertida'].includes(p.status);
    } else if (activeFilter === 'recusadas') {
      matchesFilter = p.status === 'recusada';
    } else if (activeFilter === 'pagas') {
      matchesFilter = ['paga', 'convertida'].includes(p.status);
    } else if (activeFilter === 'expiradas') {
      matchesFilter = isExpiredOrCanceled;
    }

    return matchesSearch && matchesFilter;
  });

  const proposalIds = filteredProposals.map(p => p.id);
  const { 
    selectedIds, 
    isAllSelected, 
    selectedCount, 
    toggleSelectAll, 
    toggleSelectItem, 
    clearSelection, 
    isSelected 
  } = useBulkSelection(proposalIds);

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    
    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      
      await supabase.from('pedidos').update({ proposal_id: null }).in('proposal_id', idsToDelete);
      await supabase.from('proposal_views').delete().in('proposal_id', idsToDelete);
      await supabase.from('proposal_logs').delete().in('proposal_id', idsToDelete);
      
      const { error } = await supabase.from('proposals').delete().in('id', idsToDelete);
      if (error) throw error;
      
      toast.success(`${selectedCount} proposta${selectedCount > 1 ? 's' : ''} excluída${selectedCount > 1 ? 's' : ''}!`);
      clearSelection();
      refetch();
    } catch (error) {
      console.error('Erro ao excluir propostas:', error);
      toast.error('Erro ao excluir propostas');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const pagasCount = proposals.filter(p => ['paga', 'convertida'].includes(p.status)).length;
  
  // Filter proposals by selected period
  const proposalsInPeriod = useMemo(() => {
    return proposals.filter(p => {
      const createdAt = new Date(p.created_at);
      return isWithinInterval(createdAt, { start: selectedPeriod.startDate, end: selectedPeriod.endDate });
    });
  }, [proposals, selectedPeriod]);

  // Calculate seller stats with financial data
  const sellerStats = useMemo(() => {
    const sellersMap = new Map<string, {
      id: string;
      name: string;
      proposalsSent: number;
      proposalsAccepted: number;
      valueReceived: number;
      valueToReceive: number;
    }>();

    proposalsInPeriod.forEach(p => {
      if (!p.created_by || !p.seller_name) return;
      
      // Get financial data for this seller
      const sellerFinancial = financialData?.sellerFinancials?.get(p.created_by);
      
      const existing = sellersMap.get(p.created_by) || {
        id: p.created_by,
        name: p.seller_name,
        proposalsSent: 0,
        proposalsAccepted: 0,
        valueReceived: sellerFinancial?.received || 0,
        valueToReceive: sellerFinancial?.toReceive || 0
      };

      existing.proposalsSent++;
      if (['aceita', 'paga', 'convertida'].includes(p.status)) {
        existing.proposalsAccepted++;
      }

      sellersMap.set(p.created_by, existing);
    });

    return Array.from(sellersMap.values()).sort((a, b) => b.proposalsSent - a.proposalsSent);
  }, [proposalsInPeriod, financialData?.sellerFinancials]);

  const stats = {
    proposalsToday: proposals.filter(p => isToday(new Date(p.created_at))).length,
    pendentes: proposals.filter(p => ['pendente', 'enviada', 'visualizada', 'atualizada'].includes(p.status)).length,
    enviadas: proposals.filter(p => ['enviada', 'atualizada'].includes(p.status)).length,
    valorRecebido: financialData?.valorRecebido || 0,
    valorAReceber: financialData?.valorAReceber || 0,
    valorPotencial: proposals
      .filter(p => ['pendente', 'enviada', 'visualizada', 'atualizada'].includes(p.status))
      .reduce((sum, p) => sum + (p.fidel_monthly_value * p.duration_months), 0)
  };

  const expiredCount = proposals.filter(p => ['expirada', 'cancelada'].includes(p.status)).length;
  
  const filters = [
    { id: 'todas', label: 'Todas', count: proposals.filter(p => !['expirada', 'cancelada'].includes(p.status)).length },
    { id: 'pendentes', label: '⏳ Pendentes', count: stats.pendentes },
    { id: 'aceitas', label: '✅ Aceitas', count: proposalsInPeriod.filter(p => ['aceita', 'paga', 'convertida'].includes(p.status)).length },
    { id: 'pagas', label: '💰 Pagas', count: pagasCount },
    { id: 'recusadas', label: '❌ Recusadas', count: proposals.filter(p => p.status === 'recusada').length },
    { id: 'expiradas', label: '⌛ Expiradas', count: expiredCount },
  ];

  // Verificar se cliente está visualizando AGORA (heartbeat < 45 segundos)
  const isActivelyViewing = (proposal: Proposal): boolean => {
    if (!proposal.is_viewing || !proposal.last_heartbeat_at) return false;
    const lastHeartbeat = new Date(proposal.last_heartbeat_at);
    const now = new Date();
    const secondsSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / 1000;
    return secondsSinceHeartbeat < 45;
  };

  const getStatusBadge = (status: string, proposal?: Proposal) => {
    // Status finais NUNCA mostram "Visualizando agora!!"
    const finalStatuses = ['recusada', 'paga', 'convertida', 'expirada', 'aceita'];
    
    // Verificar heartbeat real antes de mostrar "Visualizando agora!!"
    if (proposal && isActivelyViewing(proposal) && !finalStatuses.includes(status)) {
      return <Badge className="bg-green-500 hover:bg-green-600 animate-pulse text-[10px]">👁️ Visualizando agora!!</Badge>;
    }
    
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
      enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
      visualizada: { label: 'Visualizada', className: 'bg-purple-100 text-purple-700' },
      atualizada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
      aceita: { label: '✅ Aceita', className: 'bg-emerald-100 text-emerald-700' },
      paga: { label: '💰 Paga', className: 'bg-green-100 text-green-700' },
      convertida: { label: '🎉 Pedido', className: 'bg-green-600 text-white' },
      recusada: { label: '❌ Recusada', className: 'bg-red-100 text-red-700' },
      expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={`${config.className} text-[10px] px-1.5 py-0`}>{config.label}</Badge>;
  };

  // Formatar tempo de visualização
  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min${secs > 0 ? ` ${secs}s` : ''}`;
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
        toast.success('WhatsApp enviado!');
      } else if (via === 'email' && proposal.client_email) {
        await supabase.functions.invoke('send-proposal-email', {
          body: { proposalId: proposal.id }
        });
        toast.success('E-mail enviado!');
      } else {
        toast.error(`${via === 'whatsapp' ? 'Telefone' : 'E-mail'} não cadastrado`);
      }
      refetch();
    } catch (error) {
      toast.error('Erro ao reenviar proposta');
    }
  };

  const handleResendToOtherNumber = (proposal: Proposal) => {
    setProposalForResend(proposal);
    setCustomPhone('');
    setShowPhoneDialog(true);
  };

  const handleConfirmResendToOtherNumber = async () => {
    if (!proposalForResend || !customPhone.trim()) {
      toast.error('Informe um número de telefone');
      return;
    }
    
    try {
      await supabase.functions.invoke('send-proposal-whatsapp', {
        body: { 
          proposalId: proposalForResend.id,
          customPhone: customPhone.trim()
        }
      });
      toast.success('WhatsApp enviado para o número informado!');
      setShowPhoneDialog(false);
      setProposalForResend(null);
      refetch();
    } catch (error) {
      toast.error('Erro ao enviar WhatsApp');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 relative">
      {/* Live View Notifications */}
      <AnimatePresence>
        {liveViewNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{ top: `${70 + index * 60}px` }}
            className="fixed right-3 z-50 max-w-[280px]"
          >
            <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-xl shadow-lg p-2.5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{notification.clientName}</p>
                <p className="text-[10px] text-purple-600">Visualizando agora 👀</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      {isMobile ? (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#9C1E1E]/10 rounded-xl">
                <FileText className="h-5 w-5 text-[#9C1E1E]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Propostas</h1>
                <p className="text-[11px] text-muted-foreground">Comerciais</p>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => navigate(buildPath('propostas/nova'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] h-9 px-3"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Propostas Comerciais</h1>
              <p className="text-sm text-muted-foreground">Crie e gerencie propostas</p>
            </div>
            <Button 
              onClick={() => navigate(buildPath('propostas/nova'))}
              className="bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>
      )}

      <div className="p-3 md:p-6 space-y-3">
        {/* Period Selector + Stats Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
          <ProposalsPeriodSelector value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-[10px] text-muted-foreground">Recebido</span>
            </div>
            <div className="text-sm font-bold text-green-600">{formatCurrencyCompact(stats.valorRecebido)}</div>
          </Card>
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] text-muted-foreground">A Receber</span>
            </div>
            <div className="text-sm font-bold text-amber-600">{formatCurrencyCompact(stats.valorAReceber)}</div>
          </Card>
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] text-muted-foreground">Enviadas</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{stats.enviadas}</div>
          </Card>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-[10px] text-muted-foreground">Pendentes</span>
            </div>
            <div className="text-lg font-bold text-purple-600">{stats.pendentes}</div>
          </Card>
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-[10px] text-muted-foreground">Hoje</span>
            </div>
            <div className="text-lg font-bold">{stats.proposalsToday}</div>
          </Card>
        </div>

        {/* Seller Stats Toggle */}
        <SellerStatsPanel
          sellers={sellerStats}
          isLoading={isLoading}
          isOpen={showSellerStats}
          onToggle={() => setShowSellerStats(!showSellerStats)}
          period={selectedPeriod}
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 h-10"
          />
        </div>

        {/* Filter Pills */}
        <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
          <div className="inline-flex gap-1.5 min-w-max pb-2">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                  activeFilter === filter.id
                    ? 'bg-[#9C1E1E] text-white'
                    : 'bg-white/80 text-gray-600 border border-gray-200'
                }`}
              >
                {filter.label}
                <span className={`text-[10px] ${activeFilter === filter.id ? 'opacity-80' : 'text-gray-400'}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Use new component with long-press selection */}
        {isMobile ? (
          <ProposalMobileList
            proposals={filteredProposals}
            loading={isLoading}
            onViewDetails={(id) => navigate(buildPath(`propostas/${id}`))}
            onBulkDelete={isSuperAdmin ? async (ids) => {
              setIsDeleting(true);
              try {
                await supabase.from('pedidos').update({ proposal_id: null }).in('proposal_id', ids);
                await supabase.from('proposal_views').delete().in('proposal_id', ids);
                await supabase.from('proposal_logs').delete().in('proposal_id', ids);
                const { error } = await supabase.from('proposals').delete().in('id', ids);
                if (error) throw error;
                toast.success(`${ids.length} proposta${ids.length > 1 ? 's' : ''} excluída${ids.length > 1 ? 's' : ''}!`);
                refetch();
              } catch (error) {
                console.error('Erro ao excluir propostas:', error);
                toast.error('Erro ao excluir propostas');
              } finally {
                setIsDeleting(false);
              }
            } : undefined}
            isSuperAdmin={isSuperAdmin}
          />
        ) : (
          /* Desktop: Keep existing list */
          <>
            {/* Bulk Actions - Somente Super Admin */}
            {selectedCount > 0 && isSuperAdmin && (
              <Card className="p-2 bg-[#9C1E1E]/10 border-[#9C1E1E]/20 flex items-center justify-between">
                <span className="text-xs font-medium text-[#9C1E1E]">{selectedCount} selecionada(s)</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={clearSelection} className="h-7 text-xs">
                    Limpar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-7 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </Card>
            )}

            {/* Proposals List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#9C1E1E] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProposals.length === 0 ? (
              <Card className="p-8 text-center bg-white/80">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="text-sm font-semibold mb-1">Nenhuma proposta</h3>
                <p className="text-xs text-muted-foreground mb-3">Crie sua primeira proposta</p>
                <Button size="sm" onClick={() => navigate(buildPath('propostas/nova'))}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Criar
                </Button>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredProposals.map((proposal) => (
                  <Card 
                    key={proposal.id}
                    className="p-3 bg-white/80 backdrop-blur-sm border-white/50 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                    onClick={() => navigate(buildPath(`propostas/${proposal.id}`))}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox - Somente Super Admin */}
                      {isSuperAdmin && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CustomCheckbox
                            checked={isSelected(proposal.id)}
                            onCheckedChange={() => toggleSelectItem(proposal.id)}
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-xs font-semibold text-[#9C1E1E]">
                            {proposal.number}
                          </span>
                          {getStatusBadge(proposal.status, proposal)}
                          {proposal.status === 'expirada' && (
                            <ProposalReminderIndicator 
                              proposalId={proposal.id} 
                              proposalStatus={proposal.status} 
                              compact 
                            />
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate">{proposal.client_name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                          <span>{proposal.duration_months}M</span>
                          <span>•</span>
                          <span>{proposal.selected_buildings?.length || 0} prédio{(proposal.selected_buildings?.length || 0) !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {proposal.payment_type === 'custom' && proposal.custom_installments?.length 
                              ? formatCurrency(proposal.custom_installments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0))
                              : formatCurrency((proposal.fidel_monthly_value || 0) * (proposal.duration_months || 1))
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(proposal.created_at), "dd/MM", { locale: ptBR })}
                          </span>
                          {proposal.payment_type === 'custom' && proposal.custom_installments?.length ? (
                            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1 py-0 border-0">
                              {proposal.custom_installments.length}x parcelas
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(proposal.fidel_monthly_value)}/mês
                            </span>
                          )}
                          {proposal.view_count && proposal.view_count > 0 && (
                            <span className="text-[10px] text-purple-600 flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {proposal.view_count}x
                              {proposal.total_time_spent_seconds && proposal.total_time_spent_seconds > 0 && (
                                <span className="text-muted-foreground">
                                  ⏱️ {formatTimeSpent(proposal.total_time_spent_seconds)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Empresa + Vendedor - Lado Direito */}
                      <div className="text-right min-w-[100px] flex-shrink-0">
                        {proposal.client_company_name && (
                          <p className="text-[11px] font-medium text-foreground truncate max-w-[120px]" title={proposal.client_company_name}>
                            {proposal.client_company_name}
                          </p>
                        )}
                        {proposal.seller_name && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={proposal.seller_name}>
                            👤 {proposal.seller_name}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => setPreviewProposal(proposal)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(buildPath(`propostas/${proposal.id}`))}>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(proposal)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleResend(proposal, 'whatsapp')}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Reenviar WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResendToOtherNumber(proposal)}>
                            <Phone className="h-4 w-4 mr-2" />
                            Reenviar para outro número
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResend(proposal, 'email')}>
                            <Mail className="h-4 w-4 mr-2" />
                            Reenviar Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir propostas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {selectedCount} proposta(s) serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {previewProposal && (
        <ProposalPreviewModal
          open={!!previewProposal}
          onClose={() => setPreviewProposal(null)}
          proposal={previewProposal}
          sellerName={previewProposal.seller_name || undefined}
          sellerPhone={previewProposal.seller_phone || undefined}
          sellerEmail={previewProposal.seller_email || undefined}
        />
      )}

      {/* Dialog para Reenviar para Outro Número */}
      <AlertDialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reenviar WhatsApp para outro número</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o número de telefone para enviar a proposta{' '}
              <strong>{proposalForResend?.number}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="tel"
              placeholder="(11) 99999-9999"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProposalForResend(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResendToOtherNumber}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Enviar WhatsApp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PropostasPage;
