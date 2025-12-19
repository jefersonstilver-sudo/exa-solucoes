import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Clock, User, Building2, Send, Eye, 
  MessageSquare, Mail, Smartphone, Monitor, Copy, Download, 
  RefreshCw, Gift, Timer, Check, X, MoreVertical, Phone, ExternalLink,
  CreditCard, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProposalPDFExporter } from '@/components/admin/proposals/ProposalPDFExporter';
import { motion } from 'framer-motion';
import { EditPaymentDialog } from '@/components/admin/proposals/EditPaymentDialog';
import { CCEmailsCard } from '@/components/admin/proposals/CCEmailsCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
        .select('nome, telefone')
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
        .select('*')
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

  const formatTimeShort = (seconds: number | null) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
      pendente: { label: 'Pendente', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      visualizada: { label: 'Visualizada', className: 'bg-purple-100 text-purple-700 border-purple-200' },
      aceita: { label: 'Aceita', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      paga: { label: 'Paga', className: 'bg-green-100 text-green-700 border-green-200' },
      convertida: { label: 'Pedido Criado', className: 'bg-green-600 text-white border-green-600' },
      recusada: { label: 'Recusada', className: 'bg-red-100 text-red-700 border-red-200' },
      expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500 border-gray-200' },
      atualizada: { label: 'Aguardando Re-aceite', className: 'bg-amber-100 text-amber-700 border-amber-200' },
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
      proposta_prorrogada: { icon: <Timer className="h-3 w-3" />, color: 'bg-amber-500' },
      condicao_especial_enviada: { icon: <Gift className="h-3 w-3" />, color: 'bg-pink-500' },
      proposta_atualizada: { icon: <RefreshCw className="h-3 w-3" />, color: 'bg-orange-500' },
      pagamento_alterado: { icon: <CreditCard className="h-3 w-3" />, color: 'bg-indigo-500' },
    };
    return icons[action] || { icon: <Clock className="h-3 w-3" />, color: 'bg-gray-400' };
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
      
      // Update proposal with new payment and mark for re-acceptance
      const updateData: any = {
        payment_type: paymentType,
        custom_installments: paymentType === 'custom' ? installments : null,
        needs_reacceptance: true,
        last_modified_at: new Date().toISOString(),
        modified_by: user?.id,
        status: 'atualizada' // Mark as needing re-acceptance
      };

      await supabase
        .from('proposals')
        .update(updateData)
        .eq('id', id);

      // Log the change
      await supabase.from('proposal_logs').insert({
        proposal_id: id,
        action: 'pagamento_alterado',
        details: { 
          payment_type: paymentType,
          installments_count: installments.length,
          modified_by: user?.id
        }
      });
      
      toast.success('Condição de pagamento atualizada! O cliente precisará aceitar novamente.');
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
      toast.error('Erro ao reenviar');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pb-28">
      {/* Premium Sticky Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-gray-100/50 shadow-sm"
      >
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(buildPath('propostas'))}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">{proposal.number}</h1>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{proposal.client_name}</p>
            </div>
          </div>
          
          {/* Large Status Badge */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Badge className={`${statusConfig.className} text-xs px-2.5 py-1 border font-medium`}>
              {statusConfig.label}
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      <div className="p-3 space-y-3">
        {/* Re-acceptance Warning Banner */}
        {proposal.needs_reacceptance && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Card className="p-3 bg-amber-50 border-amber-200 shadow-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Proposta atualizada</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Esta proposta foi modificada e aguarda novo aceite do cliente.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-300 hover:bg-amber-100"
                      onClick={() => handleResend('whatsapp')}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reenviar WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-300 hover:bg-amber-100"
                      onClick={() => handleResend('email')}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Reenviar E-mail
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Hero Value Card - Apple Style */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-white to-gray-50/80">
            <div className="p-5">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Valor à Vista</p>
                <motion.p 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold text-[#9C1E1E] mt-1 tracking-tight"
                >
                  {formatCurrency(proposal.cash_total_value)}
                </motion.p>
                {proposal.discount_percent > 0 && (
                  <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0 text-[10px] font-medium">
                    {proposal.discount_percent}% OFF
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100">
                <div className="text-center">
                  {proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments) && proposal.custom_installments.length > 0 ? (
                    <>
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 border-0 mb-1">
                        Personalizado
                      </Badge>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        {proposal.custom_installments.length} parcelas
                      </p>
                      <p className="text-lg font-bold mt-0.5">
                        {formatCurrency((proposal.custom_installments as { amount: number }[]).reduce((sum, inst) => sum + (inst.amount || 0), 0))}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fidelidade/mês</p>
                      <p className="text-lg font-bold mt-0.5">{formatCurrency(proposal.fidel_monthly_value)}</p>
                    </>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Período</p>
                  <p className="text-lg font-bold mt-0.5">{proposal.duration_months} meses</p>
                </div>
              </div>

              {/* Edit Payment Button */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs"
                  onClick={() => setShowEditPaymentDialog(true)}
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Editar Condição de Pagamento
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detalhamento de Parcelas Personalizadas */}
        {proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments) && proposal.custom_installments.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-4 bg-amber-50/80 backdrop-blur-sm border-amber-200/50 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{proposal.custom_installments.length}x</span>
                </div>
                <h3 className="font-semibold text-sm text-amber-800">Detalhamento das Parcelas</h3>
              </div>
              
              <div className="space-y-2">
                {(proposal.custom_installments as { due_date: string; amount: number }[]).map((inst, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-amber-200/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 w-6">{idx + 1}ª</span>
                      <span className="text-xs text-amber-600">
                        {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-800">
                      {formatCurrency(inst.amount)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-2 border-t border-amber-300/50 flex justify-between">
                <span className="text-xs font-medium text-amber-700">Total</span>
                <span className="text-sm font-bold text-amber-900">
                  {formatCurrency((proposal.custom_installments as { amount: number }[]).reduce((sum, inst) => sum + (inst.amount || 0), 0))}
                </span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Apple Activity Style Metrics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-6 py-2"
        >
          <div className="text-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-1.5 shadow-sm mx-auto"
            >
              <Eye className="h-7 w-7 text-purple-600" />
            </motion.div>
            <p className="text-2xl font-bold text-purple-600">{proposal.view_count || 0}</p>
            <p className="text-[10px] text-muted-foreground">visualizações</p>
          </div>
          
          <div className="text-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-1.5 shadow-sm mx-auto"
            >
              <Clock className="h-7 w-7 text-blue-600" />
            </motion.div>
            <p className="text-2xl font-bold text-blue-600">{formatTimeShort(proposal.total_time_spent_seconds)}</p>
            <p className="text-[10px] text-muted-foreground">tempo total</p>
          </div>

          <div className="text-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-1.5 shadow-sm mx-auto"
            >
              <Building2 className="h-7 w-7 text-amber-600" />
            </motion.div>
            <p className="text-2xl font-bold text-amber-600">{proposal.total_panels}</p>
            <p className="text-[10px] text-muted-foreground">painéis</p>
          </div>
        </motion.div>

        {/* Device badges */}
        {views.length > 0 && (
          <div className="flex justify-center gap-2">
            {views.some(v => v.device_type === 'mobile') && (
              <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 bg-white/80">
                <Smartphone className="h-2.5 w-2.5" /> Mobile
              </Badge>
            )}
            {views.some(v => v.device_type === 'desktop') && (
              <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 bg-white/80">
                <Monitor className="h-2.5 w-2.5" /> Desktop
              </Badge>
            )}
          </div>
        )}

        {/* CC Emails Card */}
        <CCEmailsCard 
          ccEmails={proposal.cc_emails || []}
          onSave={handleSaveCCEmails}
        />

        {/* Client Card - Elegant */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50 shadow-md">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {proposal.client_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{proposal.client_name}</h3>
                {proposal.client_cnpj && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{proposal.client_cnpj}</p>
                )}
                
                {/* Contact buttons */}
                <div className="flex gap-2 mt-2">
                  {proposal.client_phone && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2 text-[10px] gap-1"
                      onClick={() => window.open(`tel:${proposal.client_phone}`, '_blank')}
                    >
                      <Phone className="h-3 w-3" />
                      Ligar
                    </Button>
                  )}
                  {proposal.client_email && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2 text-[10px] gap-1"
                      onClick={() => window.open(`mailto:${proposal.client_email}`, '_blank')}
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Buildings - Horizontal Scroll */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#9C1E1E]" />
                <h3 className="font-semibold text-sm">Prédios</h3>
              </div>
              <Badge variant="outline" className="text-[10px]">{selectedBuildings.length}</Badge>
            </div>
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="inline-flex gap-2 min-w-max pb-1">
                {selectedBuildings.map((building: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 min-w-[140px]"
                  >
                    <p className="text-xs font-medium truncate">{building.building_name || building.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{building.quantidade_telas || 1} tela(s)</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Timeline / History - Elegant */}
        {logs.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#9C1E1E]" />
                <h3 className="font-semibold text-sm">Histórico</h3>
              </div>
              <div className="relative pl-5">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200 rounded-full" />
                
                <div className="space-y-3">
                  {logs.slice().reverse().slice(0, 5).map((log, index) => {
                    const logIcon = getLogIcon(log.action);
                    return (
                      <div key={log.id} className="relative flex items-start gap-3">
                        {/* Icon bubble */}
                        <div className={`absolute -left-5 w-4 h-4 rounded-full ${logIcon.color} flex items-center justify-center text-white`}>
                          {logIcon.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium capitalize">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
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

        {/* View timestamps */}
        {proposal.first_viewed_at && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-sm">Visualizações</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira visita</span>
                  <span className="font-medium">{format(new Date(proposal.first_viewed_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                </div>
                {proposal.last_viewed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última visita</span>
                    <span className="font-medium">{format(new Date(proposal.last_viewed_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo total</span>
                  <span className="font-medium text-blue-600">{formatTimeSpent(proposal.total_time_spent_seconds)}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Actions - Premium */}
      <motion.div 
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      >
        <div className="bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-2xl px-4 py-3">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => handleResend('whatsapp')}
              className="flex-1 h-11 text-sm font-medium"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              WhatsApp
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleResend('email')}
              className="h-11 px-4"
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setShowBetterOfferDialog(true)}
              className="flex-1 h-11 bg-[#9C1E1E] hover:bg-[#7D1818] text-sm font-medium"
            >
              <Gift className="h-4 w-4 mr-1.5" />
              Condição Especial
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://examidia.com.br/propostacomercial/${id}`, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Página Pública
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowExtendDialog(true)}>
                  <Timer className="h-4 w-4 mr-2" />
                  Prorrogar Validade
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

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
            {[5, 10, 15, 20].map(discount => (
              <Button
                key={discount}
                variant={extraDiscount === discount ? 'default' : 'outline'}
                onClick={() => setExtraDiscount(discount)}
                className={`h-10 text-xs ${extraDiscount === discount ? 'bg-[#9C1E1E]' : ''}`}
              >
                {discount}%
              </Button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Novo valor: {formatCurrency(proposal.cash_total_value * (1 - extraDiscount / 100))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowBetterOfferDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleSendBetterOffer} 
              disabled={isSubmitting}
              className="bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <EditPaymentDialog
        open={showEditPaymentDialog}
        onOpenChange={setShowEditPaymentDialog}
        currentPaymentType={proposal.payment_type || 'cash'}
        currentInstallments={(Array.isArray(proposal.custom_installments) ? proposal.custom_installments as unknown as Installment[] : [])}
        totalValue={proposal.cash_total_value}
        onSave={handleSavePayment}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default PropostaDetalhesPage;
