import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Building2, DollarSign, Eye, Send, MessageSquare, Mail, Link2, FileText, CheckCircle, Users, MapPin, Loader2, Gift, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { validateCNPJ, formatCompanyDocument, validateCompanyDocument } from '@/utils/inputValidation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Building {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  quantidade_telas: number | null;
  numero_elevadores: number | null;
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
    companyName: '',
    country: 'BR' as 'BR' | 'AR' | 'PY',
    document: '',
    phone: '',
    email: ''
  });

  // Funções auxiliares para documento dinâmico por país
  const getDocumentLabel = () => {
    switch (clientData.country) {
      case 'BR': return 'CNPJ';
      case 'AR': return 'CUIT';
      case 'PY': return 'RUC';
      default: return 'Documento';
    }
  };

  const getDocumentPlaceholder = () => {
    switch (clientData.country) {
      case 'BR': return '00.000.000/0000-00';
      case 'AR': return '20-12345678-3';
      case 'PY': return '80012345-6';
      default: return 'Documento';
    }
  };

  const getDocumentMaxLength = () => {
    switch (clientData.country) {
      case 'BR': return 18;
      case 'AR': return 13;
      case 'PY': return 10;
      default: return 20;
    }
  };

  const isDocumentValid = () => {
    if (!clientData.document) return true;
    const minLength = clientData.country === 'BR' ? 14 : clientData.country === 'AR' ? 11 : 9;
    const cleanDoc = clientData.document.replace(/\D/g, '');
    if (cleanDoc.length < minLength) return true; // Still typing
    return validateCompanyDocument(clientData.document, clientData.country);
  };

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [durationMonths, setDurationMonths] = useState(6);
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

  // Estados para Cortesia
  const [cortesiaConfirmDialogOpen, setCortesiaConfirmDialogOpen] = useState(false);
  const [cortesiaCodeDialogOpen, setCortesiaCodeDialogOpen] = useState(false);
  const [cortesiaCode, setCortesiaCode] = useState('');
  const [cortesiaRequestId, setCortesiaRequestId] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

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
        .select('id, nome, bairro, endereco, quantidade_telas, numero_elevadores, visualizacoes_mes, preco_base, publico_estimado, imagem_principal')
        .eq('status', 'ativo')
        .order('nome');
      
      if (error) throw error;
      return data as Building[];
    }
  });

  // Buscar usuário atual
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: userData } = await supabase
        .from('users')
        .select('id, nome, email')
        .eq('id', user.id)
        .single();
      
      return userData;
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
    return selectedBuildingsData.reduce((sum, b) => sum + (b.quantidade_telas || b.numero_elevadores || 0), 0);
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
      const telas = b.quantidade_telas || b.numero_elevadores || 1;
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const buildingsData = selectedBuildingsData.map(b => ({
        building_id: b.id,
        building_name: b.nome,
        bairro: b.bairro,
        endereco: b.endereco,
        quantidade_telas: b.quantidade_telas || b.numero_elevadores || 0,
        visualizacoes_mes: b.visualizacoes_mes,
        preco_base: b.preco_base,
        publico_estimado: b.publico_estimado
      }));

      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const proposalNumber = `EXA-${year}-${randomNum}`;

      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert([{
          number: proposalNumber,
          client_name: clientData.name,
          client_company_name: clientData.companyName || null,
          client_country: clientData.country || 'BR',
          client_cnpj: clientData.document || null,
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

      await supabase.from('proposal_logs').insert({
        proposal_id: proposal.id,
        action: 'criada',
        details: { 
          send_whatsapp: sendOptions.whatsapp, 
          send_email: sendOptions.email,
          buildings_count: selectedBuildings.length
        }
      });

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
    if (clientData.document && !isDocumentValid()) {
      toast.error(`${getDocumentLabel()} inválido. Verifique o número.`);
      return;
    }

    setSendViaWhatsApp(!!clientData.phone);
    setSendViaEmail(!!clientData.email);
    setSendDialogOpen(true);
  };

  const handleSendProposal = () => {
    if (!sendViaWhatsApp && !sendViaEmail) {
      toast.error('Selecione ao menos uma forma de envio');
      return;
    }
    // REGRA: Se email está selecionado, SEMPRE enviar também por WhatsApp (se tiver telefone)
    // Isso garante que o cliente receba por ambos os canais
    const shouldSendWhatsApp = sendViaWhatsApp || (sendViaEmail && !!clientData.phone);
    createProposalMutation.mutate({ whatsapp: shouldSendWhatsApp, email: sendViaEmail });
  };

  // Handler para abrir dialog de confirmação de cortesia
  const handleOpenCortesiaDialog = () => {
    if (!clientData.name.trim()) {
      toast.error('Preencha o nome do cliente');
      return;
    }
    if (!clientData.email.trim()) {
      toast.error('E-mail é obrigatório para cortesia');
      return;
    }
    if (selectedBuildings.length === 0) {
      toast.error('Selecione ao menos um prédio');
      return;
    }
    setCortesiaConfirmDialogOpen(true);
  };

  // Handler para solicitar código de cortesia
  const handleRequestCortesiaCode = async () => {
    setIsRequestingCode(true);
    try {
      const buildingsData = selectedBuildingsData.map(b => ({
        building_id: b.id,
        building_name: b.nome,
        bairro: b.bairro,
        quantidade_telas: b.quantidade_telas || b.numero_elevadores || 0
      }));

      const { data, error } = await supabase.functions.invoke('request-cortesia-code', {
        body: {
          clientName: clientData.name,
          clientEmail: clientData.email,
          clientPhone: clientData.phone,
          clientCnpj: clientData.document,
          clientCompanyName: clientData.companyName,
          clientCountry: clientData.country,
          buildings: buildingsData,
          durationMonths,
          totalPanels,
          vendorName: currentUser?.nome || currentUser?.email || 'Vendedor',
          vendorId: currentUser?.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        setCortesiaRequestId(data.requestId);
        setCortesiaConfirmDialogOpen(false);
        setCortesiaCodeDialogOpen(true);
        toast.success(`Código enviado para ${data.sentTo}`);
      } else {
        throw new Error(data?.error || 'Erro ao solicitar código');
      }
    } catch (err: any) {
      console.error('Erro ao solicitar código:', err);
      toast.error(err.message || 'Erro ao solicitar código de cortesia');
    } finally {
      setIsRequestingCode(false);
    }
  };

  // Handler para validar código de cortesia
  const handleValidateCortesiaCode = async () => {
    if (cortesiaCode.length !== 4) {
      toast.error('Digite o código de 4 dígitos');
      return;
    }

    setIsValidatingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-cortesia-code', {
        body: {
          requestId: cortesiaRequestId,
          code: cortesiaCode
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('✅ Cortesia enviada! O cliente receberá um WhatsApp com o link.');
        setCortesiaCodeDialogOpen(false);
        setCortesiaCode('');
        setCortesiaRequestId(null);
        // NÃO redirecionar para /pedidos - a proposta foi enviada, não o pedido criado
        navigate(buildPath('propostas'));
      } else {
        throw new Error(data?.error || 'Código inválido');
      }
    } catch (err: any) {
      console.error('Erro ao validar código:', err);
      toast.error(err.message || 'Código inválido ou expirado');
    } finally {
      setIsValidatingCode(false);
    }
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
              <Label className="text-xs">Nome da Empresa *</Label>
              <Input
                placeholder="Razão Social ou Nome Fantasia"
                value={clientData.companyName}
                onChange={(e) => setClientData(prev => ({ ...prev, companyName: e.target.value }))}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-xs">País da Empresa</Label>
              <Select
                value={clientData.country}
                onValueChange={(value: 'BR' | 'AR' | 'PY') => {
                  setClientData(prev => ({ ...prev, country: value, document: '' }));
                }}
              >
                <SelectTrigger className="mt-1 h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">🇧🇷 Brasil - CNPJ</SelectItem>
                  <SelectItem value="AR">🇦🇷 Argentina - CUIT</SelectItem>
                  <SelectItem value="PY">🇵🇾 Paraguai - RUC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{getDocumentLabel()}</Label>
              <Input
                placeholder={getDocumentPlaceholder()}
                value={clientData.document}
                onChange={(e) => {
                  const formatted = formatCompanyDocument(e.target.value, clientData.country);
                  setClientData(prev => ({ ...prev, document: formatted }));
                }}
                maxLength={getDocumentMaxLength()}
                className={`mt-1 h-12 text-base ${
                  !isDocumentValid()
                    ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-500' 
                    : ''
                }`}
              />
              {!isDocumentValid() && (
                <p className="text-xs text-red-500 mt-1">{getDocumentLabel()} inválido</p>
              )}
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
              <Label className="text-xs">E-mail *</Label>
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
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                        <span className="text-muted-foreground">
                          📺 <strong className="text-foreground">{building.quantidade_telas || building.numero_elevadores || 0}</strong> telas
                        </span>
                        <span className="text-muted-foreground">
                          👁️ <strong className="text-foreground">{(building.visualizacoes_mes || 0).toLocaleString()}</strong>/mês
                        </span>
                        <span className="text-muted-foreground">
                          👥 <strong className="text-foreground">{(building.publico_estimado || 0).toLocaleString()}</strong> pessoas
                        </span>
                      </div>
                    </div>
                    
                    <Checkbox
                      checked={selectedBuildings.includes(building.id)}
                      onCheckedChange={() => toggleBuilding(building.id)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Seção 3: Período e Valores */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Período e Valores</h2>
          </div>

          {/* Seletor de Período */}
          <div className="mb-4">
            <Label className="text-xs mb-2 block">Período do Contrato</Label>
            <div className="grid grid-cols-4 gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDurationMonths(option.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    durationMonths === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg">{option.value}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {option.value === 1 ? 'mês' : 'meses'}
                  </div>
                  {option.discount > 0 && (
                    <div className="text-[10px] text-green-600 font-medium">
                      -{option.discount}%
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Valor Mensal Fidelidade */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">Valor Mensal (Fidelidade)</Label>
              {valorSugeridoMensal > 0 && (
                <button
                  onClick={() => setFidelValue(valorSugeridoMensal.toFixed(2))}
                  className="text-[10px] text-primary hover:underline"
                >
                  Usar sugerido: {formatCurrency(valorSugeridoMensal)}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                placeholder="0,00"
                value={fidelValue}
                onChange={(e) => setFidelValue(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            {fidelMonthly > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(fidelTotal)} em {durationMonths}x de {formatCurrency(fidelMonthly)}
              </p>
            )}
          </div>

          {/* Desconto PIX à Vista */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Desconto PIX à Vista</Label>
              <span className="text-sm font-medium text-primary">{discountPercent}% OFF</span>
            </div>
            <Slider
              value={[discountPercent]}
              onValueChange={(value) => setDiscountPercent(value[0])}
              min={0}
              max={25}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0%</span>
              <span>25%</span>
            </div>
          </div>

          {/* Sobrescrever valor à vista */}
          <div className="flex items-center gap-3 mb-3">
            <Switch
              checked={overwriteCashValue}
              onCheckedChange={setOverwriteCashValue}
            />
            <Label className="text-xs">Definir valor à vista manualmente</Label>
          </div>

          {overwriteCashValue && (
            <div className="mb-4">
              <Label className="text-xs">Valor Total à Vista</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={cashValue}
                  onChange={(e) => setCashValue(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          )}

          {/* Resumo de Valores */}
          {fidelMonthly > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fidelidade ({durationMonths}x):</span>
                <span className="font-medium">{formatCurrency(fidelMonthly)}/mês</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Fidelidade:</span>
                <span className="font-medium">{formatCurrency(fidelTotal)}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">À Vista ({discountPercent}% OFF):</span>
                <span className="font-bold text-primary">{formatCurrency(cashTotal)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Seção 4: Validade da Proposta */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Validade da Proposta</h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {validityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setValidityHours(option.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  validityHours === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Métricas Resumo */}
        {selectedBuildings.length > 0 && (
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-primary">Alcance Estimado</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{totalPanels}</div>
                <div className="text-[10px] text-muted-foreground">Telas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{(totalImpressions / 1000).toFixed(0)}k</div>
                <div className="text-[10px] text-muted-foreground">Exibições/mês</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{(totalPublico / 1000).toFixed(0)}k</div>
                <div className="text-[10px] text-muted-foreground">Pessoas</div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Footer Fixo com Botões */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 z-20">
        <div className="flex gap-3 max-w-lg mx-auto">
          {/* Botão Cortesia */}
          <Button
            variant="outline"
            onClick={handleOpenCortesiaDialog}
            disabled={selectedBuildings.length === 0 || !clientData.email}
            className="flex-1 h-12 border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <Gift className="h-4 w-4 mr-2" />
            Cortesia
          </Button>
          
          {/* Botão Enviar Proposta */}
          <Button
            onClick={handleOpenSendDialog}
            disabled={selectedBuildings.length === 0 || !fidelValue}
            className="flex-[2] h-12 gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar Proposta
          </Button>
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

      {/* Dialog de Confirmação de Cortesia */}
      <Dialog open={cortesiaConfirmDialogOpen} onOpenChange={setCortesiaConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Gift className="h-5 w-5 text-primary" />
              Enviar como Cortesia
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta ação requer autorização do administrador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Você está enviando uma cortesia para:
            </p>

            <div className="p-4 bg-secondary/50 rounded-xl border border-border/30 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{clientData.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{clientData.email}</span>
              </div>
              {clientData.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{clientData.phone}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center p-4 bg-muted/30 rounded-xl border border-border/30">
              <div>
                <div className="text-2xl font-bold text-foreground">{selectedBuildings.length}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" /> Prédios
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalPanels}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <Building2 className="h-3 w-3" /> Telas
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{durationMonths}</div>
                <div className="text-[10px] text-muted-foreground">
                  {durationMonths === 1 ? 'Mês' : 'Meses'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">Validação necessária:</strong> Um código de 4 dígitos será enviado via WhatsApp para o administrador. 
                Você precisará digitar esse código para confirmar a cortesia.
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCortesiaConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestCortesiaCode}
              disabled={isRequestingCode}
              className="gap-2"
            >
              {isRequestingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4" />
                  Solicitar Código
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Código de Cortesia */}
      <Dialog open={cortesiaCodeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCortesiaCode('');
        }
        setCortesiaCodeDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Validação de Cortesia
            </DialogTitle>
            <DialogDescription>
              Código enviado para o administrador
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <p className="text-sm text-muted-foreground text-center mb-6">
              Digite o código de 4 dígitos enviado<br/>
              para o WhatsApp do administrador
            </p>
            
            <div className="flex justify-center">
              <InputOTP 
                maxLength={4} 
                value={cortesiaCode} 
                onChange={setCortesiaCode}
                disabled={isValidatingCode}
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-14 h-16 text-2xl font-semibold rounded-xl border-2 transition-all duration-200 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              O código expira em 10 minutos
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setCortesiaCodeDialogOpen(false);
                setCortesiaCode('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleValidateCortesiaCode}
              disabled={cortesiaCode.length !== 4 || isValidatingCode}
              className="gap-2"
            >
              {isValidatingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Cortesia
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
