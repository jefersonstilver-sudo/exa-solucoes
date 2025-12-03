import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X, MessageSquare, FileText, Building2, Eye, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

const PropostaPublicaPage = () => {
  const [searchParams] = useSearchParams();
  const proposalNumber = searchParams.get('n');
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'avista' | 'fidelidade'>('avista');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReject, setShowReject] = useState(false);

  // Mock de dados (será substituído por fetch real)
  useEffect(() => {
    setTimeout(() => {
      setProposal({
        number: proposalNumber || 'EXA-2025-0001',
        client: 'Sylvester Kammer — Kammer Construtora',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        buildings: [
          { name: 'Torres Oeste', panels: 2, impPerDay: 3100 },
          { name: 'Plaza Norte', panels: 1, impPerDay: 2600 },
          { name: 'Residencial Sol', panels: 1, impPerDay: 2100 },
          { name: 'Edifício Mar', panels: 1, impPerDay: 2300 },
          { name: 'Praça Central', panels: 1, impPerDay: 2800 },
        ],
        fidelMonthly: 1400,
        cashTotal: 7500,
        discountPercent: 10,
        seller: {
          name: 'Equipe Comercial EXA',
          phone: '(45) 99999-0000',
          email: 'comercial@examidia.com.br'
        }
      });
      setIsLoading(false);
    }, 1000);
  }, [proposalNumber, token]);

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

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Aceita!</h1>
          <p className="text-muted-foreground mb-6">
            Obrigado por escolher a EXA Mídia. Nossa equipe entrará em contato em breve para finalizar.
          </p>
          <Button
            className="w-full h-12 bg-[#25D366] hover:bg-[#20BD5A] text-white"
            onClick={() => window.open(`https://wa.me/55${proposal.seller.phone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com meu agente
          </Button>
        </Card>
      </div>
    );
  }

  if (showReject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Proposta Recusada</h1>
          <p className="text-muted-foreground mb-6">
            Entendemos. Se mudar de ideia ou quiser discutir condições, estamos à disposição.
          </p>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => window.open(`https://wa.me/55${proposal.seller.phone.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Falar com a equipe
          </Button>
        </Card>
      </div>
    );
  }

  const totalPanels = proposal.buildings.reduce((sum: number, b: any) => sum + b.panels, 0);
  const totalImpressions = proposal.buildings.reduce((sum: number, b: any) => sum + (b.impPerDay * b.panels * 30), 0);
  const fidelTotal = proposal.fidelMonthly * 6;

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
                  {proposal.createdAt.toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          <div className="text-sm opacity-90">
            Cliente: <strong>{proposal.client}</strong>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Aviso de Validade */}
        <Card className="p-3 bg-amber-50 border-amber-200 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800">
            Esta proposta é válida por <strong>24 horas</strong> — expira em {proposal.expiresAt.toLocaleString('pt-BR')}
          </span>
        </Card>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center bg-white/80 backdrop-blur-sm">
            <div className="text-2xl font-bold text-[#9C1E1E]">{proposal.buildings.length}</div>
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
            <div className="text-2xl font-bold text-[#9C1E1E]">6</div>
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
            {proposal.buildings.map((building: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{building.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {building.panels} tela(s) • {building.impPerDay.toLocaleString()} imp/dia
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{(building.impPerDay * building.panels * 30).toLocaleString()}</div>
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
                    {proposal.discountPercent}% OFF
                  </span>
                  <span className="font-bold">À Vista — Oferta Especial</span>
                </div>
                <p className="text-xs text-muted-foreground">Pagamento único — desconto aplicado</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#9C1E1E]">
                  {proposal.cashTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-xs text-muted-foreground">
                  = {(proposal.cashTotal / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
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
                <div className="font-bold mb-1">Plano Fidelidade — 6 meses</div>
                <p className="text-xs text-muted-foreground">Pagamento mensal — fidelize e garanta slots</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {proposal.fidelMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
            onClick={() => {
              toast.success('Proposta aceita com sucesso!');
              setShowSuccess(true);
            }}
          >
            <Check className="h-5 w-5 mr-2" />
            Aceitar Proposta ({selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade'})
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                setShowReject(true);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={() => window.open(`https://wa.me/55${proposal.seller.phone.replace(/\D/g, '')}`, '_blank')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Falar com Agente
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full h-10 text-sm"
            onClick={() => toast.info('PDF será baixado')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Baixar Proposta em PDF
          </Button>
        </div>

        {/* Contato */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <h3 className="font-semibold mb-2">Contato Comercial</h3>
          <div className="text-sm space-y-1">
            <div>{proposal.seller.name}</div>
            <div className="text-muted-foreground">{proposal.seller.email}</div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {proposal.seller.phone}
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
