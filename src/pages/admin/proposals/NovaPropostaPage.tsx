import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Building2, DollarSign, Eye, Send, MessageSquare, Mail, Link2, FileText, CheckCircle, Users, MapPin, Loader2, Gift, Shield, Plus, X, Search, Bell, CalendarIcon, Rocket, Crown, Lock, RefreshCw, Package, Copy, Image as ImageIcon } from 'lucide-react';
import { format, differenceInDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PhoneInput, type CountryCode } from '@/components/ui/phone-input';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useAutocompleteHistory } from '@/hooks/useAutocompleteHistory';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { validateCNPJ, formatCompanyDocument, validateCompanyDocument } from '@/utils/inputValidation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCNPJConsult } from '@/hooks/useCNPJConsult';
import { ProposalAlertRecipients, type AlertRecipient } from '@/components/admin/proposals/ProposalAlertRecipients';
import { calculateBuildingsPrice, type PlanDuration } from '@/utils/buildingPriceUtils';
import { CCEmailsInput } from '@/components/ui/cc-emails-input';
import { createContactFromProposal } from '@/services/contactAutoCreator';
import { usePosicoesDisponiveis } from '@/hooks/usePosicoesDisponiveis';
import { useVideoSpecifications } from '@/hooks/useVideoSpecifications';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';

import { BusinessSegmentSelector } from '@/components/ui/business-segment-selector';
import { ItensPermutaEditor } from '@/components/admin/proposals/ItensPermutaEditor';
import { ClientLogoUploadModal } from '@/components/admin/proposals/ClientLogoUploadModal';

interface Building {
  id: string;
  nome: string;
  bairro: string;
  endereco: string;
  quantidade_telas: number | null;
  numero_elevadores: number | null;
  visualizacoes_mes: number | null;
  preco_base: number | null;
  preco_trimestral: number | null;
  preco_semestral: number | null;
  preco_anual: number | null;
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
  const { id: editProposalId } = useParams<{ id?: string }>();
  const isEditMode = Boolean(editProposalId);
  const queryClient = useQueryClient();
  const {
    isMobile
  } = useResponsiveLayout();
  const {
    buildPath
  } = useAdminBasePath();
  const {
    consultCNPJ,
    isLoading: isLoadingCNPJ
  } = useCNPJConsult();
  const {
    saveClientData: saveAutocomplete
  } = useAutocompleteHistory();

