import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, MessageSquare, FileText, Building2, Eye, Clock, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
import { supabase } from '@/integrations/supabase/client';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_cnpj: string | null;
  client_phone: string | null;
  client_email: string | null;
  selected_buildings: any[];
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
  created_by: string | null;
}

const PropostaPublicaPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sellerName, setSellerName] = useState('Equipe EXA Mídia');
  const [sellerPhone, setSellerPhone] = useState('(45) 99141-5856');
  const [selectedPlan, setSelectedPlan] = useState<'avista' | 'fidelidade'>('avista');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar proposta do banco de dados
  useEffect(() => {
    const fetchProposal = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 Buscando proposta:', id);
        
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar proposta:', error);
          setIsLoading(false);
          return;
        }

        if (!data) {
          console.log('Proposta não encontrada');
          setIsLoading(false);
          return;
        }

        console.log('✅ Proposta encontrada:', data);
        setProposal(data as Proposal);

        // Verificar se expirou
        if (data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          if (expiresAt < new Date()) {
            setIsExpired(true);
            // Atualizar status para expirada se ainda não estiver
            if (data.status !== 'expirada' && data.status !== 'aceita' && data.status !== 'recusada') {
              await supabase
                .from('proposals')
                .update({ status: 'expirada' })
                .eq('id', id);
            }
          }
        }

        // Registrar visualização apenas se ainda não foi aceita/recusada
        if (!['aceita', 'recusada', 'expirada'].includes(data.status)) {
          await supabase.from('proposal_logs').insert({
            proposal_id: id,
            action: 'visualizada',
            details: { timestamp: new Date().toISOString() }
          });

          // Atualizar status para visualizada se estava como enviada
          if (data.status === 'enviada') {
            await supabase
              .from('proposals')
              .update({ status: 'visualizada' })
              .eq('id', id);
          }
        }

        // Buscar nome do vendedor
        if (data.created_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('nome, telefone')
            .eq('id', data.created_by)
            .single();
          
          if (userData?.nome) {
            setSellerName(userData.nome);
          }
          if (userData?.telefone) {
            setSellerPhone(userData.telefone);
          }
        }

      } catch (err) {
        console.error('Erro ao carregar proposta:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  // Aceitar proposta
  const handleAccept = async () => {
    if (!proposal || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Atualizar status da proposta
      const { error } = await supabase
        .from('proposals')
        .update({ 
          status: 'aceita',
          accepted_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) throw error;

      // Registrar log
      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'aceita',
        details: { 
          selected_plan: selectedPlan,
          timestamp: new Date().toISOString()
        }
      });

      toast.success('Proposta aceita com sucesso!');
      setShowSuccess(true);
    } catch (err) {
      console.error('Erro ao aceitar proposta:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recusar proposta
  const handleReject = async () => {
    if (!proposal || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Atualizar status da proposta
      const { error } = await supabase
        .from('proposals')
        .update({ 
          status: 'recusada',
          rejected_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (error) throw error;

      // Registrar log
      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'recusada',
        details: { timestamp: new Date().toISOString() }
      });

      setShowReject(true);
    } catch (err) {
      console.error('Erro ao recusar proposta:', err);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  // Proposta não encontrada
  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            O link pode estar incorreto ou a proposta foi removida.
          </p>
          <Button
            className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            onClick={() => window.open('https://wa.me/5545991415856', '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com a equipe
          </Button>
        </Card>
      </div>
    );
  }

  // Proposta expirada
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Expirada</h1>
          <p className="text-muted-foreground mb-6">
            Esta proposta expirou em {new Date(proposal.expires_at!).toLocaleString('pt-BR')}.
            Entre em contato para solicitar uma nova proposta.
          </p>
          <Button
            className="w-full h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Solicitar nova proposta
          </Button>
        </Card>
      </div>
    );
  }

  // Proposta aceita - tela de sucesso
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Aceita!</h1>
          <p className="text-muted-foreground mb-6">
            Obrigado por escolher a EXA Mídia! Nossa equipe entrará em contato em breve para finalizar os detalhes.
          </p>
          <Button
            className="w-full h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com {sellerName.split(' ')[0]}
          </Button>
        </Card>
      </div>
    );
  }

  // Proposta recusada
  if (showReject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Recusada</h1>
          <p className="text-muted-foreground mb-6">
            Entendemos. Se mudar de ideia ou quiser discutir condições diferenciadas, estamos à disposição.
          </p>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com a equipe
          </Button>
        </Card>
      </div>
    );
  }

  // Cálculos
  const buildings = proposal.selected_buildings || [];
  const totalPanels = proposal.total_panels || buildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 0), 0);
  const totalImpressions = proposal.total_impressions_month || buildings.reduce((sum: number, b: any) => sum + (b.visualizacoes_mes || 0), 0);
  const fidelTotal = proposal.fidel_monthly_value * proposal.duration_months;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#4a0f0f] to-[#7D1818] text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <UnifiedLogo 
                size="custom" 
                variant="light"
                className="w-12 h-12"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold">Proposta Comercial • EXA Mídia</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
                  {proposal.number}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                  {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm opacity-90">
            Cliente: <strong>{proposal.client_name}</strong>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Aviso de Validade */}
        {proposal.expires_at && (
          <Card className="p-3 bg-amber-50 border-amber-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-800">
              Esta proposta é válida até <strong>{new Date(proposal.expires_at).toLocaleString('pt-BR')}</strong>
            </span>
          </Card>
        )}

        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{buildings.length}</div>
            <div className="text-xs text-muted-foreground">Prédios</div>
          </Card>
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{totalPanels}</div>
            <div className="text-xs text-muted-foreground">Telas</div>
          </Card>
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{(totalImpressions / 1000).toFixed(0)}k</div>
            <div className="text-xs text-muted-foreground">Exibições/mês</div>
          </Card>
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{proposal.duration_months}</div>
            <div className="text-xs text-muted-foreground">Meses</div>
          </Card>
        </div>

        {/* Lista de Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[#9C1E1E]" />
            <h2 className="font-semibold">Prédios Incluídos</h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {buildings.map((building: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{building.building_name || building.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {building.bairro} • {building.quantidade_telas || 1} tela(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{((building.visualizacoes_mes || 0)).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">imp/mês</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Planos */}
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#9C1E1E]" />
            Escolha sua condição
          </h2>

          {/* Plano À Vista */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedPlan === 'avista' 
                ? 'border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg' 
                : 'border hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan('avista')}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#9C1E1E] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {proposal.discount_percent}% OFF
                  </span>
                  <span className="font-bold">À Vista — Oferta Especial</span>
                </div>
                <p className="text-xs text-muted-foreground">Pagamento único — desconto aplicado</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#9C1E1E]">
                  {proposal.cash_total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  = {(proposal.cash_total_value / proposal.duration_months).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
                </div>
              </div>
            </div>
          </Card>

          {/* Plano Fidelidade */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedPlan === 'fidelidade' 
                ? 'border-2 border-[#9C1E1E] bg-gradient-to-br from-red-50 to-white shadow-lg' 
                : 'border hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan('fidelidade')}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold mb-1">Plano Fidelidade — {proposal.duration_months} meses</div>
                <p className="text-xs text-muted-foreground">Pagamento mensal — fidelize e garanta slots</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {proposal.fidel_monthly_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {fidelTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3 pt-4">
          <Button
            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleAccept}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            Aceitar Proposta ({selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade'})
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => window.open(`https://wa.me/55${sellerPhone.replace(/\D/g, '')}`, '_blank')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Falar com Agente
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full h-10 text-sm"
            onClick={() => toast.info('PDF em desenvolvimento')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Baixar Proposta em PDF
          </Button>
        </div>

        {/* Contato */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Contato Comercial</h3>
          <div className="text-sm space-y-1">
            <div>{sellerName}</div>
            <div className="text-muted-foreground">{proposal.client_email || 'comercial@indexamidia.com.br'}</div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {sellerPhone}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          Proposta gerada automaticamente pelo sistema EXA Mídia
        </div>
      </div>
    </div>
  );
};

export default PropostaPublicaPage;