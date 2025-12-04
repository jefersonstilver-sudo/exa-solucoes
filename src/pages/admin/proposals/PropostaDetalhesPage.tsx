import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Clock, User, Building2, Send, Eye, 
  MessageSquare, Mail, Smartphone, Monitor, Copy, Download, 
  RefreshCw, Gift, Timer, Check, X, MoreVertical
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

const PropostaDetalhesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();

  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showBetterOfferDialog, setShowBetterOfferDialog] = useState(false);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
      enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
      visualizada: { label: 'Visualizada', className: 'bg-purple-100 text-purple-700' },
      aceita: { label: 'Aceita', className: 'bg-emerald-100 text-emerald-700' },
      paga: { label: 'Paga', className: 'bg-green-100 text-green-700' },
      convertida: { label: 'Pedido Criado', className: 'bg-green-600 text-white' },
      recusada: { label: 'Recusada', className: 'bg-red-100 text-red-700' },
      expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500' },
    };
    const config = statusConfig[status] || statusConfig.pendente;
    return <Badge className={`${config.className} text-[10px] px-1.5`}>{config.label}</Badge>;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(buildPath('propostas'))}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">{proposal.number}</h1>
                {getStatusBadge(proposal.status)}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{proposal.client_name}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResend('whatsapp')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Reenviar WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResend('email')}>
                <Mail className="h-4 w-4 mr-2" />
                Reenviar Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExtendDialog(true)}>
                <Timer className="h-4 w-4 mr-2" />
                Prorrogar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBetterOfferDialog(true)}>
                <Gift className="h-4 w-4 mr-2" />
                Condição Especial
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Engajamento */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm">Engajamento</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <p className="text-[10px] text-muted-foreground">Visualizações</p>
              <p className="text-lg font-bold text-purple-600">{proposal.view_count || 0}x</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-[10px] text-muted-foreground">Tempo</p>
              <p className="text-lg font-bold text-blue-600">{formatTimeSpent(proposal.total_time_spent_seconds)}</p>
            </div>
          </div>
          {proposal.first_viewed_at && (
            <div className="mt-2 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primeira visita:</span>
                <span>{format(new Date(proposal.first_viewed_at), "dd/MM HH:mm", { locale: ptBR })}</span>
              </div>
              {proposal.last_viewed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última visita:</span>
                  <span>{format(new Date(proposal.last_viewed_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </div>
          )}
          {views.length > 0 && (
            <div className="mt-2 flex gap-1">
              {views.some(v => v.device_type === 'mobile') && (
                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                  <Smartphone className="h-2.5 w-2.5" /> Mobile
                </Badge>
              )}
              {views.some(v => v.device_type === 'desktop') && (
                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                  <Monitor className="h-2.5 w-2.5" /> Desktop
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Cliente */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Cliente</h3>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{proposal.client_name}</span>
            </div>
            {proposal.client_cnpj && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CNPJ:</span>
                <span>{proposal.client_cnpj}</span>
              </div>
            )}
            {proposal.client_phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span>{proposal.client_phone}</span>
              </div>
            )}
            {proposal.client_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="truncate ml-2 max-w-[140px]">{proposal.client_email}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Prédios */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Prédios ({selectedBuildings.length})</h3>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {selectedBuildings.map((building: any, index: number) => (
              <div key={index} className="flex justify-between text-xs p-1.5 bg-gray-50 rounded">
                <span className="truncate">{building.building_name || building.nome}</span>
                <span className="text-muted-foreground">{building.quantidade_telas || 1} tela(s)</span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 pt-1.5 border-t text-xs flex justify-between">
            <span className="text-muted-foreground">Total painéis:</span>
            <span className="font-medium">{proposal.total_panels}</span>
          </div>
        </Card>

        {/* Valores */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Valores</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-[10px] text-muted-foreground">À Vista (10% OFF)</p>
              <p className="text-base font-bold text-emerald-600">{formatCurrency(proposal.cash_total_value)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-muted-foreground">Fidelidade/mês</p>
              <p className="text-base font-bold">{formatCurrency(proposal.fidel_monthly_value)}</p>
            </div>
          </div>
          <div className="mt-2 text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">{proposal.duration_months} meses</span>
            </div>
            {proposal.discount_percent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto:</span>
                <span className="font-medium text-emerald-600">{proposal.discount_percent}% OFF</span>
              </div>
            )}
          </div>
        </Card>

        {/* Histórico */}
        {logs.length > 0 && (
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#9C1E1E]" />
              <h3 className="font-semibold text-sm">Histórico</h3>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#9C1E1E] mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-area-bottom">
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => handleResend('whatsapp')}
            className="flex-1 h-11"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button 
            onClick={() => setShowBetterOfferDialog(true)}
            className="flex-1 h-11 bg-[#9C1E1E] hover:bg-[#7D1818]"
          >
            <Gift className="h-4 w-4 mr-2" />
            Condição Especial
          </Button>
        </div>
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
          <div className="grid grid-cols-2 gap-2 py-3">
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
    </div>
  );
};

export default PropostaDetalhesPage;
