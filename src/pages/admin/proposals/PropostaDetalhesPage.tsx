import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, User, Building2, Send, Eye, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

const PropostaDetalhesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();

  // Mock de dados (será substituído por dados reais)
  const proposal = {
    id,
    number: 'EXA-2025-0001',
    status: 'enviada',
    client: {
      name: 'João Silva - Empresa XYZ',
      cnpj: '00.000.000/0000-00',
      phone: '(45) 99999-0000',
      email: 'joao@empresa.com'
    },
    buildings: [
      { name: 'Torres Oeste', panels: 2 },
      { name: 'Plaza Norte', panels: 1 },
    ],
    values: {
      fidelMonthly: 1400,
      cashTotal: 7500,
      discountPercent: 10
    },
    createdAt: new Date(),
    sentAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
      enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
      visualizada: { label: 'Visualizada', className: 'bg-purple-100 text-purple-700' },
      aceita: { label: 'Aceita', className: 'bg-emerald-100 text-emerald-700' },
      recusada: { label: 'Recusada', className: 'bg-red-100 text-red-700' },
      expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500' },
    };
    const config = statusConfig[status] || statusConfig.rascunho;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

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
            <p className="text-xs text-muted-foreground">{proposal.client.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cliente */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Cliente</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{proposal.client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CNPJ:</span>
              <span>{proposal.client.cnpj}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone:</span>
              <span>{proposal.client.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mail:</span>
              <span>{proposal.client.email}</span>
            </div>
          </div>
        </Card>

        {/* Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Prédios Selecionados</h3>
          </div>
          <div className="space-y-2">
            {proposal.buildings.map((building, index) => (
              <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span>{building.name}</span>
                <span className="text-muted-foreground">{building.panels} tela(s)</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Valores */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Valores</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-100">
              <div className="text-xs text-muted-foreground">À Vista ({proposal.values.discountPercent}% OFF)</div>
              <div className="text-lg font-bold text-[#9C1E1E]">
                {proposal.values.cashTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-muted-foreground">Fidelidade/mês</div>
              <div className="text-lg font-bold">
                {proposal.values.fidelMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Histórico</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
              <div>
                <div className="text-sm font-medium">Proposta criada</div>
                <div className="text-xs text-muted-foreground">
                  {proposal.createdAt.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
            {proposal.sentAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <div className="text-sm font-medium">Proposta enviada</div>
                  <div className="text-xs text-muted-foreground">
                    {proposal.sentAt.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12">
            <Send className="h-4 w-4 mr-2" />
            Reenviar
          </Button>
          <Button className="h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white">
            <Eye className="h-4 w-4 mr-2" />
            Ver Página
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PropostaDetalhesPage;
