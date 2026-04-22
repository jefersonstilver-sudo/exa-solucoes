import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Clock, User, Building2, Send, Eye, 
  MessageSquare, Mail, Smartphone, Monitor, Copy, Download, 
  RefreshCw, Gift, Timer, Check, X, MoreVertical, Phone, ExternalLink,
  CreditCard, AlertTriangle, Calendar, TrendingUp, BarChart3, 
  MapPin, Briefcase, Users, Triangle, RectangleHorizontal, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, addDays, addMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';
import { motion } from 'framer-motion';
import { EditPaymentDialog } from '@/components/admin/proposals/EditPaymentDialog';
import { CCEmailsCard } from '@/components/admin/proposals/CCEmailsCard';
import { AdminCloseProposalModal } from '@/components/admin/proposals/AdminCloseProposalModal';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { ViewsAnalyticsCard } from '@/components/admin/proposals/ViewsAnalyticsCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Import mockup
import mockupHorizontal from '@/assets/mockup-horizontal-new.png';

interface ProposalLog {
  id: string;
  proposal_id: string;
  action: string;
  details: any;
  created_at: string;
}

interface ProposalView {
  id: string;
  proposal_id: string;
  device_type: string | null;
  user_agent: string | null;
  time_spent_seconds: number | null;
  viewed_at: string;
  ip_address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  country_code?: string | null;
  isp?: string | null;
  session_id?: string | null;
  referrer_url?: string | null;
  timezone?: string | null;
}

interface Installment {
  due_date: string;
  amount: number;
}

const PropostaDetalhesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();

  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showBetterOfferDialog, setShowBetterOfferDialog] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [extensionHours, setExtensionHours] = useState(24);
  const [extraDiscount, setExtraDiscount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: proposal, isLoading, refetch } = useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: sellerData } = useQuery({
    queryKey: ['proposal-seller', proposal?.created_by],
    queryFn: async () => {
      if (!proposal?.created_by) return null;
      const { data } = await supabase
        .from('users')
        .select('nome, telefone, email')
        .eq('id', proposal.created_by)
        .single();
      return data;
    },
    enabled: !!proposal?.created_by
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['proposal-logs', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('proposal_logs')
        .select('*')
        .eq('proposal_id', id)
        .order('created_at', { ascending: true });
      return (data || []) as ProposalLog[];
    },
    enabled: !!id
  });

  const { data: views = [] } = useQuery({
    queryKey: ['proposal-views', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('proposal_views')
        .select('*, ip_address, city, region, country, country_code, isp, session_id, referrer_url, timezone')
        .eq('proposal_id', id)
        .order('viewed_at', { ascending: false });
      return (data || []) as ProposalView[];
    },
    enabled: !!id
  });

  const formatCurrency = (value: number) => {
    return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
  };

  const formatTimeSpent = (seconds: number | null) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}min ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      visualizada: { label: 'Visualizada', className: 'bg-purple-100 text-purple-700 border-purple-200' },
      aceita: { label: 'Aceita', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      paga: { label: 'Paga', className: 'bg-green-100 text-green-700 border-green-200' },
      convertida: { label: 'Pedido Criado', className: 'bg-green-600 text-white border-green-600' },
      recusada: { label: 'Recusada', className: 'bg-red-100 text-red-700 border-red-200' },
      expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500 border-gray-200' },
      atualizada: { label: 'Aguardando Re-aceite', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    };
    return configs[status] || configs.pendente;
  };

  const getLogIcon = (action: string) => {
    const icons: Record<string, { icon: React.ReactNode; color: string }> = {
      proposta_criada: { icon: <FileText className="h-3 w-3" />, color: 'bg-blue-500' },
      proposta_enviada: { icon: <Send className="h-3 w-3" />, color: 'bg-green-500' },
      proposta_visualizada: { icon: <Eye className="h-3 w-3" />, color: 'bg-purple-500' },
      proposta_aceita: { icon: <Check className="h-3 w-3" />, color: 'bg-emerald-500' },
      proposta_recusada: { icon: <X className="h-3 w-3" />, color: 'bg-red-500' },
      proposta_prorrogada: { icon: <Timer className="h-3 w-3" />, color: 'bg-blue-400' },
      condicao_especial_enviada: { icon: <Gift className="h-3 w-3" />, color: 'bg-pink-500' },
      proposta_atualizada: { icon: <RefreshCw className="h-3 w-3" />, color: 'bg-orange-500' },
      pagamento_alterado: { icon: <CreditCard className="h-3 w-3" />, color: 'bg-indigo-500' },
    };
    return icons[action] || { icon: <Clock className="h-3 w-3" />, color: 'bg-gray-400' };
  };

  // Calculate campaign dates
  const getCampaignDates = () => {
    if (!proposal) return { start: null, end: null, totalDays: 0 };
    
    // Use real dates if available
    const proposalAny = proposal as any;
    if (proposalAny.custom_days_start_date && proposalAny.custom_days_end_date) {
      const start = new Date(proposalAny.custom_days_start_date);
      const end = new Date(proposalAny.custom_days_end_date);
      const totalDays = differenceInDays(end, start);
      return { start, end, totalDays };
    }
    
    const start = new Date(proposal.created_at);
    const end = proposal.is_custom_days && proposal.custom_days 
      ? addDays(start, proposal.custom_days)
      : addMonths(start, proposal.duration_months || 1);
    const totalDays = differenceInDays(end, start);
    return { start, end, totalDays };
  };

  const handleExtendProposal = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    
    try {
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + extensionHours);
      
      await supabase
        .from('proposals')
        .update({ 
          expires_at: newExpiry.toISOString(),
          status: proposal.status === 'expirada' ? 'enviada' : proposal.status
        })
        .eq('id', id);

      await supabase.from('proposal_logs').insert({
        proposal_id: id,
        action: 'proposta_prorrogada',
        details: { extension_hours: extensionHours }
      });
      
      toast.success('Proposta prorrogada!');
      setShowExtendDialog(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao prorrogar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendBetterOffer = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    
    try {
      const newCashValue = proposal.cash_total_value * (1 - extraDiscount / 100);
      const newFidelValue = proposal.fidel_monthly_value * (1 - extraDiscount / 100);
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await supabase
        .from('proposals')
        .update({
          cash_total_value: newCashValue,
          fidel_monthly_value: newFidelValue,
          discount_percent: (proposal.discount_percent || 0) + extraDiscount,
          expires_at: newExpiry.toISOString(),
          status: 'enviada'
        })
        .eq('id', id);

      await supabase.from('proposal_logs').insert({
        proposal_id: id,
        action: 'condicao_especial_enviada',
        details: { extra_discount: extraDiscount }
      });
      
      if (proposal.client_phone) {
        await supabase.functions.invoke('send-proposal-whatsapp', {
          body: { proposalId: id, isBetterOffer: true }
        });
      }
      
      toast.success('Condição especial enviada!');
      setShowBetterOfferDialog(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao enviar condição');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePayment = async (paymentType: string, installments: Installment[]) => {
    if (!proposal) return;
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        payment_type: paymentType,
        custom_installments: paymentType === 'custom' ? installments : null,
        needs_reacceptance: true,
        last_modified_at: new Date().toISOString(),
        modified_by: user?.id,
        status: 'atualizada'
      };

      await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id);

      await supabase.from('proposal_logs').insert({
        proposal_id: id,
        action: 'pagamento_alterado',
        details: { 
          payment_type: paymentType,
          installments_count: installments.length,
          modified_by: user?.id
        }
      });
      
      toast.success('Condição de pagamento atualizada!');
      setShowEditPaymentDialog(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar condição de pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCCEmails = async (emails: string[]) => {
    if (!proposal) return;
    
    try {
      await supabase
        .from('proposals')
        .update({ cc_emails: emails })
        .eq('id', id);
      
      toast.success('E-mails de cópia salvos!');
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar e-mails');
      throw error;
    }
  };

  const handleResend = async (via: 'whatsapp' | 'email') => {
    if (!proposal) return;

    try {
      if (via === 'whatsapp' && proposal.client_phone) {
        const { error } = await supabase.functions.invoke('send-proposal-whatsapp', {
          body: { proposalId: proposal.id }
        });
        if (error) throw error;
        toast.success('WhatsApp enviado!');
      } else if (via === 'email' && proposal.client_email) {
        const { error } = await supabase.functions.invoke('send-proposal-email', {
          body: { proposalId: proposal.id }
        });
        if (error) throw error;
        toast.success('E-mail enviado!');
      } else {
        toast.error(`${via === 'whatsapp' ? 'Telefone' : 'E-mail'} não cadastrado`);
      }
      refetch();
    } catch (error: any) {
      console.error('[PropostaDetalhes] Erro ao reenviar:', error);
      toast.error(error?.message ? `Erro ao reenviar: ${error.message}` : 'Erro ao reenviar');
    }
  };

  const handleCopyLink = () => {
    const link = `https://examidia.com.br/propostacomercial/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#9C1E1E]" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="p-6 text-center bg-white/80">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-semibold">Proposta não encontrada</h3>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(buildPath('propostas'))}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const selectedBuildings = proposal.selected_buildings as any[] || [];
  const statusConfig = getStatusConfig(proposal.status);
  const campaignDates = getCampaignDates();
  const sellerName = proposal.seller_name || sellerData?.nome || 'Equipe EXA';
  const sellerPhone = proposal.seller_phone || sellerData?.telefone || '';
  const sellerEmail = proposal.seller_email || sellerData?.email || '';
  const totalScreens = selectedBuildings.reduce((sum, b) => sum + (b.quantidade_telas || 1), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pb-6">
      {/* Corporate Header - EXA Red */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-r from-[#4a0f0f] to-[#7D1818] text-white"
      >
        <div className="px-4 py-4 safe-area-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(buildPath('propostas'))}
                className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
              <div className="flex items-center gap-2">
                  <UnifiedLogo variant="light" className="h-6 w-auto" />
                  <span className="text-white/60 mx-2">|</span>
                  <span className="font-bold text-lg">{proposal.number}</span>
                </div>
                <p className="text-white/70 text-xs mt-0.5">
                  Criada em {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <Badge className={`${statusConfig.className} text-xs px-2.5 py-1 border font-medium`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="p-4 space-y-4">
        {/* Re-acceptance Warning - Subtle Card */}
        {proposal.needs_reacceptance && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Card className="p-4 bg-white border-l-4 border-l-[#9C1E1E] shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#9C1E1E] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Aguardando re-aceite do cliente</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    A proposta foi modificada e precisa ser aceita novamente.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleResend('whatsapp')}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Reenviar WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleResend('email')}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1.5" />
                      Reenviar E-mail
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Client Information Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-4 bg-white shadow-sm border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">
                  {proposal.client_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-gray-900 truncate">{proposal.client_name}</h2>
                {proposal.client_company_name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {proposal.client_company_name}
                  </p>
                )}
                {proposal.client_cnpj && (
                  <p className="text-xs text-gray-500 mt-1">{proposal.client_cnpj}</p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {proposal.client_phone && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-3 text-xs gap-1.5"
                      onClick={() => window.open(`tel:${proposal.client_phone}`, '_blank')}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {proposal.client_phone}
                    </Button>
                  )}
                  {proposal.client_email && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-3 text-xs gap-1.5"
                      onClick={() => window.open(`mailto:${proposal.client_email}`, '_blank')}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {proposal.client_email}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Summary Grid 2x2 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="p-4 bg-white shadow-sm border-gray-100 text-center">
            <Building2 className="h-5 w-5 mx-auto text-[#9C1E1E] mb-1" />
            <p className="text-2xl font-bold text-gray-900">{selectedBuildings.length}</p>
            <p className="text-xs text-gray-500">Prédios</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-gray-100 text-center">
            <Monitor className="h-5 w-5 mx-auto text-[#9C1E1E] mb-1" />
            <p className="text-2xl font-bold text-gray-900">{totalScreens}</p>
            <p className="text-xs text-gray-500">Telas</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-gray-100 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-[#9C1E1E] mb-1" />
            <p className="text-2xl font-bold text-gray-900">{(11610 * selectedBuildings.length).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-500">Exibições/mês</p>
          </Card>
          <Card className="p-4 bg-white shadow-sm border-gray-100 text-center">
            <Calendar className="h-5 w-5 mx-auto text-[#9C1E1E] mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {proposal.is_custom_days ? `${proposal.custom_days}d` : `${proposal.duration_months}m`}
            </p>
            <p className="text-xs text-gray-500">Duração</p>
          </Card>
        </motion.div>

        {/* Campaign Period Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4 bg-white shadow-sm border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-[#9C1E1E]" />
              <h3 className="font-semibold text-sm text-gray-900">Período da Campanha</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Início</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {campaignDates.start && format(campaignDates.start, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Término</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {campaignDates.end && format(campaignDates.end, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="bg-[#9C1E1E]/10 rounded-lg py-2">
                <p className="text-xs text-[#9C1E1E] uppercase tracking-wide font-medium">Total</p>
                <p className="text-lg font-bold text-[#9C1E1E] mt-0.5">
                  {campaignDates.totalDays} dias
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Product Showcase - Mockup */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-white shadow-sm border-gray-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="w-full max-w-[200px] shrink-0">
                <img 
                  src={mockupHorizontal} 
                  alt="Painel Horizontal"
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <RectangleHorizontal className="h-5 w-5 text-[#9C1E1E]" />
                  <h3 className="font-bold text-gray-900">HORIZONTAL</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span><strong>10 segundos</strong> de exibição</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Até <strong>15 empresas</strong> por prédio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Triangle className="h-4 w-4 text-gray-400" />
                    <span>Proporção <strong>4:3</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    <span><strong>15.060</strong> exibições/mês por painel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span><strong>{(502 * totalScreens).toLocaleString('pt-BR')}</strong> vezes/dia (total)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 italic flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Em média, moradores utilizam o elevador 40× por semana
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Value Card with Price Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-5 bg-white shadow-sm border-gray-100">
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Valor à Vista</p>
              <p className="text-3xl font-bold text-[#9C1E1E] mt-1">
                {formatCurrency(proposal.cash_total_value)}
              </p>
              {proposal.discount_percent > 0 && (
                <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0 text-xs font-medium">
                  {proposal.discount_percent}% OFF
                </Badge>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fidelidade/mês</span>
                <span className="font-semibold">{formatCurrency(proposal.fidel_monthly_value)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total em {proposal.is_custom_days ? `${proposal.custom_days} dias` : `${proposal.duration_months} meses`}</span>
                <span className="font-semibold">{formatCurrency(proposal.is_custom_days ? ((proposal as any).total_value || 0) : (proposal.fidel_monthly_value * proposal.duration_months))}</span>
              </div>
              
              {/* Custom Installments */}
              {proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments) && proposal.custom_installments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Parcelas Personalizadas ({proposal.custom_installments.length}x)
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {(proposal.custom_installments as { due_date: string; amount: number }[]).map((inst, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-600">
                        <span>{idx + 1}ª - {format(new Date(inst.due_date), 'dd/MM/yy')}</span>
                        <span className="font-medium">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency((proposal.custom_installments as { amount: number }[]).reduce((sum, inst) => sum + (inst.amount || 0), 0))}</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 h-9 text-xs"
              onClick={() => setShowEditPaymentDialog(true)}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Editar Condição de Pagamento
            </Button>
          </Card>
        </motion.div>

        {/* Selected Buildings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-white shadow-sm border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#9C1E1E]" />
                <h3 className="font-semibold text-sm text-gray-900">Prédios Selecionados</h3>
              </div>
              <Badge variant="outline" className="text-xs">{selectedBuildings.length}</Badge>
            </div>
            <div className="space-y-2">
              {selectedBuildings.map((building: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-[#9C1E1E]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{building.building_name || building.nome}</p>
                      <p className="text-xs text-gray-500">{building.bairro || 'Sem bairro'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{building.quantidade_telas || 1} tela(s)</p>
                    <p className="text-xs text-gray-500">{(11610).toLocaleString('pt-BR')} exib./mês</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Views Analytics - Análise Avançada de Visualizações */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <ViewsAnalyticsCard 
            views={views}
            totalTimeSpent={proposal.total_time_spent_seconds || 0}
            viewCount={proposal.view_count || 0}
            firstViewedAt={proposal.first_viewed_at}
            lastViewedAt={proposal.last_viewed_at}
          />
        </motion.div>

        {/* CC Emails Card */}
        <CCEmailsCard 
          ccEmails={proposal.cc_emails || []}
          onSave={handleSaveCCEmails}
        />

        {/* Actions Card - Inline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 bg-white shadow-sm border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Send className="h-4 w-4 text-[#9C1E1E]" />
              <h3 className="font-semibold text-sm text-gray-900">Ações</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs justify-start gap-2"
                onClick={() => handleResend('whatsapp')}
              >
                <MessageSquare className="h-4 w-4 text-green-600" />
                Reenviar WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs justify-start gap-2"
                onClick={() => handleResend('email')}
              >
                <Mail className="h-4 w-4 text-blue-600" />
                Reenviar E-mail
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs justify-start gap-2"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4 text-gray-600" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs justify-start gap-2"
                onClick={() => window.open(`https://examidia.com.br/propostacomercial/${id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 text-purple-600" />
                Ver Página Pública
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-xs justify-start gap-2"
                onClick={() => setShowExtendDialog(true)}
              >
                <Timer className="h-4 w-4 text-blue-500" />
                Prorrogar Validade
              </Button>
              <Button
                size="sm"
                className="h-10 text-xs justify-start gap-2 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
                onClick={() => setShowBetterOfferDialog(true)}
              >
                <Gift className="h-4 w-4" />
                Condição Especial
              </Button>
              
              {proposal.status !== 'convertida' && (
                <Button
                  size="sm"
                  className="h-10 text-xs justify-start gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowCloseModal(true)}
                >
                  <CheckCircle className="h-4 w-4" />
                  Fechar Proposta
                </Button>
              )}
            </div>
            
            {/* PDF Export */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 text-xs gap-2"
                onClick={async () => {
                  const exporter = new ProposalPDFExporter();
                  await exporter.generateProposalPDF(proposal as any, sellerName, false, 0, sellerPhone);
                }}
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Timeline / History */}
        {logs.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="p-4 bg-white shadow-sm border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#9C1E1E]" />
                <h3 className="font-semibold text-sm text-gray-900">Histórico</h3>
              </div>
              <div className="relative pl-5">
                <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200 rounded-full" />
                
                <div className="space-y-3">
                  {logs.slice().reverse().slice(0, 8).map((log) => {
                    const logIcon = getLogIcon(log.action);
                    return (
                      <div key={log.id} className="relative flex items-start gap-3">
                        <div className={`absolute -left-5 w-4 h-4 rounded-full ${logIcon.color} flex items-center justify-center text-white`}>
                          {logIcon.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Seller Info */}
        {sellerName && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 bg-white shadow-sm border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-[#9C1E1E]" />
                <h3 className="font-semibold text-sm text-gray-900">Vendedor Responsável</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{sellerName}</p>
                  {sellerPhone && <p className="text-xs text-gray-500">{sellerPhone}</p>}
                  {sellerEmail && <p className="text-xs text-gray-500">{sellerEmail}</p>}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Extend Dialog */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">Prorrogar Proposta</DialogTitle>
            <DialogDescription className="text-xs">
              Selecione por quanto tempo deseja prorrogar
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-3">
            {[24, 72, 168].map(hours => (
              <Button
                key={hours}
                variant={extensionHours === hours ? 'default' : 'outline'}
                onClick={() => setExtensionHours(hours)}
                className={`h-10 text-xs ${extensionHours === hours ? 'bg-[#9C1E1E]' : ''}`}
              >
                {hours === 24 ? '24h' : hours === 72 ? '72h' : '7 dias'}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowExtendDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleExtendProposal} 
              disabled={isSubmitting}
              className="bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              {isSubmitting ? 'Prorrogando...' : 'Prorrogar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Better Offer Dialog */}
      <Dialog open={showBetterOfferDialog} onOpenChange={setShowBetterOfferDialog}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base">Condição Especial</DialogTitle>
            <DialogDescription className="text-xs">
              Envie um desconto adicional para o cliente
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-3">
            {[5, 10, 15, 20].map(percent => (
              <Button
                key={percent}
                variant={extraDiscount === percent ? 'default' : 'outline'}
                onClick={() => setExtraDiscount(percent)}
                className={`h-10 text-xs ${extraDiscount === percent ? 'bg-[#9C1E1E]' : ''}`}
              >
                {percent}%
              </Button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Novo valor à vista</p>
            <p className="text-xl font-bold text-[#9C1E1E]">
              {formatCurrency(proposal.cash_total_value * (1 - extraDiscount / 100))}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBetterOfferDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleSendBetterOffer} 
              disabled={isSubmitting}
              className="bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Oferta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      {showEditPaymentDialog && (
        <EditPaymentDialog
          open={showEditPaymentDialog}
          onOpenChange={setShowEditPaymentDialog}
          currentPaymentType={proposal.payment_type || 'cash'}
          currentInstallments={Array.isArray(proposal.custom_installments) ? (proposal.custom_installments as unknown as Installment[]) : []}
          totalValue={proposal.cash_total_value}
          onSave={handleSavePayment}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Admin Close Proposal Modal */}
      {showCloseModal && proposal && (
        <AdminCloseProposalModal
          open={showCloseModal}
          onOpenChange={setShowCloseModal}
          proposal={proposal as any}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default PropostaDetalhesPage;
