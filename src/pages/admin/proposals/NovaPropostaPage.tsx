import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Building2, DollarSign, Eye, Send, MessageSquare, Mail, Link2, FileText, CheckCircle, Users, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface Building {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  quantidade_telas: number | null;
  visualizacoes_mes: number | null;
  preco_base: number | null;
  publico_estimado: number | null;
  imagem_principal: string | null;
}

const NovaPropostaPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();

  // Estado do formulário
  const [clientData, setClientData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: ''
  });

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [durationMonths, setDurationMonths] = useState(6); // Período: 1, 3, 6 ou 12 meses
  const [fidelValue, setFidelValue] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [overwriteCashValue, setOverwriteCashValue] = useState(false);
  const [cashValue, setCashValue] = useState('');
  
  // Validade da proposta
  const [validityHours, setValidityHours] = useState(24);
  
  // Dialog de envio
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);

  // Opções de período
  const periodOptions = [
    { value: 1, label: '1 mês', discount: 0 },
    { value: 3, label: '3 meses', discount: 20 },
    { value: 6, label: '6 meses', discount: 30 },
    { value: 12, label: '12 meses', discount: 37.5 },
  ];

  // Opções de validade da proposta
  const validityOptions = [
    { value: 24, label: '24 horas', icon: '⚡' },
    { value: 72, label: '72 horas', icon: '🕐' },
    { value: 168, label: '7 dias', icon: '📅' },
  ];

  // Buscar prédios ativos do banco de dados
  const { data: buildings = [], isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings-active-for-proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, bairro, endereco, quantidade_telas, visualizacoes_mes, preco_base, publico_estimado, imagem_principal')
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      return data as Building[];
    }
  });

  // Toggle individual building
  const toggleBuilding = (id: string) => {
    setSelectedBuildings(prev => 
      prev.includes(id) 
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };

  // Selecionar todos
  const selectAll = () => {
    setSelectedBuildings(buildings.map(b => b.id));
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedBuildings([]);
  };

  // Cálculos baseados nos prédios selecionados
  const selectedBuildingsData = useMemo(() => {
    return buildings.filter(b => selectedBuildings.includes(b.id));
  }, [buildings, selectedBuildings]);

  const totalPanels = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.quantidade_telas || 0), 0);
  }, [selectedBuildingsData]);

  const totalImpressions = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.visualizacoes_mes || 0), 0);
  }, [selectedBuildingsData]);

  const totalPublico = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.publico_estimado || 0), 0);
  }, [selectedBuildingsData]);

  // Valor sugerido baseado nos prédios selecionados
  const valorSugeridoMensal = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => {
      const precoBase = b.preco_base || 0;
      const telas = b.quantidade_telas || 1;
      return sum + (precoBase * telas);
    }, 0);
  }, [selectedBuildingsData]);

  // Cálculos de valores
  const fidelMonthly = parseFloat(fidelValue) || 0;
  const fidelTotal = fidelMonthly * durationMonths;
  const cashTotal = overwriteCashValue 
    ? parseFloat(cashValue) || 0 
    : fidelTotal * (1 - discountPercent / 100);

  // Mutation para salvar proposta
  const createProposalMutation = useMutation({
    mutationFn: async (sendOptions: { whatsapp: boolean; email: boolean }) => {
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      // Preparar dados dos prédios selecionados
      const buildingsData = selectedBuildingsData.map(b => ({
        building_id: b.id,
        building_name: b.nome,
        bairro: b.bairro,
        endereco: b.endereco,
        quantidade_telas: b.quantidade_telas,
        visualizacoes_mes: b.visualizacoes_mes,
        preco_base: b.preco_base,
        publico_estimado: b.publico_estimado
      }));

      // Gerar número da proposta (formato: EXA-2025-XXXX)
      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const proposalNumber = `EXA-${year}-${randomNum}`;

      // Inserir proposta
      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert([{
          number: proposalNumber,
          client_name: clientData.name,
          client_cnpj: clientData.cnpj || null,
          client_phone: clientData.phone || null,
          client_email: clientData.email || null,
          selected_buildings: buildingsData as Json,
          total_panels: totalPanels,
          total_impressions_month: totalImpressions,
          fidel_monthly_value: fidelMonthly,
          cash_total_value: cashTotal,
          discount_percent: discountPercent,
          duration_months: durationMonths,
          status: 'enviada',
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + validityHours * 60 * 60 * 1000).toISOString(),
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Registrar log de criação
      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'criada',
        details: { 
          send_whatsapp: sendOptions.whatsapp, 
          send_email: sendOptions.email,
          buildings_count: selectedBuildings.length
        }
      });

      // Enviar via WhatsApp se selecionado
      if (sendOptions.whatsapp && clientData.phone) {
        try {
          const { error: whatsappError } = await supabase.functions.invoke('send-proposal-whatsapp', { 
            body: { proposalId: proposal.id } 
          });
          if (whatsappError) {
            console.error('Erro ao enviar WhatsApp:', whatsappError);
            toast.error('Proposta criada, mas erro ao enviar WhatsApp');
          } else {
            toast.success('WhatsApp enviado!');
          }
        } catch (err) {
          console.error('Erro ao enviar WhatsApp:', err);
        }
      }

      // Enviar via Email se selecionado
      if (sendOptions.email && clientData.email) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-proposal-email', { 
            body: { proposalId: proposal.id } 
          });
          if (emailError) {
            console.error('Erro ao enviar Email:', emailError);
            toast.error('Proposta criada, mas erro ao enviar E-mail');
          } else {
            toast.success('E-mail enviado!');
          }
        } catch (err) {
          console.error('Erro ao enviar Email:', err);
        }
      }

      return proposal;
    },
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success(`Proposta ${proposal.number} criada e enviada!`);
      setSendDialogOpen(false);
      navigate(buildPath('propostas'));
    },
    onError: (error) => {
      console.error('Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta. Tente novamente.');
    }
  });

  const handleOpenSendDialog = () => {
    // Validações
    if (!clientData.name.trim()) {
      toast.error('Preencha o nome do cliente');
      return;
    }
    if (selectedBuildings.length === 0) {
      toast.error('Selecione ao menos um prédio');
      return;
    }
    if (!fidelValue || parseFloat(fidelValue) <= 0) {
      toast.error('Preencha o valor mensal fidelidade');
      return;
    }
    if (!clientData.phone && !clientData.email) {
      toast.error('Preencha ao menos um contato (WhatsApp ou E-mail)');
      return;
    }

    // Pré-selecionar opções baseado nos dados do cliente
    setSendViaWhatsApp(!!clientData.phone);
    setSendViaEmail(!!clientData.email);
    setSendDialogOpen(true);
  };

  const handleSendProposal = () => {
    if (!sendViaWhatsApp && !sendViaEmail) {
      toast.error('Selecione ao menos uma forma de envio');
      return;
    }
    createProposalMutation.mutate({ whatsapp: sendViaWhatsApp, email: sendViaEmail });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
            <h1 className="text-lg font-bold text-foreground">Nova Proposta</h1>
            <p className="text-xs text-muted-foreground">Preencha os dados do cliente</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Seção 1: Dados do Cliente */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Dados do Cliente</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Cliente *</Label>
              <Input
                placeholder="Ex: João Silva - Empresa XYZ"
                value={clientData.name}
                onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">CNPJ</Label>
              <Input
                placeholder="00.000.000/0000-00"
                value={clientData.cnpj}
                onChange={(e) => setClientData(prev => ({ ...prev, cnpj: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">Telefone WhatsApp</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={clientData.phone}
                onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={clientData.email}
                onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
          </div>
        </Card>

        {/* Seção 2: Seleção de Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Prédios</h2>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
              {selectedBuildings.length} selecionados • {totalPanels} telas
            </span>
          </div>

          {/* Botões Selecionar Todos / Limpar */}
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={isLoadingBuildings || selectedBuildings.length === buildings.length}
              className="text-xs h-8"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Selecionar Todos ({buildings.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedBuildings.length === 0}
              className="text-xs h-8"
            >
              Limpar Seleção
            </Button>
          </div>

          {/* Lista de Prédios */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {isLoadingBuildings ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-gray-100">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))
            ) : buildings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum prédio ativo encontrado
              </div>
            ) : (
              buildings.map((building) => (
                <div
                  key={building.id}
                  onClick={() => toggleBuilding(building.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedBuildings.includes(building.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{building.nome}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{building.bairro} • {building.endereco}</span>
                      </div>
                      
                      {/* Detalhes do prédio */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                        <span className="text-muted-foreground">
                          📺 <strong className="text-foreground">{building.quantidade_telas || 0}</strong> telas
                        </span>
                        <span className="text-muted-foreground">
                          👁️ <strong className="text-foreground">{(building.visualizacoes_mes || 0).toLocaleString()}</strong>/mês
                        </span>
                        <span className="text-muted-foreground">
                          👥 <strong className="text-foreground">{(building.publico_estimado || 0).toLocaleString()}</strong> pessoas
                        </span>
                        <span className="text-muted-foreground">
                          💰 <strong className="text-foreground">{formatCurrency(building.preco_base || 0)}</strong>/tela/mês
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={selectedBuildings.includes(building.id)}
                      onCheckedChange={() => toggleBuilding(building.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Valor sugerido baseado nos prédios */}
          {selectedBuildings.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-xs text-amber-700">
                💡 Valor sugerido (baseado nos prédios): <strong>{formatCurrency(valorSugeridoMensal)}/mês</strong>
              </div>
            </div>
          )}
        </Card>

        {/* Seção 3: Valores */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Valores</h2>
          </div>

          <div className="space-y-4">
            {/* Seletor de Período */}
            <div>
              <Label className="text-xs mb-2 block">Período do Contrato *</Label>
              <div className="grid grid-cols-4 gap-2">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDurationMonths(option.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      durationMonths === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-sm">{option.value}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {option.value === 1 ? 'mês' : 'meses'}
                    </div>
                    {option.discount > 0 && (
                      <div className="text-[9px] text-primary font-medium mt-1">
                        {option.discount}% OFF
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Seletor de Validade da Proposta */}
            <div>
              <Label className="text-xs mb-2 block">⏰ Validade da Proposta *</Label>
              <div className="grid grid-cols-3 gap-2">
                {validityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValidityHours(option.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      validityHours === option.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg">{option.icon}</div>
                    <div className="font-medium text-sm">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Valor Fidelidade Mensal *</Label>
                {valorSugeridoMensal > 0 && (
                  <button
                    type="button"
                    onClick={() => setFidelValue(valorSugeridoMensal.toString())}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Usar sugerido ({formatCurrency(valorSugeridoMensal)})
                  </button>
                )}
              </div>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={fidelValue}
                onChange={(e) => setFidelValue(e.target.value)}
                className="mt-1 h-12 text-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Desconto à Vista</Label>
                <span className="text-sm font-bold text-primary">{discountPercent}%</span>
              </div>
              <Slider
                value={[discountPercent]}
                onValueChange={([value]) => setDiscountPercent(value)}
                min={0}
                max={15}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs">Sobrescrever valor à vista</Label>
                <p className="text-[10px] text-muted-foreground">Definir manualmente</p>
              </div>
              <Switch
                checked={overwriteCashValue}
                onCheckedChange={setOverwriteCashValue}
              />
            </div>

            {overwriteCashValue && (
              <div>
                <Label className="text-xs">Valor à Vista (total)</Label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="mt-1 h-12 text-base"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Seção 4: Preview dos Planos */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Preview dos Planos</h2>
          </div>

          <div className="space-y-3">
            {/* Plano À Vista */}
            <div className="p-4 rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
                <span className="text-xs text-muted-foreground">À Vista ({durationMonths} {durationMonths === 1 ? 'mês' : 'meses'})</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(cashTotal)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                = {formatCurrency(cashTotal / durationMonths)}/mês
                {totalPanels > 0 && ` • R$ ${((cashTotal / durationMonths) / (totalPanels * 30)).toFixed(2)}/painel/dia`}
              </div>
            </div>

            {/* Plano Fidelidade */}
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Fidelidade {durationMonths} {durationMonths === 1 ? 'mês' : 'meses'}</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(fidelMonthly)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(fidelTotal)}
                {totalPanels > 0 && ` • R$ ${(fidelMonthly / (totalPanels * 30)).toFixed(2)}/painel/dia`}
              </div>
            </div>

            {/* Resumo */}
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prédios:</span>
                <span className="font-medium">{selectedBuildings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telas:</span>
                <span className="font-medium">{totalPanels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exibições/mês:</span>
                <span className="font-medium">{totalImpressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Público estimado:</span>
                <span className="font-medium">{totalPublico.toLocaleString()} pessoas</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Fixo com Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 z-20">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-12 gap-2"
            onClick={handleOpenSendDialog}
            disabled={!clientData.name || selectedBuildings.length === 0 || !fidelValue}
          >
            <Send className="h-4 w-4" />
            Enviar Proposta
          </Button>
          <div className="flex justify-center gap-4 mt-3">
            <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
              <FileText className="h-3 w-3" />
              Gerar PDF
            </button>
            <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
              <Link2 className="h-3 w-3" />
              Copiar Link
            </button>
          </div>
        </div>
      </div>

      {/* Dialog de Envio */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar Proposta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Selecione como deseja enviar a proposta para <strong>{clientData.name}</strong>:
            </p>

            {/* WhatsApp */}
            <div 
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                sendViaWhatsApp ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-200'
              } ${!clientData.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => clientData.phone && setSendViaWhatsApp(!sendViaWhatsApp)}
            >
              <Checkbox 
                checked={sendViaWhatsApp} 
                onCheckedChange={(checked) => clientData.phone && setSendViaWhatsApp(!!checked)}
                disabled={!clientData.phone}
              />
              <MessageSquare className="h-5 w-5 text-[#25D366]" />
              <div className="flex-1">
                <div className="font-medium text-sm">WhatsApp</div>
                <div className="text-xs text-muted-foreground">
                  {clientData.phone || 'Telefone não informado'}
                </div>
              </div>
            </div>

            {/* Email */}
            <div 
              className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                sendViaEmail ? 'border-primary bg-primary/5' : 'border-gray-200'
              } ${!clientData.email ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => clientData.email && setSendViaEmail(!sendViaEmail)}
            >
              <Checkbox 
                checked={sendViaEmail} 
                onCheckedChange={(checked) => clientData.email && setSendViaEmail(!!checked)}
                disabled={!clientData.email}
              />
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium text-sm">E-mail</div>
                <div className="text-xs text-muted-foreground">
                  {clientData.email || 'E-mail não informado'}
                </div>
              </div>
            </div>

            {/* Resumo da proposta */}
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div className="font-medium text-sm mb-2">Resumo da Proposta</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prédios:</span>
                <span className="font-medium">{selectedBuildings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Período:</span>
                <span className="font-medium">{durationMonths} {durationMonths === 1 ? 'mês' : 'meses'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor à Vista:</span>
                <span className="font-medium text-primary">{formatCurrency(cashTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Fidelidade:</span>
                <span className="font-medium">{formatCurrency(fidelMonthly)}/mês (total: {formatCurrency(fidelTotal)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validade:</span>
                <span className="font-medium">24 horas</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendProposal}
              disabled={(!sendViaWhatsApp && !sendViaEmail) || createProposalMutation.isPending}
              className="gap-2"
            >
              {createProposalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovaPropostaPage;
