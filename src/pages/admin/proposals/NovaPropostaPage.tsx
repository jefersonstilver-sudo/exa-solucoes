import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Building2, DollarSign, Eye, Send, MessageSquare, Mail, Link2, FileText, CheckCircle, Users, MapPin, Loader2, Gift, Shield, Plus, X } from 'lucide-react';
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
import { PhoneInput, type CountryCode } from '@/components/ui/phone-input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
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
  is_manual?: boolean;
}

interface ManualBuilding {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  quantidade_telas: number;
  numero_elevadores: number;
  visualizacoes_mes: number;
  preco_base: number;
  publico_estimado: number;
  imagem_principal: string | null;
  is_manual: true;
}

const NovaPropostaPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsiveLayout();
  const { buildPath } = useAdminBasePath();

  // Estado do formulário
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    country: 'BR' as 'BR' | 'AR' | 'PY',
    document: '',
    phone: '',
    phoneFullNumber: '', // Número completo com código do país
    phoneCountry: 'BR' as CountryCode,
    email: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null
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

  // Estado para tipo de produto
  const [tipoProduto, setTipoProduto] = useState<'horizontal' | 'vertical_premium'>('horizontal');

  // Estados para prédios manuais
  const [manualBuildings, setManualBuildings] = useState<ManualBuilding[]>([]);
  const [addBuildingDialogOpen, setAddBuildingDialogOpen] = useState(false);
  const [newManualBuilding, setNewManualBuilding] = useState({
    nome: '',
    endereco: '',
    quantidade_telas: 1,
    visualizacoes_mes: 7200,
    publico_estimado: 100
  });

  // Opções de período
  const periodOptions = [
    { value: 1, label: '1 mês', discount: 0 },
    { value: 3, label: '3 meses', discount: 20 },
    { value: 6, label: '6 meses', discount: 30 },
    { value: 12, label: '12 meses', discount: 37.5 },
    { value: -1, label: 'Personalizado', discount: 0, custom: true },
  ];

  // Handler para Vertical Premium
  const handleVerticalPremiumToggle = () => {
    const newTipoProduto = tipoProduto === 'vertical_premium' ? 'horizontal' : 'vertical_premium';
    
    if (newTipoProduto === 'vertical_premium') {
      // Selecionar TODOS os prédios automaticamente
      setSelectedBuildings(buildings.map(b => b.id));
      toast.success('Vertical Premium: Todos os prédios selecionados automaticamente');
    } else {
      setSelectedBuildings([]);
    }
    setTipoProduto(newTipoProduto);
  };

  // Estados para pagamento personalizado
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [customDurationMonths, setCustomDurationMonths] = useState(12);
  const [customInstallments, setCustomInstallments] = useState<{
    id: number;
    dueDate: Date;
    amount: string;
  }[]>([
    { id: 1, dueDate: new Date(), amount: '' },
    { id: 2, dueDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), amount: '' }
  ]);

  // Handlers para pagamento personalizado
  const handlePeriodChange = (value: number) => {
    if (value === -1) {
      setIsCustomPayment(true);
      setDurationMonths(customDurationMonths);
    } else {
      setIsCustomPayment(false);
      setDurationMonths(value);
    }
  };

  const addCustomInstallment = () => {
    const lastInstallment = customInstallments[customInstallments.length - 1];
    const newDate = new Date(lastInstallment.dueDate);
    newDate.setMonth(newDate.getMonth() + 1);
    
    setCustomInstallments(prev => [...prev, {
      id: prev.length + 1,
      dueDate: newDate,
      amount: ''
    }]);
  };

  const removeCustomInstallment = (id: number) => {
    if (customInstallments.length <= 2) {
      toast.error('Mínimo de 2 parcelas');
      return;
    }
    setCustomInstallments(prev => prev.filter(p => p.id !== id));
  };

  // Helper para formatar data de forma segura
  const formatDateForInput = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  const updateInstallmentDate = (id: number, date: Date | null) => {
    // Só atualiza se a data for válida
    if (!date || isNaN(date.getTime())) {
      return;
    }
    setCustomInstallments(prev => prev.map(p => 
      p.id === id ? { ...p, dueDate: date } : p
    ));
  };

  const updateInstallmentAmount = (id: number, amount: string) => {
    setCustomInstallments(prev => prev.map(p => 
      p.id === id ? { ...p, amount } : p
    ));
  };

  const distributeEqually = () => {
    if (!fidelValue || parseFloat(fidelValue) <= 0) {
      toast.error('Defina o valor total primeiro');
      return;
    }
    const total = parseFloat(fidelValue) * (isCustomPayment ? customDurationMonths : durationMonths);
    const perInstallment = (total / customInstallments.length).toFixed(2);
    setCustomInstallments(prev => prev.map(p => ({ ...p, amount: perInstallment })));
  };

  const customTotal = useMemo(() => {
    return customInstallments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [customInstallments]);

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

  // Cálculos baseados nos prédios selecionados (incluindo manuais)
  const selectedBuildingsData = useMemo(() => {
    const dbBuildings = buildings.filter(b => selectedBuildings.includes(b.id));
    const selectedManual = manualBuildings.filter(b => selectedBuildings.includes(b.id));
    return [...dbBuildings, ...selectedManual];
  }, [buildings, manualBuildings, selectedBuildings]);

  const totalPanels = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.quantidade_telas || (b as any).numero_elevadores || 0), 0);
  }, [selectedBuildingsData]);

  const totalImpressions = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.visualizacoes_mes || 0), 0);
  }, [selectedBuildingsData]);

  const totalPublico = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.publico_estimado || 0), 0);
  }, [selectedBuildingsData]);

  // Handler para adicionar prédio manual
  const handleAddManualBuilding = () => {
    if (!newManualBuilding.nome.trim()) {
      toast.error('Informe o nome do prédio');
      return;
    }
    if (!newManualBuilding.endereco.trim()) {
      toast.error('Informe o endereço do prédio');
      return;
    }
    
    const newBuilding: ManualBuilding = {
      id: `manual_${Date.now()}`,
      nome: newManualBuilding.nome.trim(),
      bairro: 'Manual',
      endereco: newManualBuilding.endereco.trim(),
      quantidade_telas: newManualBuilding.quantidade_telas || 1,
      numero_elevadores: newManualBuilding.quantidade_telas || 1,
      visualizacoes_mes: newManualBuilding.visualizacoes_mes || 7200,
      preco_base: 0,
      publico_estimado: newManualBuilding.publico_estimado || 100,
      imagem_principal: null,
      is_manual: true
    };
    
    setManualBuildings(prev => [...prev, newBuilding]);
    setSelectedBuildings(prev => [...prev, newBuilding.id]);
    setAddBuildingDialogOpen(false);
    setNewManualBuilding({ nome: '', endereco: '', quantidade_telas: 1, visualizacoes_mes: 7200, publico_estimado: 100 });
    toast.success('Prédio manual adicionado com *');
  };

  // Handler para remover prédio manual
  const removeManualBuilding = (id: string) => {
    setManualBuildings(prev => prev.filter(b => b.id !== id));
    setSelectedBuildings(prev => prev.filter(bid => bid !== id));
  };

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
        bairro: (b as any).bairro || 'N/A',
        endereco: b.endereco,
        quantidade_telas: b.quantidade_telas || (b as any).numero_elevadores || 0,
        visualizacoes_mes: b.visualizacoes_mes,
        preco_base: (b as any).preco_base || 0,
        publico_estimado: b.publico_estimado,
        is_manual: (b as any).is_manual || false
      }));

      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const proposalNumber = `EXA-${year}-${randomNum}`;

      const fullName = `${clientData.firstName.trim()} ${clientData.lastName.trim()}`;
      
      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert([{
          number: proposalNumber,
          client_name: fullName,
          client_first_name: clientData.firstName.trim(),
          client_last_name: clientData.lastName.trim(),
          client_company_name: clientData.companyName || null,
          client_country: clientData.country || 'BR',
          client_cnpj: clientData.document || null,
          client_phone: clientData.phoneFullNumber || clientData.phone || null, // Número completo com código do país
          client_email: clientData.email || null,
          selected_buildings: buildingsData as Json,
          total_panels: totalPanels,
          total_impressions_month: totalImpressions,
          fidel_monthly_value: isCustomPayment ? customTotal / customInstallments.length : fidelMonthly,
          cash_total_value: isCustomPayment ? customTotal : cashTotal,
          discount_percent: discountPercent,
          duration_months: durationMonths,
          status: 'enviada',
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + validityHours * 60 * 60 * 1000).toISOString(),
          created_by: user?.id,
          seller_name: currentUser?.nome || currentUser?.email || 'Vendedor',
          payment_type: isCustomPayment ? 'custom' : 'standard',
          tipo_produto: tipoProduto,
          client_address: clientData.address || null,
          client_latitude: clientData.latitude || null,
          client_longitude: clientData.longitude || null,
          custom_installments: isCustomPayment ? customInstallments.map((p, idx) => ({
            installment: idx + 1,
            due_date: formatDateForInput(p.dueDate),
            amount: parseFloat(p.amount) || 0
          })) as Json : null
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
    if (!clientData.firstName.trim()) {
      toast.error('Preencha o primeiro nome do cliente');
      return;
    }
    if (!clientData.lastName.trim()) {
      toast.error('Preencha o sobrenome do cliente');
      return;
    }
    if (selectedBuildings.length === 0) {
      toast.error('Selecione ao menos um prédio');
      return;
    }
    
    // Validação para pagamento personalizado
    if (isCustomPayment) {
      const invalidInstallments = customInstallments.filter(p => !p.amount || parseFloat(p.amount) <= 0);
      if (invalidInstallments.length > 0) {
        toast.error('Preencha o valor de todas as parcelas');
        return;
      }
      if (customTotal <= 0) {
        toast.error('O total das parcelas deve ser maior que zero');
        return;
      }
    } else {
      if (!fidelValue || parseFloat(fidelValue) <= 0) {
        toast.error('Preencha o valor mensal fidelidade');
        return;
      }
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
    if (!clientData.firstName.trim() || !clientData.lastName.trim()) {
      toast.error('Preencha o nome e sobrenome do cliente');
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

      const fullClientName = `${clientData.firstName.trim()} ${clientData.lastName.trim()}`;
      
      const { data, error } = await supabase.functions.invoke('request-cortesia-code', {
        body: {
          clientName: fullClientName,
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input
                  placeholder="Primeiro nome"
                  value={clientData.firstName}
                  onChange={(e) => setClientData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 h-12 text-base"
                />
              </div>
              <div>
                <Label className="text-xs">Sobrenome *</Label>
                <Input
                  placeholder="Sobrenome"
                  value={clientData.lastName}
                  onChange={(e) => setClientData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 h-12 text-base"
                />
              </div>
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
            <PhoneInput
              value={clientData.phone}
              onChange={(formatted, fullNumber, countryCode) => setClientData(prev => ({ 
                ...prev, 
                phone: formatted,
                phoneFullNumber: fullNumber,
                phoneCountry: countryCode
              }))}
              defaultCountry={clientData.country as CountryCode}
              label="Telefone WhatsApp"
              showLabel={true}
              compact={false}
            />
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
            
            {/* Campo de Endereço - Condicional por país */}
            <div className="md:col-span-2">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Endereço da Empresa
              </Label>
              {clientData.country === 'BR' ? (
                <AddressAutocomplete
                  value={clientData.address}
                  onChange={(value) => setClientData(prev => ({ ...prev, address: value }))}
                  onPlaceSelect={(place) => {
                    setClientData(prev => ({ 
                      ...prev, 
                      address: place.address,
                      latitude: place.coordinates.lat,
                      longitude: place.coordinates.lng
                    }));
                  }}
                  placeholder="Digite o endereço da empresa..."
                  className="mt-1 h-12 text-base"
                />
              ) : (
                <Input
                  value={clientData.address}
                  onChange={(e) => setClientData(prev => ({ 
                    ...prev, 
                    address: e.target.value,
                    latitude: null,
                    longitude: null
                  }))}
                  placeholder="Digite o endereço completo da empresa..."
                  className="mt-1 h-12 text-base"
                />
              )}
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

          {/* Botão Vertical Premium */}
          <div className="mb-4">
            <button
              onClick={handleVerticalPremiumToggle}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                tipoProduto === 'vertical_premium'
                  ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100'
                  : 'border-dashed border-purple-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tipoProduto === 'vertical_premium' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'}`}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-sm ${tipoProduto === 'vertical_premium' ? 'text-purple-700' : 'text-purple-600'}`}>
                      🌟 VERTICAL PREMIUM
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Tela cheia a cada 50s • Todos os prédios incluídos
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  tipoProduto === 'vertical_premium' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                }`}>
                  {tipoProduto === 'vertical_premium' && (
                    <CheckCircle className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
              {tipoProduto === 'vertical_premium' && (
                <div className="mt-2 text-[10px] text-purple-600 bg-purple-100/50 rounded p-2">
                  ✓ Vídeo vertical 10s • ✓ Tela cheia • ✓ {buildings.length} prédios incluídos • ✓ Sem portal
                </div>
              )}
            </button>
          </div>

          {/* Botões Selecionar Todos / Limpar */}
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={isLoadingBuildings || selectedBuildings.length === buildings.length || tipoProduto === 'vertical_premium'}
              className="text-xs h-8"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Selecionar Todos ({buildings.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedBuildings.length === 0 || tipoProduto === 'vertical_premium'}
              className="text-xs h-8"
            >
              Limpar Seleção
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddBuildingDialogOpen(true)}
              className="text-xs h-8 border-dashed border-amber-400 text-amber-600 hover:bg-amber-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Prédio*
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
            ) : buildings.length === 0 && manualBuildings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum prédio ativo encontrado
              </div>
            ) : (
              <>
                {/* Prédios Manuais (aparecem primeiro com destaque) */}
                {manualBuildings.map((building) => (
                  <div
                    key={building.id}
                    onClick={() => toggleBuilding(building.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedBuildings.includes(building.id)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-amber-200 hover:border-amber-300 bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate flex items-center gap-1">
                          {building.nome}
                          <span className="text-amber-600 text-xs font-bold">*</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{building.endereco}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                          <span className="text-amber-600">
                            📺 <strong>{building.quantidade_telas}</strong> telas
                          </span>
                          <span className="text-amber-600">
                            👁️ <strong>{building.visualizacoes_mes.toLocaleString()}</strong>/mês
                          </span>
                          <span className="text-amber-600">
                            👥 <strong>{building.publico_estimado.toLocaleString()}</strong> pessoas
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeManualBuilding(building.id);
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <Checkbox
                          checked={selectedBuildings.includes(building.id)}
                          onCheckedChange={() => toggleBuilding(building.id)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Prédios do Banco de Dados */}
                {buildings.map((building) => (
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
                ))}

                {/* Legenda para prédios manuais */}
                {manualBuildings.length > 0 && (
                  <div className="text-xs text-amber-600 mt-2 px-1">
                    * Prédio adicionado manualmente (apenas para emissão desta proposta)
                  </div>
                )}
              </>
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
            <div className="grid grid-cols-5 gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    (option.value === -1 && isCustomPayment) || (!isCustomPayment && durationMonths === option.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {option.value === -1 ? (
                    <>
                      <div className="font-bold text-sm">⚙️</div>
                      <div className="text-[10px] text-muted-foreground">Custom</div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-lg">{option.value}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {option.value === 1 ? 'mês' : 'meses'}
                      </div>
                      {option.discount > 0 && (
                        <div className="text-[10px] text-green-600 font-medium">
                          -{option.discount}%
                        </div>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Configuração de Pagamento Personalizado */}
          {isCustomPayment && (
            <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚙️</span>
                <h3 className="font-semibold text-amber-800">Pagamento Personalizado</h3>
              </div>

              {/* Duração do Contrato */}
              <div className="mb-4">
                <Label className="text-xs">Duração do Contrato (meses)</Label>
                <Select 
                  value={customDurationMonths.toString()} 
                  onValueChange={(v) => {
                    setCustomDurationMonths(parseInt(v));
                    setDurationMonths(parseInt(v));
                  }}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12, 18, 24].map(m => (
                      <SelectItem key={m} value={m.toString()}>{m} meses</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelas */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Parcelas ({customInstallments.length})</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={distributeEqually}
                      className="text-[10px] text-amber-700 hover:underline"
                    >
                      Dividir igualmente
                    </button>
                    <button
                      onClick={addCustomInstallment}
                      className="text-[10px] text-primary font-medium hover:underline"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {customInstallments.map((installment, index) => (
                    <div key={installment.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                      <span className="text-xs font-medium text-muted-foreground w-6">{index + 1}ª</span>
                      <Input
                        type="date"
                        value={formatDateForInput(installment.dueDate)}
                        onChange={(e) => {
                          const dateValue = e.target.value;
                          if (dateValue) {
                            const newDate = new Date(dateValue + 'T00:00:00');
                            if (!isNaN(newDate.getTime())) {
                              updateInstallmentDate(installment.id, newDate);
                            }
                          }
                        }}
                        className="flex-1 h-9 text-sm"
                      />
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={installment.amount}
                          onChange={(e) => updateInstallmentAmount(installment.id, e.target.value)}
                          className="pl-8 h-9 text-sm"
                        />
                      </div>
                      {customInstallments.length > 2 && (
                        <button
                          onClick={() => removeCustomInstallment(installment.id)}
                          className="text-red-500 hover:text-red-700 text-sm p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total das parcelas */}
                <div className="mt-3 p-2 bg-amber-100 rounded flex justify-between items-center">
                  <span className="text-xs font-medium text-amber-800">Total das Parcelas:</span>
                  <span className="font-bold text-amber-900">{formatCurrency(customTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Valor Mensal Fidelidade - Somente para pagamento padrão */}
          {!isCustomPayment && (
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
          )}

          {/* Desconto PIX à Vista - Somente para pagamento padrão */}
          {!isCustomPayment && (
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
          )}

          {/* Sobrescrever valor à vista - Somente para pagamento padrão */}
          {!isCustomPayment && (
            <>
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
            </>
          )}

          {/* Resumo de Valores - Padrão */}
          {!isCustomPayment && fidelMonthly > 0 && (
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

          {/* Resumo de Valores - Personalizado */}
          {isCustomPayment && customTotal > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg space-y-2 border border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <span>⚙️</span>
                <span className="text-xs font-medium text-amber-800">Pagamento Personalizado</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{customDurationMonths} meses</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Parcelas:</span>
                <span className="font-medium">{customInstallments.length}x</span>
              </div>
              <hr className="border-amber-200" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-amber-800">{formatCurrency(customTotal)}</span>
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
            disabled={selectedBuildings.length === 0 || (isCustomPayment ? customTotal <= 0 : !fidelValue)}
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
              Selecione como deseja enviar a proposta para <strong>{clientData.firstName} {clientData.lastName}</strong>:
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
                <span className="font-medium text-foreground">{clientData.firstName} {clientData.lastName}</span>
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

      {/* Dialog para adicionar prédio manual */}
      <Dialog open={addBuildingDialogOpen} onOpenChange={setAddBuildingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              Adicionar Prédio Manual
            </DialogTitle>
            <DialogDescription>
              Prédios manuais são marcados com asterisco (*) e servem apenas para emissão desta proposta.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs">Nome do Prédio *</Label>
              <Input 
                value={newManualBuilding.nome}
                onChange={(e) => setNewManualBuilding({...newManualBuilding, nome: e.target.value})}
                placeholder="Ex: Edifício Aurora"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Endereço *</Label>
              <Input 
                value={newManualBuilding.endereco}
                onChange={(e) => setNewManualBuilding({...newManualBuilding, endereco: e.target.value})}
                placeholder="Ex: Rua das Flores, 123 - Centro"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Nº de Telas</Label>
                <Input 
                  type="number"
                  min="1"
                  value={newManualBuilding.quantidade_telas}
                  onChange={(e) => setNewManualBuilding({...newManualBuilding, quantidade_telas: parseInt(e.target.value) || 1})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Exibições/Mês</Label>
                <Input 
                  type="number"
                  min="0"
                  value={newManualBuilding.visualizacoes_mes}
                  onChange={(e) => setNewManualBuilding({...newManualBuilding, visualizacoes_mes: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Público Est.</Label>
                <Input 
                  type="number"
                  min="0"
                  value={newManualBuilding.publico_estimado}
                  onChange={(e) => setNewManualBuilding({...newManualBuilding, publico_estimado: parseInt(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddBuildingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddManualBuilding}
              className="gap-2 bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Adicionar Prédio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovaPropostaPage;
