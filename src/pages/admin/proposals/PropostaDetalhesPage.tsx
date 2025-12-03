import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Clock, User, Building2, Send, Eye, Check, X, 
  MessageSquare, Mail, ExternalLink, Gift, Timer, Smartphone, Monitor,
  Copy, Download, RefreshCw
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

  // Estados dos dialogs
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showBetterOfferDialog, setShowBetterOfferDialog] = useState(false);
  const [extensionHours, setExtensionHours] = useState(24);
  const [extraDiscount, setExtraDiscount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar proposta
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

  // Buscar logs
  const { data: logs = [] } = useQuery({
    queryKey: ['proposal-logs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_logs')
        .select('*')
        .eq('proposal_id', id)
        .order('created_at', { ascending: true });
      return (data || []) as ProposalLog[];
    },
    enabled: !!id
  });

  // Buscar visualizações
  const { data: views = [] } = useQuery({
    queryKey: ['proposal-views', id],
    queryFn: async () => {
      const { data, error } = await supabase
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
      recusada: { label: 'Recusada', className: 'bg-red-100 text-red-700' },
      expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500' },
    };
    const config = statusConfig[status] || statusConfig.pendente;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Prorrogar proposta
  const handleExtendProposal = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    
    try {
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + extensionHours);
      
      const { error } = await supabase
        .from('proposals')
        .update({ 
          expires_at: newExpiry.toISOString(),
          status: proposal.status === 'expirada' ? 'enviada' : proposal.status
        })
        .eq('id', id);
      
      if (error) throw error;

      // Registrar no log
      await supabase.from('proposal_logs').insert({
        proposal_id: id,
        action: 'proposta_prorrogada',
        details: { new_expires_at: newExpiry.toISOString(), extension_hours: extensionHours }
      });
      
      toast.success('Proposta prorrogada com sucesso!');
      setShowExtendDialog(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['proposal-logs', id] });
    } catch (error) {
      console.error('Erro ao prorrogar:', error);
      toast.error('Erro ao prorrogar proposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar condição melhor
  const handleSendBetterOffer = async () => {
    if (!proposal) return;
    setIsSubmitting(true);
    
    try {
      const newCashValue = proposal.cash_total_value * (1 - extraDiscount / 100);
      const newFidelValue = proposal.fidel_monthly_value * (1 - extraDiscount / 100);
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('proposals')
        .update({
          cash_total_value: newCashValue,
          fidel_monthly_value: newFidelValue,
          discount_percent: (proposal.discount_percent || 0) + extraDiscount,
          expires_at: newExpiry.toISOString(),
          status: 'enviada'
        })
        .eq('id', id);
      
      if (error) throw error;

      // Registrar no log
      await supabase.from('proposal_logs').insert({
        proposal_id: id,
        action: 'condicao_especial_enviada',
        details: { 
          extra_discount: extraDiscount,
          old_cash_value: proposal.cash_total_value,
          new_cash_value: newCashValue,
          old_fidel_value: proposal.fidel_monthly_value,
          new_fidel_value: newFidelValue
        }
      });
      
      // Reenviar via WhatsApp
      if (proposal.client_phone) {
        await supabase.functions.invoke('send-proposal-whatsapp', {
          body: { proposalId: id, isBetterOffer: true }
        });
      }
      
      toast.success('Condição especial enviada!');
      setShowBetterOfferDialog(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['proposal-logs', id] });
    } catch (error) {
      console.error('Erro ao enviar condição:', error);
      toast.error('Erro ao enviar condição especial');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reenviar proposta
  const handleResend = async (via: 'whatsapp' | 'email') => {
    if (!proposal) return;
    
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

  const handleCopyLink = () => {
    const link = `https://examidia.com.br/propostacomercial/${id}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Proposta não encontrada</h3>
          <Button variant="outline" className="mt-4" onClick={() => navigate(buildPath('propostas'))}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const selectedBuildings = proposal.selected_buildings as any[] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(buildPath('propostas'))}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{proposal.number}</h1>
              {getStatusBadge(proposal.status)}
            </div>
            <p className="text-xs text-muted-foreground">{proposal.client_name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Engajamento do Cliente */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm">Engajamento do Cliente</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-muted-foreground">Visualizações</div>
              <div className="text-lg font-bold text-purple-600">{proposal.view_count || 0}x</div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-muted-foreground">Tempo Total</div>
              <div className="text-lg font-bold text-blue-600">
                {formatTimeSpent(proposal.total_time_spent_seconds)}
              </div>
            </div>
          </div>
          
          {proposal.first_viewed_at && (
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primeira visita:</span>
                <span>{format(new Date(proposal.first_viewed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              {proposal.last_viewed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última visita:</span>
                  <span>{format(new Date(proposal.last_viewed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                </div>
              )}
            </div>
          )}
          
          {views.length > 0 && (
            <div className="mt-3 flex gap-2">
              {views.some(v => v.device_type === 'mobile') && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Smartphone className="h-3 w-3" /> Mobile
                </Badge>
              )}
              {views.some(v => v.device_type === 'desktop') && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Monitor className="h-3 w-3" /> Desktop
                </Badge>
              )}
            </div>
          )}

          {!proposal.view_count && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Aguardando primeira visualização...
            </div>
          )}
        </Card>

        {/* Cliente */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Cliente</h3>
          </div>
          <div className="space-y-2 text-sm">
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
                <span className="truncate ml-2">{proposal.client_email}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Prédios Selecionados ({selectedBuildings.length})</h3>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedBuildings.map((building: any, index: number) => (
              <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="truncate">{building.building_name || building.nome || 'Prédio'}</span>
                <span className="text-muted-foreground whitespace-nowrap ml-2">
                  {building.quantidade_telas || building.panels || 1} tela(s)
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex justify-between">
            <span>Total de painéis:</span>
            <span className="font-medium text-foreground">{proposal.total_panels}</span>
          </div>
        </Card>

        {/* Valores */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Valores</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-50 to-white rounded-lg border border-emerald-100">
              <div className="text-xs text-muted-foreground">À Vista (10% OFF)</div>
              <div className="text-lg font-bold text-emerald-600">
                {formatCurrency(proposal.cash_total_value)}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">Fidelidade/mês</div>
              <div className="text-lg font-bold">
                {formatCurrency(proposal.fidel_monthly_value)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex justify-between">
            <span>Período:</span>
            <span className="font-medium text-foreground">{proposal.duration_months} meses</span>
          </div>
          {proposal.discount_percent > 0 && (
            <div className="mt-1 text-xs text-muted-foreground flex justify-between">
              <span>Desconto aplicado:</span>
              <span className="font-medium text-emerald-600">{proposal.discount_percent}% OFF</span>
            </div>
          )}
        </Card>

        {/* Timeline/Histórico */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Histórico</h3>
          </div>
          <div className="space-y-3">
            {/* Criação */}
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
              <div>
                <div className="text-sm font-medium">Proposta criada</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(proposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
            
            {/* Envio */}
            {proposal.sent_at && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <div className="text-sm font-medium">Proposta enviada</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(proposal.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            )}

            {/* Logs adicionais */}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  log.action.includes('aceita') ? 'bg-emerald-500' :
                  log.action.includes('recusada') ? 'bg-red-500' :
                  log.action.includes('prorrogada') ? 'bg-amber-500' :
                  log.action.includes('condicao') ? 'bg-purple-500' :
                  'bg-gray-400'
                }`} />
                <div>
                  <div className="text-sm font-medium">
                    {log.action === 'proposta_prorrogada' && 'Proposta prorrogada'}
                    {log.action === 'condicao_especial_enviada' && 'Condição especial enviada'}
                    {log.action === 'proposta_aceita' && 'Proposta aceita'}
                    {log.action === 'proposta_recusada' && 'Proposta recusada'}
                    {!['proposta_prorrogada', 'condicao_especial_enviada', 'proposta_aceita', 'proposta_recusada'].includes(log.action) && log.action}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {log.details?.extra_discount && (
                    <div className="text-xs text-purple-600 mt-0.5">
                      Desconto adicional: {log.details.extra_discount}%
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Validade */}
            {proposal.expires_at && (
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  new Date(proposal.expires_at) > new Date() ? 'bg-amber-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="text-sm font-medium">
                    {new Date(proposal.expires_at) > new Date() ? 'Expira em' : 'Expirou em'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(proposal.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {new Date(proposal.expires_at) > new Date() && (
                      <span className="text-amber-600 ml-1">
                        ({formatDistanceToNow(new Date(proposal.expires_at), { locale: ptBR })})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Ações Principais */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => setShowExtendDialog(true)}
          >
            <Timer className="h-4 w-4 mr-2" />
            Prorrogar
          </Button>
          
          <Button 
            className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowBetterOfferDialog(true)}
          >
            <Gift className="h-4 w-4 mr-2" />
            Condição Especial
          </Button>
        </div>

        {/* Ações de Reenvio */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => handleResend('whatsapp')}
            disabled={!proposal.client_phone}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          
          <Button 
            variant="outline" 
            className="h-12"
            onClick={() => handleResend('email')}
            disabled={!proposal.client_email}
          >
            <Mail className="h-4 w-4 mr-2" />
            E-mail
          </Button>
        </div>

        {/* Outras ações */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-12"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Link
          </Button>
          
          <Button 
            variant="outline"
            className="h-12"
            onClick={async () => {
              try {
                const exporter = new ProposalPDFExporter();
                await exporter.generateProposalPDF(proposal as any, 'Equipe EXA');
                toast.success('PDF gerado!');
              } catch (err) {
                toast.error('Erro ao gerar PDF');
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>

        {/* Ver Página */}
        <Button 
          className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
          onClick={() => window.open(`https://examidia.com.br/propostacomercial/${id}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver Página Pública
        </Button>
      </div>

      {/* Dialog Prorrogar */}
      <Dialog open={showExtendDialog} onOpenChange={setShowExtendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prorrogar Validade</DialogTitle>
            <DialogDescription>
              Selecione por quanto tempo prorrogar a proposta
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { hours: 24, label: '24h' },
              { hours: 48, label: '48h' },
              { hours: 72, label: '72h' },
              { hours: 168, label: '7 dias' },
            ].map((option) => (
              <Button
                key={option.hours}
                variant={extensionHours === option.hours ? 'default' : 'outline'}
                onClick={() => setExtensionHours(option.hours)}
                className={extensionHours === option.hours ? 'bg-[#9C1E1E] hover:bg-[#7D1818]' : ''}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleExtendProposal}
              disabled={isSubmitting}
              className="bg-[#9C1E1E] hover:bg-[#7D1818]"
            >
              {isSubmitting ? 'Prorrogando...' : 'Prorrogar Proposta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Condição Especial */}
      <Dialog open={showBetterOfferDialog} onOpenChange={setShowBetterOfferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Condição Especial</DialogTitle>
            <DialogDescription>
              Ofereça um desconto adicional para fechar o negócio
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Desconto Adicional</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <Button
                    key={pct}
                    variant={extraDiscount === pct ? 'default' : 'outline'}
                    onClick={() => setExtraDiscount(pct)}
                    className={extraDiscount === pct ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="text-sm text-muted-foreground">Novo valor à vista:</div>
              <div className="text-lg font-bold text-emerald-600">
                {formatCurrency(proposal.cash_total_value * (1 - extraDiscount / 100))}
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                Economia de {formatCurrency(proposal.cash_total_value * extraDiscount / 100)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Novo valor fidelidade:</div>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(proposal.fidel_monthly_value * (1 - extraDiscount / 100))}/mês
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              A proposta será atualizada e reenviada via WhatsApp com os novos valores.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBetterOfferDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendBetterOffer}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Nova Condição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropostaDetalhesPage;