  // Estado do formulário
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    country: 'BR' as 'BR' | 'AR' | 'PY',
    document: '',
    phone: '',
    phoneFullNumber: '',
    // Número completo com código do país
    phoneCountry: 'BR' as CountryCode,
    email: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  // Funções auxiliares para documento dinâmico por país
  const getDocumentLabel = () => {
    switch (clientData.country) {
      case 'BR':
        return 'CNPJ';
      case 'AR':
        return 'CUIT';
      case 'PY':
        return 'RUC';
      default:
        return 'Documento';
    }
  };
  const getDocumentPlaceholder = () => {
    switch (clientData.country) {
      case 'BR':
        return '00.000.000/0000-00';
      case 'AR':
        return '20-12345678-3';
      case 'PY':
        return '80012345-6';
      default:
        return 'Documento';
    }
  };
  const getDocumentMaxLength = () => {
    switch (clientData.country) {
      case 'BR':
        return 18;
      case 'AR':
        return 13;
      case 'PY':
        return 10;
      default:
        return 20;
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
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Dialog de envio
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [sendViaEmail, setSendViaEmail] = useState(false);
  const [onlyGenerateLink, setOnlyGenerateLink] = useState(false);

  // Estados para Cortesia
  const [cortesiaConfirmDialogOpen, setCortesiaConfirmDialogOpen] = useState(false);
  const [cortesiaCodeDialogOpen, setCortesiaCodeDialogOpen] = useState(false);
  const [cortesiaCode, setCortesiaCode] = useState('');
  const [cortesiaRequestId, setCortesiaRequestId] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  // Estado para tipo de produto
  const [tipoProduto, setTipoProduto] = useState<'horizontal' | 'vertical_premium'>('horizontal');

  // Estado para quantidade de posições (marcas)
  const [quantidadePosicoes, setQuantidadePosicoes] = useState(1);

  // Estados para prédios manuais
  const [manualBuildings, setManualBuildings] = useState<ManualBuilding[]>([]);
  const [addBuildingDialogOpen, setAddBuildingDialogOpen] = useState(false);
  const [newManualBuilding, setNewManualBuilding] = useState({
    nome: '',
    endereco: '',
    quantidade_telas: 1,
    visualizacoes_mes: 11610,
    // Manual v3.0: 387 ciclos × 30 dias = 11.610/mês por tela
    publico_estimado: 100
  });

  // Estados para destinatários de notificações EXA Alerts
  const [alertRecipients, setAlertRecipients] = useState<AlertRecipient[]>([]);

  // Estados para e-mails de cópia (CC)
  const [ccEmails, setCcEmails] = useState<string[]>([]);

  // Estado para preview da proposta
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Estado para título da proposta
  const [tituloProposta, setTituloProposta] = useState('');

  // Estados para novos toggles: Cobrança Futura e Exigir Contrato
  const [cobrancaFutura, setCobrancaFutura] = useState(false);
  const [exigirContrato, setExigirContrato] = useState(true);

  // Estados para Venda Futura (prédios ainda não instalados)
  const [vendaFutura, setVendaFutura] = useState(false);
  const [prediosContratados, setPrediosContratados] = useState(0);
  const [telasContratadas, setTelasContratadas] = useState<number | null>(null); // null = automático

  // Estados para Exclusividade de Segmento
  const [oferecerExclusividade, setOferecerExclusividade] = useState(false);
  const [segmentoExclusivo, setSegmentoExclusivo] = useState('');
  const [exclusividadePercentual, setExclusividadePercentual] = useState(35);
  const [exclusividadeValorExtra, setExclusividadeValorExtra] = useState<number | null>(null); // null = automático
  const [exclusividadeDisponivel, setExclusividadeDisponivel] = useState<boolean | null>(null);
  const [verificandoExclusividade, setVerificandoExclusividade] = useState(false);
  const [segmentoPopoverOpen, setSegmentoPopoverOpen] = useState(false);

  // Estados para Travamento de Preço
  const [travamentoPrecoAtivo, setTravamentoPrecoAtivo] = useState(false);
  const [travamentoPrecoValor, setTravamentoPrecoValor] = useState<number>(0);
  const [travamentoTelasLimite, setTravamentoTelasLimite] = useState<number>(50);
  const [travamentoModoCalculo, setTravamentoModoCalculo] = useState<'automatico' | 'manual'>('automatico');
  const [travamentoPrecoManual, setTravamentoPrecoManual] = useState<number>(0);

  // Estados para Multa de Rescisão
  const [multaRescisaoAtiva, setMultaRescisaoAtiva] = useState(true);
  const [multaRescisaoPercentual, setMultaRescisaoPercentual] = useState<number>(20);

  // Estados para Proposta de Permuta (não-monetária)
  const [modalidadeProposta, setModalidadeProposta] = useState<'monetaria' | 'permuta'>('monetaria');
  const [itensPermuta, setItensPermuta] = useState<Array<{
    id: string;
    nome: string;
    descricao?: string;
    quantidade: number;
    preco_unitario: number;
    preco_total: number;
    ocultar_preco: boolean;
  }>>([]);
  const [ocultarValoresPublico, setOcultarValoresPublico] = useState(false);
  const [descricaoContrapartida, setDescricaoContrapartida] = useState('');
  const [metodoPagamentoAlternativo, setMetodoPagamentoAlternativo] = useState<string | null>(null);
  // Valor de referência monetária para propostas de permuta (quanto custaria se fosse comprar)
  const [valorReferenciaMonetaria, setValorReferenciaMonetaria] = useState<number>(0);

  // Estados para Logo do Cliente
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [showLogoUploadModal, setShowLogoUploadModal] = useState(false);

  // Estados para Auto-Save de Rascunho
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Valor total da permuta (para referência interna)
  const valorTotalPermuta = useMemo(() => {
    return itensPermuta.reduce((sum, item) => sum + item.preco_total, 0);
  }, [itensPermuta]);

  // Opções de período
  const periodOptions = [{
    value: 1,
    label: '1 mês',
    discount: 0
  }, {
    value: 3,
    label: '3 meses',
    discount: 20
  }, {
    value: 6,
    label: '6 meses',
    discount: 30
  }, {
    value: 9,
    label: '9 meses',
    discount: 33
  }, {
    value: 12,
    label: '12 meses',
    discount: 37.5
  }, {
    value: 18,
    label: '18 meses',
    discount: 40
  }, {
    value: 24,
    label: '24 meses',
    discount: 45
  }, {
    value: -2,
    label: 'Período em Dias',
    discount: -10,
    customDays: true
  }, {
    value: -1,
    label: 'Pagamento Personalizado',
    discount: 0,
    custom: true
  }];

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

  // Estados para período em dias
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDays, setCustomDays] = useState(15);
  const [customInstallments, setCustomInstallments] = useState<{
    id: number;
    dueDate: Date;
    amount: string;
  }[]>([{
    id: 1,
    dueDate: new Date(),
    amount: ''
  }, {
    id: 2,
    dueDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    amount: ''
  }]);

  // Detectar se tem parcela futura no pagamento personalizado
  const hasFutureInstallment = useMemo(() => {
    if (!isCustomPayment) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return customInstallments.some(p => {
      const dueDate = new Date(p.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate > today;
    });
  }, [isCustomPayment, customInstallments]);

  // Handlers para pagamento personalizado
  const handlePeriodChange = (value: number) => {
    if (value === -1) {
      // Pagamento Personalizado (parcelas customizadas)
      setIsCustomPayment(true);
      setIsCustomDays(false);
      setDurationMonths(customDurationMonths);
    } else if (value === -2) {
      // Período em Dias
      setIsCustomDays(true);
      setIsCustomPayment(false);
      setDurationMonths(0);
    } else {
      // Período normal em meses
      setIsCustomPayment(false);
      setIsCustomDays(false);
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
    setCustomInstallments(prev => prev.map(p => p.id === id ? {
      ...p,
      dueDate: date
    } : p));
  };
  const updateInstallmentAmount = (id: number, amount: string) => {
    setCustomInstallments(prev => prev.map(p => p.id === id ? {
      ...p,
      amount
    } : p));
  };
  const distributeEqually = () => {
    if (!fidelValue || parseFloat(fidelValue) <= 0) {
      toast.error('Defina o valor total primeiro');
      return;
    }
    const total = parseFloat(fidelValue) * (isCustomPayment ? customDurationMonths : durationMonths);
    const perInstallment = (total / customInstallments.length).toFixed(2);
    setCustomInstallments(prev => prev.map(p => ({
      ...p,
      amount: perInstallment
    })));
  };
  const customTotal = useMemo(() => {
    return customInstallments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [customInstallments]);

  // Opções de validade da proposta
  const validityOptions = [{
    value: 24,
    label: '24 horas',
    icon: '⚡'
  }, {
    value: 72,
    label: '72 horas',
    icon: '🕐'
  }, {
    value: 168,
    label: '7 dias',
    icon: '📅'
  }, {
    value: -1,
    label: 'Personalizado',
    icon: '🗓️'
  }, {
    value: 0,
    label: 'Indeterminada',
    icon: '∞'
  }];

  // Buscar prédios ativos do banco de dados (incluindo preços por plano)
  const {
    data: buildings = [],
    isLoading: isLoadingBuildings
  } = useQuery({
    queryKey: ['buildings-active-for-proposals'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('buildings').select('id, nome, bairro, endereco, quantidade_telas, numero_elevadores, visualizacoes_mes, preco_base, preco_trimestral, preco_semestral, preco_anual, publico_estimado, imagem_principal').eq('status', 'ativo').order('nome');
      if (error) throw error;
      return data as Building[];
    }
  });

  // Buscar proposta existente para modo de edição
  const { data: existingProposal, isLoading: isLoadingProposal } = useQuery({
    queryKey: ['proposal-for-edit', editProposalId],
    queryFn: async () => {
      if (!editProposalId) return null;
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', editProposalId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode
  });

  // Popular campos quando proposta existente é carregada
  const [dataLoaded, setDataLoaded] = useState(false);
  // Reset estado quando editProposalId mudar (evita "estado grudado" entre edições)
  useEffect(() => {
    if (editProposalId) {
      console.log('🔄 Reset de estado para nova edição:', editProposalId);
      setDataLoaded(false);
      // Limpar estados críticos para evitar mostrar dados antigos
      setSelectedBuildings([]);
      setManualBuildings([]);
      setItensPermuta([]);
      setClientData({
        firstName: '',
        lastName: '',
        companyName: '',
        country: 'BR',
        document: '',
        phone: '',
        phoneFullNumber: '',
        phoneCountry: 'BR' as CountryCode,
        email: '',
        address: '',
        latitude: null,
        longitude: null
      });
    }
  }, [editProposalId]);

  useEffect(() => {
    if (existingProposal && !dataLoaded && buildings.length > 0) {
      console.log('📝 Carregando dados da proposta para edição:', existingProposal.number);
      
      // Dados do cliente
      const nameParts = (existingProposal.client_name || '').split(' ');
      const firstName = existingProposal.client_first_name || nameParts[0] || '';
      const lastName = existingProposal.client_last_name || nameParts.slice(1).join(' ') || '';
      
      setClientData({
        firstName,
        lastName,
        companyName: existingProposal.client_company_name || '',
        country: (existingProposal.client_country as 'BR' | 'AR' | 'PY') || 'BR',
        document: existingProposal.client_cnpj || '',
        phone: existingProposal.client_phone || '',
        phoneFullNumber: existingProposal.client_phone || '',
        phoneCountry: 'BR' as CountryCode,
        email: existingProposal.client_email || '',
        address: existingProposal.client_address || '',
        latitude: existingProposal.client_latitude || null,
        longitude: existingProposal.client_longitude || null
      });

      // Prédios selecionados - normalização robusta para diferentes formatos
      const rawSelectedBuildings = existingProposal.selected_buildings;
      let buildingIds: string[] = [];
      let manualBldgs: ManualBuilding[] = [];

      if (Array.isArray(rawSelectedBuildings)) {
        // Verificar se é array de strings (IDs) ou array de objetos
        if (rawSelectedBuildings.length > 0) {
          const firstItem = rawSelectedBuildings[0];
          
          if (typeof firstItem === 'string') {
            // Array de strings (IDs simples)
            buildingIds = rawSelectedBuildings as string[];
          } else if (typeof firstItem === 'object' && firstItem !== null) {
            // Array de objetos - extrair IDs e prédios manuais
            buildingIds = (rawSelectedBuildings as any[])
              .filter((b: any) => b && (b.building_id || b.id) && !b.is_manual)
              .map((b: any) => b.building_id || b.id);
            
            // Prédios manuais
            manualBldgs = (rawSelectedBuildings as any[])
              .filter((b: any) => b && b.is_manual)
              .map((b: any) => ({
                id: b.building_id || b.id || `manual_${Date.now()}_${Math.random()}`,
                nome: b.building_name || b.nome || '',
                bairro: b.bairro || 'N/A',
                endereco: b.endereco || '',
                quantidade_telas: b.quantidade_telas || 1,
                numero_elevadores: b.quantidade_telas || 1,
                visualizacoes_mes: b.visualizacoes_mes || 11610,
                preco_base: b.preco_base || 0,
                publico_estimado: b.publico_estimado || 100,
                imagem_principal: null,
                is_manual: true as const
              }));
          }
        }
      }

      setSelectedBuildings(buildingIds);
      setManualBuildings(manualBldgs);

      // Configurações de pagamento
      setDurationMonths(existingProposal.duration_months || 6);
      setDiscountPercent(existingProposal.discount_percent || 10);
      setFidelValue(String(existingProposal.fidel_monthly_value || ''));
      
      if (existingProposal.payment_type === 'custom' && existingProposal.custom_installments) {
        setIsCustomPayment(true);
        const installments = existingProposal.custom_installments as any[];
        setCustomInstallments(installments.map((p: any, idx: number) => ({
          id: idx + 1,
          dueDate: new Date(p.due_date),
          amount: String(p.amount || '')
        })));
        setCustomDurationMonths(existingProposal.duration_months || 12);
      } else {
        setIsCustomPayment(false);
      }

      if (existingProposal.is_custom_days) {
        setIsCustomDays(true);
        setCustomDays(existingProposal.custom_days || 15);
      } else {
        setIsCustomDays(false);
      }

      // Tipo de produto
      const tipoProdutoValue = existingProposal.tipo_produto;
      if (tipoProdutoValue === 'horizontal' || tipoProdutoValue === 'vertical_premium') {
        setTipoProduto(tipoProdutoValue);
      }
      
      // Quantidade de posições
      setQuantidadePosicoes(existingProposal.quantidade_posicoes || 1);

      // Título
      setTituloProposta(existingProposal.titulo || '');

      // Configurações adicionais
      setCobrancaFutura(existingProposal.cobranca_futura || false);
      setExigirContrato(existingProposal.exigir_contrato !== false);
      
      // Venda futura
      setVendaFutura(existingProposal.venda_futura || false);
      setPrediosContratados(existingProposal.predios_contratados || 0);
      
      // Exclusividade
      setOferecerExclusividade(existingProposal.exclusividade_segmento || false);
      setSegmentoExclusivo(existingProposal.segmento_exclusivo || '');
      setExclusividadePercentual(existingProposal.exclusividade_percentual || 35);
      setExclusividadeValorExtra(existingProposal.exclusividade_valor_extra || null);

      // Travamento de preço
      setTravamentoPrecoAtivo(existingProposal.travamento_preco_ativo || false);
      setTravamentoPrecoValor(existingProposal.travamento_preco_valor || 0);
      setTravamentoTelasLimite(existingProposal.travamento_telas_limite || 50);

      // Multa de rescisão
      setMultaRescisaoAtiva(existingProposal.multa_rescisao_ativa !== false);
      setMultaRescisaoPercentual(existingProposal.multa_rescisao_percentual || 20);

      // ============================================
      // CAMPOS DE PERMUTA - HIDRATAÇÃO COMPLETA
      // ============================================
      const modalidade = existingProposal.modalidade_proposta;
      if (modalidade === 'monetaria' || modalidade === 'permuta') {
        setModalidadeProposta(modalidade);
      } else {
        setModalidadeProposta('monetaria');
      }

      // Itens de permuta
      const itensPermutaRaw = existingProposal.itens_permuta;
      if (Array.isArray(itensPermutaRaw)) {
        setItensPermuta(itensPermutaRaw.map((item: any) => ({
          id: item.id || `item_${Date.now()}_${Math.random()}`,
          nome: item.nome || '',
          descricao: item.descricao || '',
          quantidade: item.quantidade || 1,
          preco_unitario: item.preco_unitario || 0,
          preco_total: item.preco_total || 0,
          ocultar_preco: item.ocultar_preco || false
        })));
      } else {
        setItensPermuta([]);
      }

      setOcultarValoresPublico(existingProposal.ocultar_valores_publico === true);
      setDescricaoContrapartida(existingProposal.descricao_contrapartida || '');
      setMetodoPagamentoAlternativo(existingProposal.metodo_pagamento_alternativo || null);
      setValorReferenciaMonetaria((existingProposal as any).valor_referencia_monetaria || 0);

      // ============================================
      // VALIDADE DA PROPOSTA - HIDRATAÇÃO COMPLETA
      // ============================================
      if (existingProposal.expires_at === null) {
        // Validade indeterminada
        setValidityHours(0);
        setCustomDateRange(undefined);
      } else if (existingProposal.expires_at) {
        const expiresAt = new Date(existingProposal.expires_at);
        const now = new Date();
        const diffHours = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        // Verificar se bate com opções padrão
        if (diffHours > 20 && diffHours < 28) {
          setValidityHours(24);
          setCustomDateRange(undefined);
        } else if (diffHours > 68 && diffHours < 76) {
          setValidityHours(72);
          setCustomDateRange(undefined);
        } else if (diffHours > 164 && diffHours < 172) {
          setValidityHours(168);
          setCustomDateRange(undefined);
        } else {
          // Data personalizada
          setValidityHours(-1);
          setCustomDateRange({ from: new Date(), to: expiresAt });
        }
      }

      // CC Emails
      if (existingProposal.cc_emails) {
        setCcEmails(existingProposal.cc_emails as string[]);
      } else {
        setCcEmails([]);
      }

      // Vendedor
      if (existingProposal.created_by) {
        setSelectedSellerId(existingProposal.created_by);
      }

      setDataLoaded(true);
      toast.success(`Proposta ${existingProposal.number} carregada para edição`);
    }
  }, [existingProposal, dataLoaded, buildings.length, editProposalId]);

  // Hooks para posições disponíveis e especificações de vídeo
  const { posicoesMap, isLoading: isLoadingPosicoes } = usePosicoesDisponiveis();
  const { specifications } = useVideoSpecifications();

  // Buscar usuário atual (incluindo telefone para EXA Alerts)
  const {
    data: currentUser
  } = useQuery({
    queryKey: ['current-user-with-phone'],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return null;
      const {
        data: userData
      } = await supabase.from('users').select('id, nome, email, telefone').eq('id', user.id).single();
      return userData;
    }
  });

  // Buscar todos os usuários administrativos para seletor de vendedor
  const {
    data: adminUsers = []
  } = useQuery({
    queryKey: ['admin-users-for-seller-select'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('users').select('id, nome, email, telefone').in('role', ['super_admin', 'admin', 'comercial', 'marketing', 'gerente']).order('nome');
      if (error) throw error;
      return data || [];
    }
  });

  // Estado para vendedor selecionado
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Atualizar selectedSellerId quando currentUser carregar
  React.useEffect(() => {
    if (currentUser?.id && !selectedSellerId) {
      setSelectedSellerId(currentUser.id);
    }
  }, [currentUser?.id]);

  // Vendedor selecionado (dados completos)
  const selectedSeller = useMemo(() => {
    if (!selectedSellerId) return currentUser;
    return adminUsers.find(u => u.id === selectedSellerId) || currentUser;
  }, [selectedSellerId, adminUsers, currentUser]);

  // 🔔 Adicionar vendedor automaticamente como destinatário de EXA Alerts
  React.useEffect(() => {
    if (currentUser?.telefone && alertRecipients.length === 0) {
      const sellerRecipient: AlertRecipient = {
        id: `seller_${currentUser.id}`,
        name: currentUser.nome || currentUser.email || 'Vendedor',
        phone: currentUser.telefone,
        phoneCountry: 'BR' as CountryCode,
        receiveWhatsapp: true,
        active: true
      };
      setAlertRecipients([sellerRecipient]);
      console.log('🔔 Vendedor adicionado automaticamente como destinatário EXA Alerts');
    }
  }, [currentUser]);

  // Toggle individual building
  const toggleBuilding = (id: string) => {
    setSelectedBuildings(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
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
  // Telas dos prédios selecionados atualmente
  const totalPanelsInstalled = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.quantidade_telas || (b as any).numero_elevadores || 0), 0);
  }, [selectedBuildingsData]);

  // Total de telas para cálculos - considera Venda Futura e telas manuais
  const totalPanels = useMemo(() => {
    if (vendaFutura && prediosContratados > 0) {
      // Venda Futura: usa telas manuais se definido, senão estimativa de 1.35 telas por prédio
      if (telasContratadas !== null && telasContratadas > 0) {
        return telasContratadas;
      }
      return Math.ceil(prediosContratados * 1.35);
    }
    return totalPanelsInstalled;
  }, [vendaFutura, prediosContratados, telasContratadas, totalPanelsInstalled]);
  const totalImpressions = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.visualizacoes_mes || 0), 0);
  }, [selectedBuildingsData]);
  const totalPublico = useMemo(() => {
    return selectedBuildingsData.reduce((sum, b) => sum + (b.publico_estimado || 0), 0);
  }, [selectedBuildingsData]);

  // Calcular máximo de posições disponíveis baseado nos prédios selecionados
  const maxPosicoes = useMemo(() => {
    const maxPorProduto = tipoProduto === 'vertical_premium' 
      ? (specifications?.vertical.maxClientesPainel ?? 3)
      : (specifications?.horizontal.maxClientesPainel ?? 15);
    
    if (!posicoesMap || selectedBuildings.length === 0) return maxPorProduto;
    
    // Calcular mínimo disponível entre todos os prédios selecionados
    const disponiveis = selectedBuildings
      .filter(id => !id.startsWith('manual_')) // Ignora prédios manuais
      .map(id => posicoesMap[id]?.disponiveis ?? maxPorProduto);
    
    return disponiveis.length > 0 ? Math.min(...disponiveis, maxPorProduto) : maxPorProduto;
  }, [posicoesMap, selectedBuildings, tipoProduto, specifications]);

  // Resetar quantidade de posições se exceder o máximo disponível
  React.useEffect(() => {
    if (quantidadePosicoes > maxPosicoes) {
      setQuantidadePosicoes(Math.max(1, maxPosicoes));
    }
  }, [maxPosicoes, quantidadePosicoes]);

  // Exibições mensais ajustadas pela quantidade de posições (movido para antes do auto-save)
  const totalImpressionsAdjusted = useMemo(() => {
    const exibicoesBase = specifications?.exibicoes.porMes ?? 11610;
    return exibicoesBase * quantidadePosicoes * totalPanels;
  }, [specifications, quantidadePosicoes, totalPanels]);

  // Auto-save de rascunho com debounce de 3 segundos
  useEffect(() => {
    // Só salva se tiver dados mínimos (nome do cliente) e não estiver em modo edição
    if (!clientData.firstName.trim() || isEditMode) return;
    
    const saveDraft = async () => {
      if (isSavingDraft) return;
      setIsSavingDraft(true);
      setDraftError(null);
      
      try {
        // FORMATO UNIFICADO: usar mesmo formato de selected_buildings do envio
        const buildingsDataForDraft = selectedBuildingsData.map(b => ({
          building_id: b.id,
          building_name: b.nome,
          bairro: b.bairro,
          endereco: b.endereco || '',
          quantidade_telas: b.quantidade_telas || (b as any).numero_elevadores || 0,
          visualizacoes_mes: b.visualizacoes_mes,
          preco_base: (b as any).preco_base || 0,
          publico_estimado: b.publico_estimado,
          is_manual: (b as any).is_manual || false
        }));

        // Valor mensal efetivo para o rascunho
        const fidelMonthlyDraft = parseFloat(fidelValue) || 0;
        const cashTotalDraft = modalidadeProposta === 'permuta' 
          ? 0 
          : fidelMonthlyDraft * durationMonths * (1 - discountPercent / 100);
        
        const draftData = {
          status: 'rascunho',
          // Cliente
          client_name: `${clientData.firstName} ${clientData.lastName}`.trim() || 'Rascunho',
          client_first_name: clientData.firstName || null,
          client_last_name: clientData.lastName || null,
          client_company_name: clientData.companyName || null,
          client_country: clientData.country || 'BR',
          client_cnpj: clientData.document || null,
          client_email: clientData.email || null,
          client_phone: clientData.phoneFullNumber || clientData.phone || null,
          client_address: clientData.address || null,
          client_latitude: clientData.latitude || null,
          client_longitude: clientData.longitude || null,
          // Prédios - formato consistente com envio
          selected_buildings: buildingsDataForDraft as Json,
          total_panels: totalPanels,
          total_impressions_month: totalImpressionsAdjusted,
          // Período e pagamento
          duration_months: isCustomDays ? 0 : durationMonths,
          fidel_monthly_value: modalidadeProposta === 'permuta' ? 0 : fidelMonthlyDraft,
          cash_total_value: modalidadeProposta === 'permuta' ? 0 : cashTotalDraft,
          discount_percent: discountPercent,
          payment_type: isCustomDays ? 'days' : isCustomPayment ? 'custom' : 'standard',
          is_custom_days: isCustomDays,
          custom_days: isCustomDays ? customDays : null,
          custom_installments: isCustomPayment ? customInstallments.map((p, idx) => ({
            installment: idx + 1,
            due_date: formatDateForInput(p.dueDate),
            amount: parseFloat(p.amount) || 0
          })) as Json : null,
          // Produto
          tipo_produto: tipoProduto,
          quantidade_posicoes: quantidadePosicoes,
          titulo: tituloProposta || null,
          // Permuta
          modalidade_proposta: modalidadeProposta,
          itens_permuta: modalidadeProposta === 'permuta' ? itensPermuta : [],
          valor_total_permuta: modalidadeProposta === 'permuta' ? valorTotalPermuta : 0,
          ocultar_valores_publico: modalidadeProposta === 'permuta' ? ocultarValoresPublico : false,
          descricao_contrapartida: modalidadeProposta === 'permuta' ? descricaoContrapartida : null,
          metodo_pagamento_alternativo: modalidadeProposta === 'permuta' ? 'permuta' : null,
          valor_referencia_monetaria: modalidadeProposta === 'permuta' ? valorReferenciaMonetaria : null,
          // Configurações adicionais
          cobranca_futura: cobrancaFutura,
          exigir_contrato: exigirContrato,
          venda_futura: vendaFutura,
          predios_contratados: vendaFutura ? prediosContratados : selectedBuildingsData.length,
          // Exclusividade
          exclusividade_segmento: oferecerExclusividade,
          segmento_exclusivo: oferecerExclusividade ? segmentoExclusivo : null,
          exclusividade_percentual: oferecerExclusividade ? exclusividadePercentual : null,
          // Travamento
          travamento_preco_ativo: travamentoPrecoAtivo,
          travamento_preco_valor: travamentoPrecoAtivo ? travamentoPrecoValor : null,
          travamento_telas_limite: travamentoPrecoAtivo ? travamentoTelasLimite : null,
          // Multa
          multa_rescisao_ativa: multaRescisaoAtiva,
          multa_rescisao_percentual: multaRescisaoAtiva ? multaRescisaoPercentual : null,
          // CC Emails
          cc_emails: ccEmails.length > 0 ? ccEmails : null,
          // Validade
          expires_at: validityHours === 0 ? null : validityHours === -1 && customDateRange?.to 
            ? customDateRange.to.toISOString() 
            : new Date(Date.now() + validityHours * 60 * 60 * 1000).toISOString(),
        };
        
        if (draftId) {
          // Atualizar rascunho existente
          const { error } = await supabase.from('proposals').update(draftData).eq('id', draftId);
          if (error) throw error;
        } else {
          // Criar novo rascunho
          const { data, error } = await supabase.from('proposals')
            .insert({ ...draftData, number: `RASCUNHO-${Date.now()}` })
            .select('id')
            .single();
          if (error) throw error;
          if (data) setDraftId(data.id);
        }
        
        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Erro ao salvar rascunho:', error);
        setDraftError('Erro ao salvar');
      } finally {
        setIsSavingDraft(false);
      }
    };
    
    const timeoutId = setTimeout(saveDraft, 3000);
    return () => clearTimeout(timeoutId);
  }, [
    clientData.firstName, clientData.lastName, clientData.companyName, 
    clientData.email, clientData.phoneFullNumber, clientData.phone,
    clientData.country, clientData.document, clientData.address,
    clientData.latitude, clientData.longitude,
    selectedBuildings, selectedBuildingsData, durationMonths, fidelValue, discountPercent,
    modalidadeProposta, itensPermuta, valorTotalPermuta, ocultarValoresPublico,
    descricaoContrapartida, metodoPagamentoAlternativo, valorReferenciaMonetaria, tituloProposta,
    quantidadePosicoes, tipoProduto, isCustomDays, customDays, isEditMode, draftId, isSavingDraft,
    totalPanels, totalImpressionsAdjusted, isCustomPayment, customInstallments,
    cobrancaFutura, exigirContrato, vendaFutura, prediosContratados,
    oferecerExclusividade, segmentoExclusivo, exclusividadePercentual,
    travamentoPrecoAtivo, travamentoPrecoValor, travamentoTelasLimite,
    multaRescisaoAtiva, multaRescisaoPercentual, ccEmails, validityHours, customDateRange
  ]);

  // Calcular preço para período em dias (< 30 dias = +10% acréscimo)
  const calculateDaysPrice = useMemo(() => {
    if (!isCustomDays || customDays <= 0) return 0;

    // Soma do preço base de todos os prédios selecionados
    const totalBasePrice = selectedBuildingsData.reduce((sum, b) => sum + (b.preco_base || 0), 0);

    // Preço por dia = (Preço mensal / 30) × 1.10 (10% acréscimo)
    const pricePerDay = totalBasePrice / 30 * 1.10;
    return pricePerDay * customDays;
  }, [isCustomDays, customDays, selectedBuildingsData]);

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
      visualizacoes_mes: newManualBuilding.visualizacoes_mes || 11610,
      // Manual v3.0
      preco_base: 0,
      publico_estimado: newManualBuilding.publico_estimado || 100,
      imagem_principal: null,
      is_manual: true
    };
    setManualBuildings(prev => [...prev, newBuilding]);
    setSelectedBuildings(prev => [...prev, newBuilding.id]);
    setAddBuildingDialogOpen(false);
    setNewManualBuilding({
      nome: '',
      endereco: '',
      quantidade_telas: 1,
      visualizacoes_mes: 11610,
      publico_estimado: 100
    });
    toast.success('Prédio manual adicionado com *');
  };

  // Handler para remover prédio manual
  const removeManualBuilding = (id: string) => {
    setManualBuildings(prev => prev.filter(b => b.id !== id));
    setSelectedBuildings(prev => prev.filter(bid => bid !== id));
  };

  // Valor sugerido baseado nos prédios selecionados e plano escolhido
  // Usa preços manuais (preco_trimestral, preco_semestral, preco_anual) quando disponíveis
  // Multiplicado pela quantidade de posições
  const valorSugeridoMensal = useMemo(() => {
    if (selectedBuildingsData.length === 0) return 0;

    // Converter durationMonths para PlanDuration válido
    const planDuration = ([1, 3, 6, 12].includes(durationMonths) ? durationMonths : 1) as PlanDuration;
    const result = calculateBuildingsPrice(selectedBuildingsData, planDuration);
    
    // Multiplicar pelo número de posições
    const valorAjustado = result.pricePerMonth * quantidadePosicoes;
    
    console.log("💰 [NovaPropostaPage] Valor sugerido mensal calculado:", {
      durationMonths,
      planDuration,
      pricePerMonth: result.pricePerMonth,
      quantidadePosicoes,
      valorAjustado,
      hasAnyManualPrice: result.hasAnyManualPrice
    });
    return valorAjustado;
  }, [selectedBuildingsData, durationMonths, quantidadePosicoes]);

  // Cálculos de valores
  const fidelMonthly = parseFloat(fidelValue) || 0;
  const fidelTotal = fidelMonthly * durationMonths;
  const cashTotal = overwriteCashValue ? parseFloat(cashValue) || 0 : fidelTotal * (1 - discountPercent / 100);

  // Valor mensal efetivo para cálculo do travamento (considera pagamento customizado)
  const valorMensalEfetivo = useMemo(() => {
    if (isCustomPayment && customTotal > 0 && customDurationMonths > 0) {
      // Pagamento customizado: divide total das parcelas pelo número de meses
      return customTotal / customDurationMonths;
    }
    // Padrão: valor fidelidade mensal
    return fidelMonthly;
  }, [isCustomPayment, customTotal, customDurationMonths, fidelMonthly]);

  // Cálculo do valor extra de exclusividade
  const exclusividadeValorCalculado = useMemo(() => {
    if (!oferecerExclusividade) return 0;
    if (exclusividadeValorExtra !== null) return exclusividadeValorExtra;
    
    const valorBase = isCustomPayment ? customTotal : cashTotal;
    return (valorBase * exclusividadePercentual) / 100;
  }, [oferecerExclusividade, exclusividadePercentual, cashTotal, customTotal, exclusividadeValorExtra, isCustomPayment]);

  // Função para verificar disponibilidade de exclusividade
  const verificarDisponibilidadeExclusividade = async () => {
    if (!segmentoExclusivo || selectedBuildings.length === 0) {
      toast.error('Selecione um segmento e ao menos um prédio');
      return;
    }

    setVerificandoExclusividade(true);
    
    try {
      // Calcular período da proposta
      const startDate = new Date();
      const endDate = addMonths(startDate, durationMonths || 12);
      
      // Filtrar apenas prédios reais (não manuais)
      const realBuildingIds = selectedBuildings.filter(id => !id.startsWith('manual_'));
      
      if (realBuildingIds.length === 0) {
        setExclusividadeDisponivel(true);
        toast.success('Exclusividade disponível! (Prédios manuais não têm restrição)');
        setVerificandoExclusividade(false);
        return;
      }

      // Consultar exclusividades ativas que conflitam
      const { data: conflitos, error } = await supabase
        .from('exclusividades_segmento')
        .select('*, buildings:building_id(nome)')
        .eq('segmento', segmentoExclusivo)
        .eq('ativo', true)
        .in('building_id', realBuildingIds)
        .gte('data_fim', startDate.toISOString().split('T')[0])
        .lte('data_inicio', endDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Erro ao verificar exclusividade:', error);
        toast.error('Erro ao verificar disponibilidade');
        setVerificandoExclusividade(false);
        return;
      }

      if (conflitos && conflitos.length > 0) {
        setExclusividadeDisponivel(false);
        const prediosConflito = conflitos.map((c: any) => c.buildings?.nome || 'Prédio').join(', ');
        toast.error(`Exclusividade INDISPONÍVEL. Conflito em: ${prediosConflito}`);
      } else {
        setExclusividadeDisponivel(true);
        toast.success('Exclusividade DISPONÍVEL para todos os prédios selecionados!');
      }
    } catch (err) {
      console.error('Erro ao verificar exclusividade:', err);
      toast.error('Erro ao verificar disponibilidade');
    } finally {
      setVerificandoExclusividade(false);
    }
  };

  // Função para copiar texto completo da proposta para validação
  const handleCopyProposalText = () => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatNumber = (value: number) => {
      return new Intl.NumberFormat('pt-BR').format(value);
    };

    const formatDate = (date: Date) => {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    // Construir texto completo
    let text = `═══════════════════════════════════════════════════
           PROPOSTA EXA - VALIDAÇÃO COMPLETA
═══════════════════════════════════════════════════

`;

    // DADOS DO CLIENTE
    text += `📋 DADOS DO CLIENTE
────────────────────────────────────────────────────
• Nome: ${clientData.firstName} ${clientData.lastName}
• Empresa: ${clientData.companyName || '(não informado)'}
• País: ${clientData.country === 'BR' ? 'Brasil' : clientData.country === 'AR' ? 'Argentina' : 'Paraguai'}
• ${getDocumentLabel()}: ${clientData.document || '(não informado)'}
• Telefone: ${clientData.phone || '(não informado)'}
• E-mail: ${clientData.email || '(não informado)'}
• Endereço: ${clientData.address || '(não informado)'}

`;

    // PRÉDIOS SELECIONADOS
    text += `🏢 PRÉDIOS SELECIONADOS (${selectedBuildingsData.length} prédios)
────────────────────────────────────────────────────
`;
    selectedBuildingsData.forEach((b, index) => {
      const isManual = (b as any).is_manual;
      text += `${index + 1}. ${b.nome}${isManual ? ' *' : ''}
   • Bairro: ${(b as any).bairro || 'N/A'}
   • Telas: ${b.quantidade_telas || 0}
   • Exibições/mês: ${formatNumber(b.visualizacoes_mes || 0)}
`;
    });

    text += `
TOTAIS:
• Total de Telas: ${totalPanels}
• Exibições Mensais: ${formatNumber(totalImpressionsAdjusted)}
• Público Estimado: ${formatNumber(totalPublico)} pessoas
${selectedBuildingsData.some((b: any) => b.is_manual) ? '\n* = Prédio adicionado manualmente' : ''}

`;

    // PRODUTO
    text += `📦 PRODUTO
────────────────────────────────────────────────────
• Tipo: ${tipoProduto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal'}
• Posições (Marcas): ${quantidadePosicoes}

`;

    // PERÍODO
    text += `⏱️ PERÍODO
────────────────────────────────────────────────────
`;
    if (isCustomDays) {
      text += `• Tipo: Período em Dias
• Duração: ${customDays} dias
`;
    } else if (isCustomPayment) {
      text += `• Tipo: Pagamento Personalizado
• Duração: ${customDurationMonths} meses
• Número de Parcelas: ${customInstallments.length}
`;
    } else {
      text += `• Tipo: Padrão
• Duração: ${durationMonths} meses
`;
    }

    // PAGAMENTO (monetário ou permuta)
    if (modalidadeProposta === 'permuta') {
      text += `
💱 PERMUTA
────────────────────────────────────────────────────
• Modalidade: Permuta (não-monetária)
`;

      // Se é venda futura + permuta, mostrar números projetados
      if (vendaFutura && prediosContratados > 0) {
        const telasProjetadas = telasContratadas !== null ? telasContratadas : Math.ceil(prediosContratados * 1.35);
        const exibicoesProjetadas = telasProjetadas * 11610;
        text += `
📊 MÉTRICAS DE VENDA FUTURA (Projetado)
• Prédios Contratados: ${prediosContratados}
• Telas Projetadas: ${telasProjetadas}
• Exibições Projetadas/mês: ${formatNumber(exibicoesProjetadas)}
`;
      }
      
      // Mostrar valor de referência monetária (quanto custaria em dinheiro)
      if (valorReferenciaMonetaria > 0) {
        const totalReferencia = isCustomDays 
          ? (valorReferenciaMonetaria / 30) * customDays 
          : valorReferenciaMonetaria * durationMonths;
        text += `
💰 VALOR DE REFERÊNCIA (Quanto Custaria em Dinheiro)
• Valor Mensal: ${formatCurrency(valorReferenciaMonetaria)}
• Total (${isCustomDays ? customDays + ' dias' : durationMonths + ' meses'}): ${formatCurrency(totalReferencia)}
`;
      }
      
      text += `
📦 CONTRAPARTIDA (Equipamentos/Serviços)
• Ocultar valores no público: ${ocultarValoresPublico ? 'Sim' : 'Não'}
• Descrição: ${descricaoContrapartida || '(não informada)'}

Itens de Permuta:
`;
      itensPermuta.forEach((item, index) => {
        text += `${index + 1}. ${item.nome} (Qtd: ${item.quantidade})${!item.ocultar_preco ? ` - ${formatCurrency(item.preco_unitario)} cada = ${formatCurrency(item.preco_total)}` : ''}
`;
      });
      text += `
Valor Total Permuta: ${formatCurrency(valorTotalPermuta)}

`;
    } else {
      text += `
💰 PAGAMENTO (MONETÁRIO)
────────────────────────────────────────────────────
• Valor Mensal (Fidelidade): ${formatCurrency(fidelMonthly)}
• Valor Sugerido (base): ${formatCurrency(valorSugeridoMensal)}/mês
`;
      if (isCustomPayment) {
        text += `• Pagamento Personalizado: Sim
• Total das Parcelas: ${formatCurrency(customTotal)}

Parcelas:
`;
        customInstallments.forEach((p, index) => {
          text += `  ${index + 1}. ${format(new Date(p.dueDate), 'dd/MM/yyyy')} - ${formatCurrency(parseFloat(p.amount) || 0)}
`;
        });
      } else if (isCustomDays) {
        text += `• Valor Total (${customDays} dias): ${formatCurrency(calculateDaysPrice)}
`;
      } else {
        text += `• Desconto à Vista (PIX): ${discountPercent}%
• Total à Vista: ${formatCurrency(cashTotal)}
• Total Fidelidade (${durationMonths}x): ${formatCurrency(fidelTotal)}
`;
      }
      text += `
`;
    }

    // CONDIÇÕES COMERCIAIS
    text += `📊 CONDIÇÕES COMERCIAIS
────────────────────────────────────────────────────
`;

    // Venda Futura
    if (vendaFutura) {
      text += `🚀 Venda Futura: ATIVO
   • Prédios Contratados: ${prediosContratados}
   • Telas Estimadas: ${telasContratadas !== null ? telasContratadas : Math.ceil(prediosContratados * 1.35)}
   • Prédios Instalados Atualmente: ${buildings.length}
   • Prédios Pendentes: ${Math.max(0, prediosContratados - buildings.length)}

`;
    } else {
      text += `🚀 Venda Futura: INATIVO

`;
    }

    // Exclusividade de Segmento
    if (oferecerExclusividade) {
      text += `🔒 Exclusividade de Segmento: ATIVO
   • Segmento: ${segmentoExclusivo}
   • Acréscimo: ${exclusividadePercentual}%
   • Valor Extra: ${formatCurrency(exclusividadeValorCalculado)}
   • Disponibilidade Verificada: ${exclusividadeDisponivel === null ? 'Não verificado' : exclusividadeDisponivel ? 'Disponível' : 'Indisponível'}

`;
    } else {
      text += `🔒 Exclusividade de Segmento: INATIVO

`;
    }

    // Travamento de Preço
    if (travamentoPrecoAtivo) {
      const precoPorTela = travamentoModoCalculo === 'automatico' 
        ? (totalPanels > 0 ? valorMensalEfetivo / totalPanels : 0)
        : travamentoPrecoManual;
      text += `📌 Travamento de Preço: ATIVO
   • Modo de Cálculo: ${travamentoModoCalculo === 'automatico' ? 'Automático' : 'Manual'}
   • Valor por Tela: ${formatCurrency(precoPorTela)}
   • Limite de Telas: ${travamentoTelasLimite}
   • Telas Atuais: ${totalPanels}

`;
    } else {
      text += `📌 Travamento de Preço: INATIVO

`;
    }

    // Multa de Rescisão
    if (multaRescisaoAtiva) {
      text += `⚖️ Multa de Rescisão: ATIVO
   • Percentual: ${multaRescisaoPercentual}%

`;
    } else {
      text += `⚖️ Multa de Rescisão: INATIVO

`;
    }

    // VALIDADE
    text += `⏳ VALIDADE
────────────────────────────────────────────────────
`;
    if (validityHours === 0) {
      text += `• Prazo: Indeterminada
`;
    } else if (validityHours === -1 && customDateRange?.to) {
      text += `• Prazo: Personalizado
• Expira em: ${formatDate(customDateRange.to)}
`;
    } else {
      const expiresAt = new Date(Date.now() + validityHours * 60 * 60 * 1000);
      text += `• Prazo: ${validityHours} horas
• Expira em: ${formatDate(expiresAt)}
`;
    }

    text += `
`;

    // CONFIGURAÇÕES ADICIONAIS
    text += `📝 CONFIGURAÇÕES ADICIONAIS
────────────────────────────────────────────────────
• Título da Proposta: ${tituloProposta || '(sem título)'}
• Exigir Contrato: ${exigirContrato ? 'Sim' : 'Não'}
• Cobrança Futura: ${cobrancaFutura ? 'Sim' : 'Não'}
• E-mails em Cópia (CC): ${ccEmails.length > 0 ? ccEmails.join(', ') : '(nenhum)'}

`;

    // VENDEDOR
    text += `👤 VENDEDOR
────────────────────────────────────────────────────
• Nome: ${selectedSeller?.nome || selectedSeller?.email || 'Não selecionado'}
• E-mail: ${selectedSeller?.email || '(não informado)'}
• Telefone: ${selectedSeller?.telefone || '(não informado)'}

`;

    // RODAPÉ
    text += `═══════════════════════════════════════════════════
      Gerado em: ${formatDate(new Date())}
═══════════════════════════════════════════════════`;

    // Copiar para clipboard
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Texto completo da proposta copiado!');
    }).catch(() => {
      toast.error('Erro ao copiar texto');
    });
  };

  // Mutation para salvar proposta (criar ou atualizar)
  const createProposalMutation = useMutation({
    mutationFn: async (sendOptions: {
      whatsapp: boolean;
      email: boolean;
      onlyLink?: boolean;
    }) => {
      // GUARD: Em modo edição, impedir salvamento se dados ainda não carregaram
      if (isEditMode && (!dataLoaded || isLoadingProposal || !existingProposal)) {
        throw new Error('Aguarde o carregamento completo da proposta antes de salvar');
      }
      
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
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
      
      const fullName = `${clientData.firstName.trim()} ${clientData.lastName.trim()}`;
      
      // Dados comuns para criar ou atualizar
      const proposalData = {
        client_name: fullName,
        client_first_name: clientData.firstName.trim(),
        client_last_name: clientData.lastName.trim(),
        client_company_name: clientData.companyName || null,
        client_country: clientData.country || 'BR',
        client_cnpj: clientData.document || null,
        client_phone: clientData.phoneFullNumber || clientData.phone || null,
        client_email: clientData.email || null,
        selected_buildings: buildingsData as Json,
        total_panels: totalPanels,
        total_impressions_month: totalImpressionsAdjusted,
        quantidade_posicoes: quantidadePosicoes,
        fidel_monthly_value: isCustomDays ? calculateDaysPrice : isCustomPayment ? customTotal / customInstallments.length : fidelMonthly,
        cash_total_value: isCustomDays ? calculateDaysPrice : isCustomPayment ? customTotal : cashTotal,
        discount_percent: isCustomDays ? -10 : discountPercent,
        duration_months: isCustomDays ? 0 : durationMonths,
        created_by: selectedSellerId || user?.id,
        seller_name: selectedSeller?.nome || currentUser?.nome || selectedSeller?.email || 'Vendedor',
        seller_phone: selectedSeller?.telefone || currentUser?.telefone || null,
        seller_email: selectedSeller?.email || currentUser?.email || null,
        payment_type: isCustomDays ? 'days' : isCustomPayment ? 'custom' : 'standard',
        tipo_produto: tipoProduto,
        client_address: clientData.address || null,
        client_latitude: clientData.latitude || null,
        client_longitude: clientData.longitude || null,
        custom_installments: isCustomPayment ? customInstallments.map((p, idx) => ({
          installment: idx + 1,
          due_date: formatDateForInput(p.dueDate),
          amount: parseFloat(p.amount) || 0
        })) as Json : null,
        cobranca_futura: cobrancaFutura,
        data_inicio_cobranca: null,
        exigir_contrato: exigirContrato,
        custom_days: isCustomDays ? customDays : null,
        is_custom_days: isCustomDays,
        cc_emails: ccEmails.length > 0 ? ccEmails : null,
        venda_futura: vendaFutura,
        predios_contratados: vendaFutura ? prediosContratados : selectedBuildingsData.length,
        predios_instalados_no_fechamento: vendaFutura ? buildings.length : selectedBuildingsData.length,
        predios_pendentes: vendaFutura ? Math.max(0, prediosContratados - buildings.length) : 0,
        cortesia_inicio: vendaFutura && prediosContratados > buildings.length ? new Date().toISOString().split('T')[0] : null,
        meses_cortesia: 0,
        titulo: tituloProposta.trim() || null,
        exclusividade_segmento: oferecerExclusividade,
        segmento_exclusivo: oferecerExclusividade ? segmentoExclusivo : null,
        exclusividade_percentual: oferecerExclusividade ? exclusividadePercentual : null,
        exclusividade_valor_extra: oferecerExclusividade ? exclusividadeValorCalculado : null,
        exclusividade_disponivel: exclusividadeDisponivel ?? true,
        cliente_escolheu_exclusividade: null,
        travamento_preco_ativo: travamentoPrecoAtivo,
        travamento_preco_valor: travamentoPrecoAtivo ? travamentoPrecoValor : null,
        travamento_telas_atuais: travamentoPrecoAtivo ? totalPanels : null,
        travamento_telas_limite: travamentoPrecoAtivo ? travamentoTelasLimite : null,
        travamento_preco_por_tela: travamentoPrecoAtivo && totalPanels > 0 
          ? (travamentoModoCalculo === 'automatico' ? valorMensalEfetivo / totalPanels : travamentoPrecoManual)
          : null,
        travamento_modo_calculo: travamentoPrecoAtivo ? travamentoModoCalculo : null,
        multa_rescisao_ativa: multaRescisaoAtiva,
        multa_rescisao_percentual: multaRescisaoAtiva ? multaRescisaoPercentual : null,
        // Campos de Permuta (proposta não-monetária)
        modalidade_proposta: modalidadeProposta,
        itens_permuta: modalidadeProposta === 'permuta' ? itensPermuta : [],
        valor_total_permuta: modalidadeProposta === 'permuta' ? valorTotalPermuta : 0,
        ocultar_valores_publico: modalidadeProposta === 'permuta' ? ocultarValoresPublico : false,
        descricao_contrapartida: modalidadeProposta === 'permuta' ? descricaoContrapartida : null,
        metodo_pagamento_alternativo: modalidadeProposta === 'permuta' ? 'permuta' : null,
        valor_referencia_monetaria: modalidadeProposta === 'permuta' ? valorReferenciaMonetaria : null,
        // Logo do Cliente (processada por IA)
        client_logo_url: clientLogoUrl,
        // Validade da proposta - funciona tanto na criação quanto na edição
        expires_at: validityHours === 0 ? null : validityHours === -1 && customDateRange?.to ? customDateRange.to.toISOString() : new Date(Date.now() + validityHours * 60 * 60 * 1000).toISOString(),
      };

      let proposal;
      
      if (isEditMode && editProposalId) {
        // MODO EDIÇÃO - Atualizar proposta existente
        const { data, error } = await supabase
          .from('proposals')
          .update(proposalData)
          .eq('id', editProposalId)
          .select()
          .single();
        if (error) throw error;
        proposal = data;
        
        // Log de edição
        await supabase.from('proposal_logs').insert({
          proposal_id: proposal.id,
          action: 'editada',
          details: {
            edited_by: user?.id,
            buildings_count: selectedBuildings.length
          }
        });
        
        toast.success(`Proposta ${proposal.number} atualizada com sucesso!`);
      } else {
        // MODO CRIAÇÃO - Criar nova proposta
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const proposalNumber = `EXA-${year}-${randomNum}`;
        
        const { data, error } = await supabase.from('proposals').insert([{
          ...proposalData,
          number: proposalNumber,
          status: 'enviada',
          sent_at: new Date().toISOString(),
        }]).select().single();
        if (error) throw error;
        proposal = data;
        
        // 📇 CRIAR CONTATO AUTOMATICAMENTE NO CRM
        // Garante que todos os leads de propostas vão para a tabela contacts
        try {
          const contactResult = await createContactFromProposal({
            clientName: fullName,
            clientFirstName: clientData.firstName.trim(),
            clientLastName: clientData.lastName.trim(),
            clientCompanyName: clientData.companyName || undefined,
            clientCnpj: clientData.document || undefined,
            clientPhone: clientData.phoneFullNumber || clientData.phone || undefined,
            clientEmail: clientData.email || undefined,
            clientAddress: clientData.address || undefined,
            createdBy: selectedSellerId || user?.id
          });
          if (contactResult.success) {
            console.log(`📇 Contato ${contactResult.isNew ? 'criado' : 'atualizado'} automaticamente:`, contactResult.contactId);
          } else {
            console.warn('⚠️ Não foi possível criar contato:', contactResult.error);
          }
        } catch (contactErr) {
          console.error('⚠️ Erro ao criar contato (não crítico):', contactErr);
        }

        // Log de criação
        await supabase.from('proposal_logs').insert({
          proposal_id: proposal.id,
          action: 'criada',
          details: {
            send_whatsapp: sendOptions.whatsapp,
            send_email: sendOptions.email,
            buildings_count: selectedBuildings.length,
            alert_recipients_count: alertRecipients.length
          }
        });
      }

      // Salvar destinatários de notificações EXA Alerts (apenas para novas propostas)
      if (!isEditMode && alertRecipients.length > 0) {
        const recipientsToInsert = alertRecipients.map(r => ({
          proposal_id: proposal.id,
          name: r.name,
          phone: r.phone,
          receive_whatsapp: r.receiveWhatsapp,
          active: r.active
        }));
        await supabase.from('proposal_alert_recipients').insert(recipientsToInsert);
        console.log(`✅ ${recipientsToInsert.length} destinatários de alertas salvos`);
      }
      if (sendOptions.whatsapp && clientData.phone) {
        try {
          const {
            error: whatsappError
          } = await supabase.functions.invoke('send-proposal-whatsapp', {
            body: {
              proposalId: proposal.id
            }
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
          const {
            error: emailError
          } = await supabase.functions.invoke('send-proposal-email', {
            body: {
              proposalId: proposal.id
            }
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

      // 🔔 Notificar via EXA Alerts que proposta foi enviada
      if (alertRecipients.length > 0) {
        try {
          await supabase.functions.invoke('notify-proposal-event', {
            body: {
              proposalId: proposal.id,
              eventType: 'proposal_sent'
            }
          });
          console.log('🔔 Notificação EXA Alerts enviada (proposal_sent)');
        } catch (err) {
          console.error('⚠️ Erro ao enviar notificação EXA Alerts:', err);
        }
      }
      return {
        proposal,
        onlyLink: sendOptions.onlyLink
      };
    },
    onSuccess: result => {
      const {
        proposal,
        onlyLink
      } = result;

      // Salvar dados do cliente no histórico de autocomplete
      saveAutocomplete({
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        companyName: clientData.companyName,
        cnpj: clientData.document,
        email: clientData.email,
        phone: clientData.phoneFullNumber || clientData.phone,
        address: clientData.address
      });
      queryClient.invalidateQueries({
        queryKey: ['proposals']
      });
      if (onlyLink) {
        // Copiar link para clipboard
        const proposalUrl = `${window.location.origin}/proposta/${proposal.id}`;
        navigator.clipboard.writeText(proposalUrl).then(() => {
          toast.success(`Proposta ${proposal.number} criada! Link copiado para área de transferência.`);
        }).catch(() => {
          toast.success(`Proposta ${proposal.number} criada! URL: ${proposalUrl}`);
        });
      } else {
        toast.success(`Proposta ${proposal.number} criada e enviada!`);
      }
      setSendDialogOpen(false);
      navigate(buildPath('propostas'));
    },
    onError: error => {
      console.error('Erro ao criar proposta:', error);
      toast.error('Erro ao criar proposta. Tente novamente.');
    }
  });
  const handleOpenSendDialog = () => {
    // GUARD: Em modo edição, verificar se dados carregaram completamente
    if (isEditMode && (!dataLoaded || isLoadingProposal)) {
      toast.error('Aguarde o carregamento completo da proposta');
      return;
    }
    
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
    } else if (modalidadeProposta === 'permuta') {
      // Validação específica para Permuta
      if (itensPermuta.length === 0) {
        toast.error('Adicione ao menos um item de permuta');
        return;
      }
    } else {
      // Monetária padrão
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

  // Handlers para seleção mutuamente exclusiva de "Apenas Gerar Link"
  const handleOnlyLinkChange = (checked: boolean) => {
    if (checked) {
      setSendViaWhatsApp(false);
      setSendViaEmail(false);
    }
    setOnlyGenerateLink(checked);
  };
  const handleWhatsAppChange = (checked: boolean) => {
    if (checked && onlyGenerateLink) {
      setOnlyGenerateLink(false);
    }
    setSendViaWhatsApp(checked);
  };
  const handleEmailChange = (checked: boolean) => {
    if (checked && onlyGenerateLink) {
      setOnlyGenerateLink(false);
    }
    setSendViaEmail(checked);
  };
  const handleSendProposal = () => {
    if (!sendViaWhatsApp && !sendViaEmail && !onlyGenerateLink) {
      toast.error('Selecione ao menos uma forma de envio');
      return;
    }
    if (onlyGenerateLink) {
      // Apenas gerar link, sem notificações
      createProposalMutation.mutate({
        whatsapp: false,
        email: false,
        onlyLink: true
      });
    } else {
      // REGRA: Se email está selecionado, SEMPRE enviar também por WhatsApp (se tiver telefone)
      const shouldSendWhatsApp = sendViaWhatsApp || sendViaEmail && !!clientData.phone;
      createProposalMutation.mutate({
        whatsapp: shouldSendWhatsApp,
        email: sendViaEmail
      });
    }
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
      const {
        data,
        error
      } = await supabase.functions.invoke('request-cortesia-code', {
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
      const {
        data,
        error
      } = await supabase.functions.invoke('validate-cortesia-code', {
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
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(buildPath('propostas'))} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{isEditMode ? 'Editar Proposta' : 'Nova Proposta'}</h1>
            <p className="text-xs text-muted-foreground">{isEditMode ? `Editando ${existingProposal?.number || ''}` : 'Preencha os dados do cliente'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Seção 0: Vendedor */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Vendedor Responsável</h2>
          </div>
          <Select value={selectedSellerId || ''} onValueChange={value => setSelectedSellerId(value)}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Selecione o vendedor">
                {selectedSeller?.nome || selectedSeller?.email || 'Selecionar vendedor'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {adminUsers.map(user => <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{user.nome || user.email}</span>
                    {user.id === currentUser?.id && <Badge variant="secondary" className="ml-2 text-[10px]">Você</Badge>}
                  </div>
                </SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            O vendedor receberá todas as notificações desta proposta
          </p>
        </Card>

        {/* Seção 1: Dados do Cliente */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50 overflow-visible relative z-40">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Dados do Cliente</h2>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <AutocompleteInput fieldType="client_name" placeholder="Primeiro nome" value={clientData.firstName} onChange={value => setClientData(prev => ({
                ...prev,
                firstName: value
              }))} onSelectSuggestion={entry => {
                const meta = entry.metadata || {};
                setClientData(prev => ({
                  ...prev,
                  firstName: meta.firstName || entry.field_value.split(' ')[0] || prev.firstName,
                  lastName: meta.lastName || entry.field_value.split(' ').slice(1).join(' ') || prev.lastName,
                  companyName: meta.companyName || prev.companyName,
                  document: meta.cnpj || prev.document,
                  email: meta.email || prev.email,
                  phone: meta.phone || prev.phone,
                  address: meta.address || prev.address
                }));
              }} className="mt-1 h-12 text-base" />
              </div>
              <div>
                <Label className="text-xs">Sobrenome *</Label>
                <Input placeholder="Sobrenome" value={clientData.lastName} onChange={e => setClientData(prev => ({
                ...prev,
                lastName: e.target.value
              }))} className="mt-1 h-12 text-base" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Nome da Empresa *</Label>
              <AutocompleteInput fieldType="company_name" placeholder="Razão Social ou Nome Fantasia" value={clientData.companyName} onChange={value => setClientData(prev => ({
              ...prev,
              companyName: value
            }))} onSelectSuggestion={entry => {
              const meta = entry.metadata || {};
              setClientData(prev => ({
                ...prev,
                firstName: meta.firstName || prev.firstName,
                lastName: meta.lastName || prev.lastName,
                companyName: entry.field_value,
                document: meta.cnpj || prev.document,
                email: meta.email || prev.email,
                phone: meta.phone || prev.phone,
                address: meta.address || prev.address
              }));
            }} className="mt-1 h-12 text-base" />
            </div>
            <div>
              <Label className="text-xs">País da Empresa</Label>
              <Select value={clientData.country} onValueChange={(value: 'BR' | 'AR' | 'PY') => {
              setClientData(prev => ({
                ...prev,
                country: value,
                document: ''
              }));
            }}>
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
              <div className="flex gap-2 mt-1">
                <Input placeholder={getDocumentPlaceholder()} value={clientData.document} onChange={e => {
                const formatted = formatCompanyDocument(e.target.value, clientData.country);
                setClientData(prev => ({
                  ...prev,
                  document: formatted
                }));
              }} maxLength={getDocumentMaxLength()} className={`h-12 text-base flex-1 ${!isDocumentValid() ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-500' : ''}`} />
                {clientData.country === 'BR' && <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0" disabled={isLoadingCNPJ || clientData.document.replace(/\D/g, '').length !== 14} onClick={async () => {
                const data = await consultCNPJ(clientData.document);
                if (data) {
                  setClientData(prev => ({
                    ...prev,
                    companyName: data.razaoSocial || prev.companyName,
                    address: data.endereco || prev.address,
                    email: data.email || prev.email,
                    phone: data.telefone || prev.phone
                  }));
                }
              }} title="Consultar CNPJ">
                    {isLoadingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>}
              </div>
              {!isDocumentValid() && <p className="text-xs text-red-500 mt-1">{getDocumentLabel()} inválido</p>}
            </div>
            <PhoneInput value={clientData.phone} onChange={(formatted, fullNumber, countryCode) => setClientData(prev => ({
            ...prev,
            phone: formatted,
            phoneFullNumber: fullNumber,
            phoneCountry: countryCode
          }))} defaultCountry={clientData.country as CountryCode} label="Telefone WhatsApp" showLabel={true} compact={false} />
            <div>
              <Label className="text-xs">E-mail *</Label>
              <AutocompleteInput fieldType="email" placeholder="email@empresa.com" value={clientData.email} onChange={value => setClientData(prev => ({
              ...prev,
              email: value
            }))} onSelectSuggestion={entry => {
              const meta = entry.metadata || {};
              setClientData(prev => ({
                ...prev,
                firstName: meta.firstName || prev.firstName,
                lastName: meta.lastName || prev.lastName,
                companyName: meta.companyName || prev.companyName,
                document: meta.cnpj || prev.document,
                email: entry.field_value,
                phone: meta.phone || prev.phone,
                address: meta.address || prev.address
              }));
            }} className="mt-1 h-12 text-base" />
            </div>
            
            {/* Campo de E-mails de Cópia (CC) */}
            <div className="md:col-span-2">
              <CCEmailsInput value={ccEmails} onChange={setCcEmails} label="E-mails de Cópia (CC)" placeholder="email@empresa.com" maxEmails={5} />
            </div>
            
            {/* Campo de Endereço - Condicional por país */}
            <div className="md:col-span-2 relative z-50">
              <Label className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Endereço da Empresa
              </Label>
              {clientData.country === 'BR' ? <AddressAutocomplete value={clientData.address} onChange={value => setClientData(prev => ({
              ...prev,
              address: value
            }))} onPlaceSelect={place => {
              setClientData(prev => ({
                ...prev,
                address: place.address,
                latitude: place.coordinates.lat,
                longitude: place.coordinates.lng
              }));
            }} placeholder="Digite o endereço da empresa..." className="mt-1 h-12 text-base" /> : <Input value={clientData.address} onChange={e => setClientData(prev => ({
              ...prev,
              address: e.target.value,
              latitude: null,
              longitude: null
            }))} placeholder="Digite o endereço completo da empresa..." className="mt-1 h-12 text-base" />}
            </div>

            {/* Upload de Logo do Cliente */}
            <div className="md:col-span-2 mt-3">
              <Label className="text-xs flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />
                Logo do Cliente (opcional)
              </Label>
              
              {clientLogoUrl ? (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-800 flex items-center justify-center">
                    <img 
                      src={clientLogoUrl} 
                      alt="Logo do cliente" 
                      className="w-full h-full object-contain p-1 filter brightness-0 invert"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowLogoUploadModal(true)}
                    >
                      Trocar
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setClientLogoUrl(null)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLogoUploadModal(true)}
                  className="mt-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors text-center"
                >
                  <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <span className="text-sm text-slate-500">Adicionar logo</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    PNG até 5MB - A IA remove fundo e otimiza automaticamente
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Título da Proposta (Opcional) */}
          <div className="md:col-span-2 mt-2">
            <Label className="text-xs flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Título da Proposta (opcional)
            </Label>
            <Input
              placeholder="Ex: Campanha Black Friday 2026, Parceria Institucional..."
              value={tituloProposta}
              onChange={(e) => setTituloProposta(e.target.value)}
              maxLength={100}
              className="mt-1 h-10 text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Se preenchido, aparece em destaque no topo da proposta para o cliente
            </p>
          </div>
        </Card>

        {/* Seção 1.5: Notificações EXA Alert */}
        <ProposalAlertRecipients recipients={alertRecipients} onRecipientsChange={setAlertRecipients} className="relative z-40" />

        {/* Seção 2: Seleção de Prédios */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50 relative z-30">
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
            <button onClick={handleVerticalPremiumToggle} className={`w-full p-3 rounded-lg border-2 transition-all ${tipoProduto === 'vertical_premium' ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100' : 'border-dashed border-purple-200 hover:border-purple-300 bg-white'}`}>
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
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tipoProduto === 'vertical_premium' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                  {tipoProduto === 'vertical_premium' && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
              </div>
              {tipoProduto === 'vertical_premium' && <div className="mt-2 text-[10px] text-purple-600 bg-purple-100/50 rounded p-2">
                  ✓ Vídeo vertical 15s • ✓ Tela cheia 9:16 • ✓ {buildings.length} prédios incluídos • ✓ Sem portal
                </div>}
            </button>
          </div>

          {/* Botões Selecionar Todos / Limpar */}
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={selectAll} disabled={isLoadingBuildings || selectedBuildings.length === buildings.length || tipoProduto === 'vertical_premium'} className="text-xs h-8">
              <CheckCircle className="h-3 w-3 mr-1" />
              Selecionar Todos ({buildings.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedBuildings.length === 0 || tipoProduto === 'vertical_premium'} className="text-xs h-8">
              Limpar Seleção
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAddBuildingDialogOpen(true)} className="text-xs h-8 border-dashed border-amber-400 text-amber-600 hover:bg-amber-50">
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Prédio*
            </Button>
          </div>

          {/* Lista de Prédios */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {isLoadingBuildings ? Array.from({
            length: 5
          }).map((_, i) => <div key={i} className="p-3 rounded-lg border border-gray-100">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>) : buildings.length === 0 && manualBuildings.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum prédio ativo encontrado
              </div> : <>
                {/* Prédios Manuais (aparecem primeiro com destaque) */}
                {manualBuildings.map(building => <div key={building.id} onClick={() => toggleBuilding(building.id)} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedBuildings.includes(building.id) ? 'border-amber-400 bg-amber-50' : 'border-amber-200 hover:border-amber-300 bg-amber-50/50'}`}>
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
                        <Button variant="ghost" size="sm" onClick={e => {
                    e.stopPropagation();
                    removeManualBuilding(building.id);
                  }} className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <X className="h-3 w-3" />
                        </Button>
                        <Checkbox checked={selectedBuildings.includes(building.id)} onCheckedChange={() => toggleBuilding(building.id)} className="mt-1" />
                      </div>
                    </div>
                  </div>)}

                {/* Prédios do Banco de Dados */}
                {buildings.map(building => <div key={building.id} onClick={() => toggleBuilding(building.id)} className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedBuildings.includes(building.id) ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
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
                      
                      <Checkbox checked={selectedBuildings.includes(building.id)} onCheckedChange={() => toggleBuilding(building.id)} className="mt-1" />
                    </div>
                  </div>)}

                {/* Legenda para prédios manuais */}
                {manualBuildings.length > 0 && <div className="text-xs text-amber-600 mt-2 px-1">
                    * Prédio adicionado manualmente (apenas para emissão desta proposta)
                  </div>}
              </>}
          </div>
        </Card>

        {/* Seção 2.5: Venda Futura */}
        <Card className="p-4 border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-[#9C1E1E]" />
              <Label className="font-semibold text-slate-800">Venda Futura</Label>
            </div>
            <Switch
              checked={vendaFutura}
              onCheckedChange={(checked) => {
                setVendaFutura(checked);
                if (!checked) {
                  setPrediosContratados(0);
                  setTelasContratadas(null);
                }
              }}
            />
          </div>
          
          {vendaFutura && (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Venda para prédios que ainda serão instalados. O cliente recebe 
                exibição <strong className="text-slate-700">gratuita</strong> até todos os prédios estarem prontos.
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Prédios Instalados (readonly) */}
                <div>
                  <Label className="text-xs text-slate-600">Prédios Instalados</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-slate-500" />
                    <span className="text-xl font-bold text-slate-700">
                      {buildings.length}
                    </span>
                  </div>
                </div>
                
                {/* Prédios Contratados (input) */}
                <div>
                  <Label className="text-xs text-slate-600">Prédios Contratados</Label>
                  <Input
                    type="number"
                    min={buildings.length + 1}
                    max={200}
                    value={prediosContratados || ''}
                    onChange={(e) => setPrediosContratados(parseInt(e.target.value) || 0)}
                    placeholder={`Ex: ${buildings.length + 3}`}
                    className="mt-1 h-9 bg-white border-slate-200"
                  />
                </div>
                
                {/* Telas Contratadas (input editável) */}
                <div>
                  <Label className="text-xs text-slate-600">Telas Contratadas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={telasContratadas ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTelasContratadas(val ? parseInt(val) : null);
                    }}
                    placeholder={`~${Math.ceil((prediosContratados || buildings.length) * 1.35)}`}
                    className="mt-1 h-9 bg-white border-slate-200"
                  />
                  <span className="text-[10px] text-slate-400">Deixe vazio = automático</span>
                </div>
              </div>
              
              {/* Resumo da Venda Futura */}
              {prediosContratados > buildings.length && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Gift className="h-4 w-4 text-[#9C1E1E]" />
                    <span className="text-sm font-medium">
                      Cortesia até instalação de <strong className="text-[#9C1E1E]">{prediosContratados - buildings.length}</strong> prédio(s) adicional(is)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Exibição gratuita até a meta ser atingida.
                  </p>
                  
                  {/* Cálculo estimado de exibições */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Telas:</span>
                      <span className="ml-1 font-bold text-slate-800">
                        {telasContratadas ?? `~${Math.ceil(prediosContratados * 1.35)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Exibições/mês:</span>
                      <span className="ml-1 font-bold text-slate-800">
                        ~{((telasContratadas ?? Math.ceil(prediosContratados * 1.35)) * (specifications?.exibicoes.porMes ?? 11610) * quantidadePosicoes).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Seção 3: Período e Valores */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Período e Valores</h2>
          </div>

          {/* Toggle de Modalidade: Monetária vs Permuta */}
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-slate-700">Tipo de Proposta</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModalidadeProposta('monetaria')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  modalidadeProposta === 'monetaria' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-sm">Monetária</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Pagamento em R$</div>
              </button>
              <button
                type="button"
                onClick={() => setModalidadeProposta('permuta')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  modalidadeProposta === 'permuta' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-sm">Permuta</span>
                </div>
                <div className="text-[10px] text-muted-foreground">Equipamentos em troca</div>
              </button>
            </div>
          </div>

          {/* Seção de Permuta (Equipamentos) */}
          {modalidadeProposta === 'permuta' && (
            <div className="mb-6 space-y-4">
              {/* Valor de Referência Monetária (quanto custaria se fosse comprar) */}
              <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-sm text-blue-800">Valor de Referência (Quanto Custaria)</h3>
                </div>
                <p className="text-xs text-blue-700 mb-3">
                  💡 Informe quanto custaria este pacote se fosse uma proposta monetária. Este valor será exibido ao cliente como referência do valor de mercado.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-blue-700">Valor Mensal de Referência</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input 
                        type="number" 
                        placeholder="0,00" 
                        value={valorReferenciaMonetaria || ''} 
                        onChange={e => setValorReferenciaMonetaria(parseFloat(e.target.value) || 0)} 
                        className="pl-10 h-12 text-base bg-white border-blue-200"
                      />
                    </div>
                    {valorSugeridoMensal > 0 && (
                      <button 
                        type="button"
                        onClick={() => setValorReferenciaMonetaria(valorSugeridoMensal)} 
                        className="text-[10px] text-blue-600 hover:underline mt-1"
                      >
                        Usar sugerido: {formatCurrency(valorSugeridoMensal)}
                      </button>
                    )}
                  </div>

                  {valorReferenciaMonetaria > 0 && durationMonths > 0 && (
                    <div className="p-3 bg-blue-100 rounded-lg space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-700">Valor Mensal:</span>
                        <span className="font-medium text-blue-800">{formatCurrency(valorReferenciaMonetaria)}/mês</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700 font-medium">Total ({isCustomDays ? `${customDays} dias` : `${durationMonths} meses`}):</span>
                        <span className="font-bold text-blue-900">
                          {formatCurrency(isCustomDays ? (valorReferenciaMonetaria / 30) * customDays : valorReferenciaMonetaria * durationMonths)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipamentos Ofertados */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                <ItensPermutaEditor
                  itens={itensPermuta}
                  onChange={setItensPermuta}
                  ocultarValoresPublico={ocultarValoresPublico}
                  onOcultarValoresChange={setOcultarValoresPublico}
                  descricaoContrapartida={descricaoContrapartida}
                  onDescricaoChange={setDescricaoContrapartida}
                />
              </div>
            </div>
          )}

          {/* Seletor de Período */}
          <div className="mb-4">
            <Label className="text-xs mb-2 block">Período do Contrato</Label>
            <div className="grid grid-cols-5 gap-2">
              {periodOptions.map(option => <button key={option.value} onClick={() => handlePeriodChange(option.value)} className={`p-3 rounded-lg border-2 text-center transition-all ${option.value === -1 && isCustomPayment || option.value === -2 && isCustomDays || !isCustomPayment && !isCustomDays && durationMonths === option.value ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  {option.value === -1 ? <>
                      <div className="font-bold text-sm">⚙️</div>
                      <div className="text-[10px] text-muted-foreground">Parcelas</div>
                    </> : option.value === -2 ? <>
                      <div className="font-bold text-sm">📅</div>
                      <div className="text-[10px] text-muted-foreground">Dias</div>
                    </> : <>
                      <div className="font-bold text-lg">{option.value}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {option.value === 1 ? 'mês' : 'meses'}
                      </div>
                      {option.discount > 0 && <div className="text-[10px] text-green-600 font-medium">
                          -{option.discount}%
                        </div>}
                    </>}
                </button>)}
            </div>
          </div>

          {/* Quantidade de Posições (Marcas) */}
          {tipoProduto === 'horizontal' && selectedBuildings.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Quantidade de Posições (Marcas)</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Slider
                    value={[quantidadePosicoes]}
                    onValueChange={(v) => setQuantidadePosicoes(v[0])}
                    min={1}
                    max={maxPosicoes}
                    step={1}
                    disabled={maxPosicoes <= 1}
                    className="flex-1"
                  />
                  <Badge variant="outline" className="text-lg px-4 py-2 bg-background font-bold min-w-[60px] justify-center">
                    {quantidadePosicoes}x
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>1 marca</span>
                  <span>{maxPosicoes} marcas disponíveis</span>
                </div>

                {quantidadePosicoes > 1 && (
                  <div className="bg-background/80 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Exibições por marca/mês:</span>
                      <span className="font-medium">{(specifications?.exibicoes.porMes ?? 11610).toLocaleString()}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total exibições/mês ({quantidadePosicoes} marcas × {totalPanels} telas):</span>
                      <span className="font-bold text-primary">{totalImpressionsAdjusted.toLocaleString()}x</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-3 bg-muted/50 p-2 rounded">
                💡 O cliente pode adquirir múltiplas posições para exibir vídeos de marcas diferentes no mesmo painel
              </p>
            </div>
          )}

          {/* Configuração de Período em Dias */}
          {isCustomDays && <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📅</span>
                <h3 className="font-semibold text-orange-800">Período em Dias</h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-xs">Quantidade de Dias</Label>
                  <Input type="number" min={1} max={29} value={customDays} onChange={e => setCustomDays(Math.min(29, Math.max(1, parseInt(e.target.value) || 1)))} className="mt-1 h-12 text-lg font-bold bg-white" />
                </div>
                <div className="text-sm text-muted-foreground pt-5">dias</div>
              </div>

              <p className="text-xs text-orange-600 bg-orange-100 p-2 rounded mt-3">
                ⚠️ Períodos menores que 30 dias têm acréscimo de 10% no valor
              </p>

              {calculateDaysPrice > 0 && <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-800">Valor Total ({customDays} dias):</span>
                    <span className="text-lg font-bold text-orange-900">{formatCurrency(calculateDaysPrice)}</span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    Base: {formatCurrency(selectedBuildingsData.reduce((sum, b) => sum + (b.preco_base || 0), 0))}/mês × {customDays}/30 × 1.10
                  </p>
                </div>}
            </div>}

          {/* Configuração de Pagamento Personalizado */}
          {isCustomPayment && <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚙️</span>
                <h3 className="font-semibold text-amber-800">Pagamento Personalizado</h3>
              </div>

              {/* Duração do Contrato */}
              <div className="mb-4">
                <Label className="text-xs">Duração do Contrato (meses)</Label>
                <Select value={customDurationMonths.toString()} onValueChange={v => {
              setCustomDurationMonths(parseInt(v));
              setDurationMonths(parseInt(v));
            }}>
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12, 18, 24].map(m => <SelectItem key={m} value={m.toString()}>{m} meses</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelas */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Parcelas ({customInstallments.length})</Label>
                  <div className="flex gap-2">
                    <button onClick={distributeEqually} className="text-[10px] text-amber-700 hover:underline">
                      Dividir igualmente
                    </button>
                    <button onClick={addCustomInstallment} className="text-[10px] text-primary font-medium hover:underline">
                      + Adicionar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {customInstallments.map((installment, index) => <div key={installment.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                      <span className="text-xs font-medium text-muted-foreground w-6">{index + 1}ª</span>
                      <Input type="date" value={formatDateForInput(installment.dueDate)} onChange={e => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    const newDate = new Date(dateValue + 'T00:00:00');
                    if (!isNaN(newDate.getTime())) {
                      updateInstallmentDate(installment.id, newDate);
                    }
                  }
                }} className="flex-1 h-9 text-sm" />
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                        <Input type="number" placeholder="0,00" value={installment.amount} onChange={e => updateInstallmentAmount(installment.id, e.target.value)} className="pl-8 h-9 text-sm" />
                      </div>
                      {customInstallments.length > 2 && <button onClick={() => removeCustomInstallment(installment.id)} className="text-red-500 hover:text-red-700 text-sm p-1">
                          ✕
                        </button>}
                    </div>)}
                </div>

                {/* Total das parcelas */}
                <div className="mt-3 p-2 bg-amber-100 rounded flex justify-between items-center">
                  <span className="text-xs font-medium text-amber-800">Total das Parcelas:</span>
                  <span className="font-bold text-amber-900">{formatCurrency(customTotal)}</span>
                </div>
              </div>
            </div>}

          {/* Valor Mensal Fidelidade - Somente para pagamento padrão e NÃO permuta */}
          {!isCustomPayment && modalidadeProposta !== 'permuta' && <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Valor Mensal (Fidelidade)</Label>
                {valorSugeridoMensal > 0 && <button onClick={() => setFidelValue(valorSugeridoMensal.toFixed(2))} className="text-[10px] text-primary hover:underline">
                    Usar sugerido: {formatCurrency(valorSugeridoMensal)}
                  </button>}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input type="number" placeholder="0,00" value={fidelValue} onChange={e => setFidelValue(e.target.value)} className="pl-10 h-12 text-base" />
              </div>
              {fidelMonthly > 0 && <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatCurrency(fidelTotal)} em {durationMonths}x de {formatCurrency(fidelMonthly)}
                </p>}
            </div>}

          {/* Desconto PIX à Vista - Somente para pagamento padrão e NÃO permuta */}
          {!isCustomPayment && modalidadeProposta !== 'permuta' && <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Desconto PIX à Vista</Label>
                <span className="text-sm font-medium text-primary">{discountPercent}% OFF</span>
              </div>
              <Slider value={[discountPercent]} onValueChange={value => setDiscountPercent(value[0])} min={0} max={25} step={1} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>}

          {/* Sobrescrever valor à vista - Somente para pagamento padrão e NÃO permuta */}
          {!isCustomPayment && modalidadeProposta !== 'permuta' && <>
              <div className="flex items-center gap-3 mb-3">
                <Switch checked={overwriteCashValue} onCheckedChange={setOverwriteCashValue} />
                <Label className="text-xs">Definir valor à vista manualmente</Label>
              </div>

              {overwriteCashValue && <div className="mb-4">
                  <Label className="text-xs">Valor Total à Vista</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input type="number" placeholder="0,00" value={cashValue} onChange={e => setCashValue(e.target.value)} className="pl-10 h-12 text-base" />
                  </div>
                </div>}
            </>}

          {/* Resumo de Valores - Padrão - NÃO permuta */}
          {!isCustomPayment && fidelMonthly > 0 && modalidadeProposta !== 'permuta' && <div className="p-3 bg-gray-50 rounded-lg space-y-2">
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
              {/* Mensalidade equivalente à vista e economia */}
              {durationMonths > 0 && <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Equivale a:</span>
                  <div className="text-right">
                    <span className="font-bold text-green-600">
                      {formatCurrency(cashTotal / durationMonths)}/mês
                    </span>
                    
                  </div>
                </div>}
            </div>}

          {/* Resumo de Valores - Personalizado */}
          {isCustomPayment && customTotal > 0 && <div className="p-3 bg-amber-50 rounded-lg space-y-2 border border-amber-200">
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
            </div>}

          {/* Detalhamento de Preços Corporativo - NÃO permuta */}
          {selectedBuildings.length > 0 && !isCustomPayment && !isCustomDays && modalidadeProposta !== 'permuta' && (
            <Card className="p-3 bg-slate-50/80 border-slate-200 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-slate-600" />
                <h3 className="font-semibold text-sm text-slate-800">Detalhamento por Local</h3>
              </div>

              {/* Tabela de Prédios */}
              <div className="rounded-lg border border-slate-200 overflow-hidden mb-3">
                <div className="grid grid-cols-4 gap-2 p-2 bg-slate-100 text-[10px] font-medium text-slate-600">
                  <span>Prédio</span>
                  <span className="text-center">Telas</span>
                  <span className="text-right">R$/Local</span>
                  <span className="text-right">R$/Tela</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-24 overflow-y-auto">
                  {selectedBuildingsData.map((building) => {
                    const precoBase = (building as any).preco_base || 0;
                    const telas = building.quantidade_telas || 1;
                    const precoPorTela = telas > 0 ? precoBase / telas : 0;
                    
                    return (
                      <div key={building.id} className="grid grid-cols-4 gap-2 p-2 text-[10px] bg-white">
                        <span className="truncate">{building.nome}</span>
                        <span className="text-center">{telas}</span>
                        <span className="text-right font-medium">{formatCurrency(precoBase)}</span>
                        <span className="text-right text-muted-foreground">{formatCurrency(precoPorTela)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Indicador de Venda Futura */}
              {vendaFutura && prediosContratados > 0 && (
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 mb-3 flex items-center gap-2">
                  <Rocket className="h-3 w-3 text-[#9C1E1E]" />
                  <span className="text-[10px] text-slate-600">
                    <strong className="text-slate-700">Venda Futura:</strong> {prediosContratados} prédios contratados ({totalPanels} telas)
                  </span>
                </div>
              )}

              {/* Resumo Consolidado por Modalidade */}
              <div className="grid grid-cols-2 gap-3">
                {/* Fidelidade */}
                <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="text-[10px] font-medium text-slate-500 uppercase mb-1">Fidelidade ({durationMonths}x)</div>
                  <div className="flex justify-between text-[10px]">
                    <span>Por local/mês:</span>
                    <span className="font-medium">
                      {formatCurrency((vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 
                        ? fidelMonthly / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
                        : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Por tela/mês:</span>
                    <span className="font-medium">
                      {formatCurrency(totalPanels > 0 ? fidelMonthly / totalPanels : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold">{formatCurrency(fidelTotal)}</span>
                  </div>
                </div>

                {/* À Vista */}
                <div className="p-2 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-200 space-y-1">
                  <div className="text-[10px] font-medium text-green-600 uppercase flex items-center gap-1 mb-1">
                    PIX À Vista
                    <span className="bg-green-100 text-green-700 text-[8px] px-1 rounded">-{discountPercent}%</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Por local/mês:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency((vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) > 0 && durationMonths > 0 
                        ? (cashTotal / durationMonths) / (vendaFutura && prediosContratados > 0 ? prediosContratados : selectedBuildingsData.length) 
                        : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>Por tela/mês:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(totalPanels > 0 && durationMonths > 0 ? (cashTotal / durationMonths) / totalPanels : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-green-100">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-green-600">{formatCurrency(cashTotal)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Card>

        {/* Seção: Configurações Avançadas */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Configurações Avançadas</h2>
          </div>

          <div className="space-y-4">
            {/* Toggle: Ativar Pedido Hoje - SÓ aparece quando pagamento personalizado E tem parcela futura */}
            {isCustomPayment && hasFutureInstallment && <div className="flex items-center justify-between p-4 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Ativar Pedido Hoje</p>
                    <p className="text-xs text-muted-foreground">
                      Pedido ativa agora, mesmo com pagamento no futuro
                    </p>
                  </div>
                </div>
                <Switch checked={cobrancaFutura} onCheckedChange={setCobrancaFutura} className="data-[state=checked]:bg-amber-500" />
              </div>}

            {/* Toggle: Exigir Assinatura de Contrato */}
            <div className="flex items-center justify-between p-4 bg-blue-50/80 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Exigir Assinatura de Contrato</p>
                  <p className="text-xs text-muted-foreground">
                    Upload de vídeo só libera após assinar contrato
                  </p>
                </div>
              </div>
              <Switch checked={exigirContrato} onCheckedChange={setExigirContrato} className="data-[state=checked]:bg-blue-500" />
            </div>

            {/* Card: Exclusividade de Segmento */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] rounded-lg">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Exclusividade de Segmento</p>
                    <p className="text-xs text-muted-foreground">
                      Bloqueia concorrentes nos prédios selecionados
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={oferecerExclusividade} 
                  onCheckedChange={(checked) => {
                    setOferecerExclusividade(checked);
                    if (!checked) {
                      setExclusividadeDisponivel(null);
                      setSegmentoExclusivo('');
                    }
                  }} 
                  className="data-[state=checked]:bg-[#9C1E1E]" 
                />
              </div>

              {/* Conteúdo expandido quando ativado */}
              {oferecerExclusividade && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  {/* Seletor de Segmento */}
                  <BusinessSegmentSelector
                    value={segmentoExclusivo}
                    onChange={(value) => {
                      setSegmentoExclusivo(value);
                      setExclusividadeDisponivel(null); // Reset ao mudar segmento
                    }}
                    showLabel={true}
                    label="Segmento a Bloquear"
                    placeholder="Selecione o segmento"
                    allowCreate={true}
                  />

                  {/* Botão Verificar Disponibilidade */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={verificarDisponibilidadeExclusividade}
                    disabled={!segmentoExclusivo || selectedBuildings.length === 0 || verificandoExclusividade}
                    className="w-full"
                  >
                    {verificandoExclusividade ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Verificar Disponibilidade
                  </Button>

                  {/* Indicador de Status */}
                  {exclusividadeDisponivel !== null && (
                    <div className={`p-2.5 rounded-lg flex items-center gap-2 ${
                      exclusividadeDisponivel 
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      {exclusividadeDisponivel ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-700">
                            Exclusividade DISPONÍVEL
                          </span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-600" />
                          <span className="text-xs font-medium text-red-700">
                            Exclusividade INDISPONÍVEL (conflito existente)
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Configuração de Percentual e Valor */}
                  {exclusividadeDisponivel && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {/* Percentual Extra */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-600">Percentual Extra (%)</Label>
                        <Input
                          type="number"
                          value={exclusividadePercentual}
                          onChange={(e) => setExclusividadePercentual(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                          className="h-9 text-sm"
                          min={0}
                          max={100}
                        />
                      </div>

                      {/* Valor Extra Manual (opcional) */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-600">Valor Extra (R$)</Label>
                        <Input
                          type="number"
                          value={exclusividadeValorExtra ?? ''}
                          onChange={(e) => setExclusividadeValorExtra(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder={formatCurrency(exclusividadeValorCalculado)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview do valor com exclusividade */}
                  {exclusividadeDisponivel && (
                    <div className="p-2.5 bg-gradient-to-r from-[#9C1E1E]/5 to-[#9C1E1E]/10 rounded-lg border border-[#9C1E1E]/20">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Valor base à vista:</span>
                        <span className="font-medium">{formatCurrency(cashTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-slate-600">+ Exclusividade ({exclusividadePercentual}%):</span>
                        <span className="font-medium text-[#9C1E1E]">+ {formatCurrency(exclusividadeValorCalculado)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-[#9C1E1E]/10">
                        <span className="font-semibold text-slate-700">Total com Exclusividade:</span>
                        <span className="font-bold text-[#9C1E1E]">{formatCurrency(cashTotal + exclusividadeValorCalculado)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card: Travamento de Preço para Expansão Futura */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg">
                    <Lock className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Travamento de Preço</p>
                    <p className="text-xs text-muted-foreground">
                      Garante o preço atual para expansões futuras
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={travamentoPrecoAtivo} 
                  onCheckedChange={(checked) => {
                    setTravamentoPrecoAtivo(checked);
                    if (checked && travamentoTelasLimite < totalPanels) {
                      setTravamentoTelasLimite(Math.ceil(totalPanels * 3));
                    }
                  }} 
                  className="data-[state=checked]:bg-blue-600" 
                />
              </div>

              {/* Conteúdo expandido quando ativado */}
              {travamentoPrecoAtivo && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  {/* Telas Atuais (readonly) */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 font-medium">Telas Instaladas Hoje</span>
                      <span className="text-lg font-bold text-blue-800">{totalPanels}</span>
                    </div>
                  </div>

                  {/* Limite de Telas */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Limite de Telas para Travamento</Label>
                    <Input
                      type="number"
                      value={travamentoTelasLimite}
                      onChange={(e) => setTravamentoTelasLimite(Math.max(totalPanels, parseInt(e.target.value) || totalPanels))}
                      className="h-10 text-base font-semibold"
                      min={totalPanels}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Cliente poderá expandir até {travamentoTelasLimite} telas mantendo o preço atual
                    </p>
                  </div>

                  {/* Valor do Travamento */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-600">Valor do Travamento (R$)</Label>
                    <Input
                      type="number"
                      value={travamentoPrecoValor}
                      onChange={(e) => setTravamentoPrecoValor(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0 = gratuito"
                      className="h-10"
                      min={0}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {travamentoPrecoValor === 0 ? '✨ Travamento gratuito como benefício especial' : `Taxa adicional de ${formatCurrency(travamentoPrecoValor)} pelo travamento`}
                    </p>
                  </div>

                  {/* Modo de Cálculo do Preço Travado */}
                  <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Label className="text-xs text-slate-700 font-medium">Modo de Cálculo do Preço Travado</Label>
                    
                    {/* Opção Automático */}
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        travamentoModoCalculo === 'automatico' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setTravamentoModoCalculo('automatico')}
                    >
                      <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                        travamentoModoCalculo === 'automatico' ? 'border-primary' : 'border-gray-300'
                      }`}>
                        {travamentoModoCalculo === 'automatico' && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Conforme Proposta (automático)</div>
                        <p className="text-[10px] text-muted-foreground">
                          Calcula baseado no valor total ÷ número de telas
                        </p>
                        <div className="mt-2 p-2 bg-white rounded border">
                          <span className="text-xs text-slate-600">Preço calculado: </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(totalPanels > 0 ? valorMensalEfetivo / totalPanels : 0)}/tela/mês
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Opção Manual */}
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        travamentoModoCalculo === 'manual' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setTravamentoModoCalculo('manual')}
                    >
                      <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center ${
                        travamentoModoCalculo === 'manual' ? 'border-primary' : 'border-gray-300'
                      }`}>
                        {travamentoModoCalculo === 'manual' && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">Valor Manual por Painel</div>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Defina um valor fixo por tela/mês
                        </p>
                        {travamentoModoCalculo === 'manual' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">R$</span>
                            <Input
                              type="number"
                              value={travamentoPrecoManual || ''}
                              onChange={(e) => setTravamentoPrecoManual(Math.max(0, parseFloat(e.target.value) || 0))}
                              placeholder="0,00"
                              className="h-9 w-32"
                              min={0}
                              step={0.01}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm text-muted-foreground">/tela/mês</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview resumido */}
                  <div className={`p-3 rounded-lg border ${travamentoPrecoValor === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className={`h-3.5 w-3.5 ${travamentoPrecoValor === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <span className={`text-xs font-semibold ${travamentoPrecoValor === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {travamentoPrecoValor === 0 ? 'Garantia Incluída' : 'Opção de Travamento'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={travamentoPrecoValor === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        Preço por tela travado:
                      </span>
                      <span className={`font-bold ${travamentoPrecoValor === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {formatCurrency(
                          travamentoModoCalculo === 'automatico'
                            ? (totalPanels > 0 ? valorMensalEfetivo / totalPanels : 0)
                            : travamentoPrecoManual
                        )}/tela/mês
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={travamentoPrecoValor === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        Expansão garantida:
                      </span>
                      <span className={`font-semibold ${travamentoPrecoValor === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        + {travamentoTelasLimite - totalPanels} telas
                      </span>
                    </div>
                    <p className={`text-[10px] mt-2 ${travamentoPrecoValor === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {travamentoModoCalculo === 'automatico' 
                        ? '📊 Calculado conforme valor da proposta'
                        : '✏️ Valor definido manualmente'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Card: Multa de Rescisão de Contrato */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-rose-600 to-rose-800 rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Multa de Rescisão</p>
                    <p className="text-xs text-muted-foreground">
                      Penalidade por quebra antecipada de contrato
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={multaRescisaoAtiva} 
                  onCheckedChange={setMultaRescisaoAtiva} 
                  className="data-[state=checked]:bg-rose-600" 
                />
              </div>

              {/* Conteúdo expandido quando ativado */}
              {multaRescisaoAtiva && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  {/* Slider de Percentual */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-slate-600">Percentual da Multa</Label>
                      <span className="text-lg font-bold text-rose-700">{multaRescisaoPercentual}%</span>
                    </div>
                    <Slider
                      value={[multaRescisaoPercentual]}
                      onValueChange={(values) => setMultaRescisaoPercentual(values[0])}
                      min={0}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Explicação */}
                  <div className="p-3 bg-rose-50/80 rounded-lg border border-rose-200">
                    <p className="text-xs text-rose-700">
                      Em caso de rescisão antecipada, o cliente pagará <span className="font-bold">{multaRescisaoPercentual}%</span> sobre o valor remanescente do contrato.
                    </p>
                  </div>
                </div>
              )}

              {/* Preview quando desativado */}
              {!multaRescisaoAtiva && (
                <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Contrato sem multa de rescisão
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Seção 4: Validade da Proposta */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Validade da Proposta</h2>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {validityOptions.map(option => <button key={option.value} onClick={() => {
            setValidityHours(option.value);
            if (option.value === -1) {
              setShowCalendarModal(true);
            }
          }} className={`p-3 rounded-lg border-2 text-center transition-all ${validityHours === option.value ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="text-xs font-medium">{option.label}</div>
              </button>)}
          </div>

          {/* Botão para abrir calendário quando Personalizado está selecionado */}
          {validityHours === -1 && <div className="mt-3">
              <Button variant="outline" onClick={() => setShowCalendarModal(true)} className="w-full justify-start text-left h-11 bg-white/60 backdrop-blur-sm border-gray-200">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {customDateRange?.from && customDateRange?.to ? <span className="flex items-center gap-2">
                    <span className="font-medium">
                      {format(customDateRange.from, "dd/MM/yyyy", {
                  locale: ptBR
                })}
                    </span>
                    <span className="text-muted-foreground">até</span>
                    <span className="font-medium">
                      {format(customDateRange.to, "dd/MM/yyyy", {
                  locale: ptBR
                })}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({differenceInDays(customDateRange.to, customDateRange.from)} dias)
                    </span>
                  </span> : <span className="text-muted-foreground">Selecionar período de validade</span>}
              </Button>
            </div>}

          {/* Feedback para validade indeterminada */}
          {validityHours === 0 && <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Esta proposta não terá data de expiração
              </p>
            </div>}

          {/* Modal de Calendário Glassmorphism */}
          <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
            <DialogContent className="max-w-fit p-0 bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-primary/10">
                <DialogTitle className="text-center text-lg font-semibold">
                  Período de Validade
                </DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  Selecione de qual dia até qual dia a proposta será válida
                </DialogDescription>
              </DialogHeader>
              
              <div className="p-4 flex justify-center">
                <Calendar mode="range" selected={customDateRange} onSelect={setCustomDateRange} numberOfMonths={isMobile ? 1 : 2} disabled={{
                before: new Date()
              }} locale={ptBR} className="rounded-xl border bg-white/60 backdrop-blur-sm pointer-events-auto" />
              </div>

              <div className="p-4 pt-0 space-y-3">
                {customDateRange?.from && customDateRange?.to && <div className="p-3 bg-green-50/80 rounded-xl border border-green-200/50 backdrop-blur-sm">
                    <p className="text-sm text-green-700 text-center font-medium flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Válida por {differenceInDays(customDateRange.to, customDateRange.from)} dias
                    </p>
                  </div>}
                
                <Button onClick={() => setShowCalendarModal(false)} disabled={!customDateRange?.from || !customDateRange?.to} className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white h-11">
                  Confirmar Período
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>

        {/* Métricas Resumo */}
        {selectedBuildings.length > 0 && <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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
          </Card>}
      </div>

      {/* Footer Fixo com Botões */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 z-20">
        {/* Indicador de Auto-Save */}
        {!isEditMode && clientData.firstName.trim() && (
          <div className="flex justify-center mb-2">
            {isSavingDraft && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvando rascunho...
              </span>
            )}
            {!isSavingDraft && lastSavedAt && !draftError && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                <CheckCircle className="h-3 w-3" />
                Salvo às {format(lastSavedAt, 'HH:mm:ss')}
              </span>
            )}
            {draftError && (
              <span className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 px-2 py-1 rounded-full">
                <X className="h-3 w-3" />
                {draftError}
              </span>
            )}
          </div>
        )}
        
        <div className="flex gap-2 max-w-lg mx-auto">
          {/* Botão Cortesia */}
          <Button variant="outline" onClick={handleOpenCortesiaDialog} disabled={selectedBuildings.length === 0 || !clientData.email} className="h-11 px-3 border-pink-200 text-pink-600 hover:bg-pink-50">
            <Gift className="h-4 w-4" />
          </Button>
          
          {/* Botão Preview */}
          <Button variant="outline" onClick={() => setShowPreviewModal(true)} disabled={selectedBuildings.length === 0} className="h-11 px-3 border-gray-200 text-gray-600 hover:bg-gray-50">
            <Eye className="h-4 w-4" />
          </Button>
          
          {/* Botão Copiar Texto da Proposta */}
          <Button 
            variant="outline" 
            onClick={handleCopyProposalText} 
            disabled={selectedBuildings.length === 0}
            className="h-11 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
            title="Copiar texto completo da proposta para validação"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {/* Botão Enviar Proposta */}
          <Button 
            onClick={handleOpenSendDialog} 
            disabled={
              selectedBuildings.length === 0 || 
              (modalidadeProposta === 'permuta' 
                ? itensPermuta.length === 0 
                : (isCustomPayment ? customTotal <= 0 : !fidelValue)) ||
              // GUARD: Desabilitar em modo edição até carregar completamente
              (isEditMode && (!dataLoaded || isLoadingProposal))
            } 
            className="flex-1 h-11 gap-2"
          >
            <Send className="h-4 w-4" />
            {isEditMode && (!dataLoaded || isLoadingProposal) ? 'Carregando...' : 'Enviar'}
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
            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${sendViaWhatsApp ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-200'} ${!clientData.phone ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => clientData.phone && handleWhatsAppChange(!sendViaWhatsApp)}>
              <Checkbox checked={sendViaWhatsApp} onCheckedChange={checked => clientData.phone && handleWhatsAppChange(!!checked)} disabled={!clientData.phone} />
              <MessageSquare className="h-5 w-5 text-[#25D366]" />
              <div className="flex-1">
                <div className="font-medium text-sm">WhatsApp</div>
                <div className="text-xs text-muted-foreground">
                  {clientData.phone || 'Telefone não informado'}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${sendViaEmail ? 'border-primary bg-primary/5' : 'border-gray-200'} ${!clientData.email ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => clientData.email && handleEmailChange(!sendViaEmail)}>
              <Checkbox checked={sendViaEmail} onCheckedChange={checked => clientData.email && handleEmailChange(!!checked)} disabled={!clientData.email} />
              <Mail className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-medium text-sm">E-mail</div>
                <div className="text-xs text-muted-foreground">
                  {clientData.email || 'E-mail não informado'}
                </div>
              </div>
            </div>

            {/* Apenas Gerar Link */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${onlyGenerateLink ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => handleOnlyLinkChange(!onlyGenerateLink)}>
              <Checkbox checked={onlyGenerateLink} onCheckedChange={checked => handleOnlyLinkChange(!!checked)} />
              <Link2 className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium text-sm">Apenas Gerar Link</div>
                <div className="text-xs text-muted-foreground">
                  Copiar URL sem notificar o cliente
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
                <span className="font-medium">{isCustomPayment ? customDurationMonths : durationMonths} {(isCustomPayment ? customDurationMonths : durationMonths) === 1 ? 'mês' : 'meses'}</span>
              </div>
              
              {isCustomPayment ? <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium text-amber-600">Pagamento Personalizado</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium text-primary">{formatCurrency(customTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parcelas:</span>
                    <span className="font-medium">{customInstallments.length}x</span>
                  </div>
                  {customInstallments.slice(0, 3).map((inst, idx) => <div key={inst.id} className="flex justify-between pl-3 text-[10px]">
                      <span className="text-muted-foreground">{idx + 1}ª parcela:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(inst.amount.replace(/\D/g, '') || '0') / 100)}</span>
                    </div>)}
                  {customInstallments.length > 3 && <div className="text-[10px] text-muted-foreground pl-3">
                      ... e mais {customInstallments.length - 3} parcelas
                    </div>}
                </> : <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor à Vista:</span>
                    <span className="font-medium text-primary">{formatCurrency(cashTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Fidelidade:</span>
                    <span className="font-medium">{formatCurrency(fidelMonthly)}/mês (total: {formatCurrency(fidelTotal)})</span>
                  </div>
                </>}
              
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
            <Button onClick={handleSendProposal} disabled={!sendViaWhatsApp && !sendViaEmail && !onlyGenerateLink || createProposalMutation.isPending} className="gap-2">
              {createProposalMutation.isPending ? <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {onlyGenerateLink ? 'Criando...' : 'Enviando...'}
                </> : onlyGenerateLink ? <>
                  <Link2 className="h-4 w-4" />
                  Criar e Copiar Link
                </> : <>
                  <Send className="h-4 w-4" />
                  Enviar Agora
                </>}
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
              {clientData.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{clientData.phone}</span>
                </div>}
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
            <Button onClick={handleRequestCortesiaCode} disabled={isRequestingCode} className="gap-2">
              {isRequestingCode ? <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando código...
                </> : <>
                  <Gift className="h-4 w-4" />
                  Solicitar Código
                </>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Código de Cortesia */}
      <Dialog open={cortesiaCodeDialogOpen} onOpenChange={open => {
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
              Digite o código de 4 dígitos enviado<br />
              para o WhatsApp do administrador
            </p>
            
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={cortesiaCode} onChange={setCortesiaCode} disabled={isValidatingCode}>
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3].map(index => <InputOTPSlot key={index} index={index} className="w-14 h-16 text-2xl font-semibold rounded-xl border-2 transition-all duration-200 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />)}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              O código expira em 10 minutos
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
            setCortesiaCodeDialogOpen(false);
            setCortesiaCode('');
          }}>
              Cancelar
            </Button>
            <Button onClick={handleValidateCortesiaCode} disabled={cortesiaCode.length !== 4 || isValidatingCode} className="gap-2">
              {isValidatingCode ? <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando...
                </> : <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar Cortesia
                </>}
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
              <Input value={newManualBuilding.nome} onChange={e => setNewManualBuilding({
              ...newManualBuilding,
              nome: e.target.value
            })} placeholder="Ex: Edifício Aurora" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Endereço *</Label>
              <Input value={newManualBuilding.endereco} onChange={e => setNewManualBuilding({
              ...newManualBuilding,
              endereco: e.target.value
            })} placeholder="Ex: Rua das Flores, 123 - Centro" className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Nº de Telas</Label>
                <Input type="number" min="1" value={newManualBuilding.quantidade_telas} onChange={e => setNewManualBuilding({
                ...newManualBuilding,
                quantidade_telas: parseInt(e.target.value) || 1
              })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Exibições/Mês</Label>
                <Input type="number" min="0" value={newManualBuilding.visualizacoes_mes} onChange={e => setNewManualBuilding({
                ...newManualBuilding,
                visualizacoes_mes: parseInt(e.target.value) || 0
              })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Público Est.</Label>
                <Input type="number" min="0" value={newManualBuilding.publico_estimado} onChange={e => setNewManualBuilding({
                ...newManualBuilding,
                publico_estimado: parseInt(e.target.value) || 0
              })} className="mt-1" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddBuildingDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddManualBuilding} className="gap-2 bg-amber-500 hover:bg-amber-600">
              <Plus className="h-4 w-4" />
              Adicionar Prédio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Upload de Logo do Cliente */}
      <ClientLogoUploadModal
        isOpen={showLogoUploadModal}
        onClose={() => setShowLogoUploadModal(false)}
        onLogoProcessed={(logoUrl) => {
          setClientLogoUrl(logoUrl);
          setShowLogoUploadModal(false);
        }}
      />
    </div>;
};
export default NovaPropostaPage;