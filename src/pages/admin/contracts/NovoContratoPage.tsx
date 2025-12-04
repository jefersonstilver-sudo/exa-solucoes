import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileSignature,
  Users,
  Building2,
  Loader2,
  Send,
  Save,
  Eye,
  Search,
  Mail,
  AlertTriangle,
  Link2,
  Edit3,
  Tv,
  Monitor,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';
import ContractPreview from '@/components/admin/contracts/ContractPreview';

type Step = 'tipo' | 'modo' | 'vinculo' | 'cliente' | 'contrato' | 'preview';
type FillMode = 'extract' | 'manual';
type TipoProduto = 'horizontal' | 'vertical_premium';

interface ContratoData {
  tipo_contrato: 'anunciante' | 'sindico';
  pedido_id?: string;
  proposta_id?: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone: string;
  cliente_cnpj: string;
  cliente_razao_social: string;
  cliente_cargo: string;
  cliente_endereco: string;
  cliente_cidade: string;
  cliente_segmento: string;
  valor_mensal: number;
  valor_total: number;
  plano_meses: number;
  dia_vencimento: number;
  metodo_pagamento: string;
  lista_predios: any[];
  parcelas: any[];
  clausulas_especiais: string;
  data_inicio: string;
  tipo_produto: TipoProduto;
}

const NovoContratoPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buildPath } = useAdminBasePath();
  const { session } = useAuth();
  const [step, setStep] = useState<Step>('tipo');
  const [fillMode, setFillMode] = useState<FillMode | null>(null);
  const [searchPedido, setSearchPedido] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendEmail, setSendEmail] = useState('');
  const [sendNome, setSendNome] = useState('');
  
  // Estados para pagamento personalizado manual
  const [isCustomPaymentManual, setIsCustomPaymentManual] = useState(false);
  const [customInstallmentsManual, setCustomInstallmentsManual] = useState<{
    id: number;
    dueDate: Date;
    amount: string;
  }[]>([
    { id: 1, dueDate: new Date(), amount: '' },
    { id: 2, dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), amount: '' }
  ]);
  
  const [contratoData, setContratoData] = useState<ContratoData>({
    tipo_contrato: 'anunciante',
    cliente_nome: '',
    cliente_email: '',
    cliente_telefone: '',
    cliente_cnpj: '',
    cliente_razao_social: '',
    cliente_cargo: '',
    cliente_endereco: '',
    cliente_cidade: 'Foz do Iguaçu',
    cliente_segmento: '',
    valor_mensal: 0,
    valor_total: 0,
    plano_meses: 1,
    dia_vencimento: 10,
    metodo_pagamento: 'pix_fidelidade',
    lista_predios: [],
    parcelas: [],
    clausulas_especiais: '',
    data_inicio: new Date().toISOString().split('T')[0],
    tipo_produto: 'horizontal'
  });

  // Buscar pedidos para vincular
  const { data: pedidos } = useQuery({
    queryKey: ['pedidos-para-contrato', searchPedido],
    queryFn: async () => {
      let query = supabase
        .from('pedidos')
        .select('*')
        .in('status', ['pago', 'ativo', 'pago_pendente_video'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchPedido) {
        query = query.or(`id.ilike.%${searchPedido}%,client_name.ilike.%${searchPedido}%`);
      }

      const { data: pedidosData, error } = await query;
      if (error) throw error;
      if (!pedidosData?.length) return [];

      const enrichedPedidos = await Promise.all(
        pedidosData.map(async (pedido) => {
          let userData = null;
          let proposalData = null;

          if (pedido.client_id) {
            const { data: user } = await supabase
              .from('users')
              .select('nome, email, telefone, empresa_documento, empresa_nome, empresa_segmento, empresa_endereco')
              .eq('id', pedido.client_id)
              .single();
            userData = user;
          }

          if (pedido.proposal_id) {
            const { data: proposal } = await supabase
              .from('proposals')
              .select('client_name, client_email, client_phone, client_cnpj, client_company_name, selected_buildings, payment_type, custom_installments, duration_months, fidel_monthly_value, cash_total_value, discount_percent, tipo_produto')
              .eq('id', pedido.proposal_id)
              .single();
            proposalData = proposal;
          }

          return {
            ...pedido,
            user_nome: userData?.nome,
            user_email: userData?.email,
            user_telefone: userData?.telefone,
            user_cnpj: userData?.empresa_documento,
            user_razao_social: userData?.empresa_nome,
            user_segmento: userData?.empresa_segmento,
            user_endereco: userData?.empresa_endereco,
            proposta_nome: proposalData?.client_name,
            proposta_email: proposalData?.client_email,
            proposta_telefone: proposalData?.client_phone,
            proposta_cnpj: proposalData?.client_cnpj,
            proposta_razao_social: proposalData?.client_company_name,
            proposta_selected_buildings: proposalData?.selected_buildings,
            proposta_payment_type: proposalData?.payment_type,
            proposta_custom_installments: proposalData?.custom_installments,
            proposta_duration_months: proposalData?.duration_months,
            proposta_fidel_monthly: proposalData?.fidel_monthly_value,
            proposta_cash_total: proposalData?.cash_total_value,
            proposta_discount: proposalData?.discount_percent,
            proposta_tipo_produto: proposalData?.tipo_produto,
          };
        })
      );

      return enrichedPedidos;
    },
    enabled: step === 'vinculo' && fillMode === 'extract'
  });

  // Buscar prédios ativos
  const { data: predios } = useQuery({
    queryKey: ['predios-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      return data || [];
    }
  });

  // Cálculos derivados
  const totalPaineis = useMemo(() => {
    return contratoData.lista_predios.reduce((acc, p) => acc + (p.quantidade_telas || 1), 0);
  }, [contratoData.lista_predios]);

  const totalVisualizacoes = useMemo(() => {
    return contratoData.lista_predios.reduce((acc, p) => acc + (p.visualizacoes_mes || 0), 0);
  }, [contratoData.lista_predios]);

  const customTotalManual = useMemo(() => {
    return customInstallmentsManual.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [customInstallmentsManual]);

  // Handlers para pagamento personalizado manual
  const addCustomInstallmentManual = () => {
    const lastInstallment = customInstallmentsManual[customInstallmentsManual.length - 1];
    const newDate = new Date(lastInstallment.dueDate);
    newDate.setMonth(newDate.getMonth() + 1);
    
    setCustomInstallmentsManual(prev => [...prev, {
      id: prev.length + 1,
      dueDate: newDate,
      amount: ''
    }]);
  };

  const removeCustomInstallmentManual = (id: number) => {
    if (customInstallmentsManual.length <= 2) {
      toast.error('Mínimo de 2 parcelas');
      return;
    }
    setCustomInstallmentsManual(prev => prev.filter(p => p.id !== id));
  };

  const formatDateForInput = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  const distributeEquallyManual = () => {
    if (contratoData.valor_total <= 0) {
      toast.error('Defina o valor total primeiro');
      return;
    }
    const perInstallment = (contratoData.valor_total / customInstallmentsManual.length).toFixed(2);
    setCustomInstallmentsManual(prev => prev.map(p => ({ ...p, amount: perInstallment })));
  };

  // Selecionar todos os prédios
  const handleSelectAllBuildings = () => {
    if (!predios) return;
    const allBuildings = predios.map(predio => ({
      id: predio.id,
      building_id: predio.id,
      building_name: predio.nome,
      nome: predio.nome,
      bairro: predio.bairro,
      endereco: predio.endereco,
      quantidade_telas: predio.quantidade_telas || 1,
      visualizacoes_mes: predio.visualizacoes_mes || 0
    }));
    setContratoData(prev => ({ ...prev, lista_predios: allBuildings }));
    toast.success(`${allBuildings.length} prédios selecionados`);
  };

  // Handler para Vertical Premium
  const handleVerticalPremiumToggle = () => {
    const newTipoProduto = contratoData.tipo_produto === 'vertical_premium' ? 'horizontal' : 'vertical_premium';
    
    if (newTipoProduto === 'vertical_premium' && predios) {
      // Selecionar TODOS os prédios automaticamente
      const allBuildings = predios.map(predio => ({
        id: predio.id,
        building_id: predio.id,
        building_name: predio.nome,
        nome: predio.nome,
        bairro: predio.bairro,
        endereco: predio.endereco,
        quantidade_telas: predio.quantidade_telas || 1,
        visualizacoes_mes: predio.visualizacoes_mes || 0
      }));
      setContratoData(prev => ({ 
        ...prev, 
        tipo_produto: newTipoProduto,
        lista_predios: allBuildings
      }));
      toast.success('Vertical Premium: Todos os prédios selecionados automaticamente');
    } else {
      setContratoData(prev => ({ 
        ...prev, 
        tipo_produto: newTipoProduto,
        lista_predios: []
      }));
    }
  };

  // Criar contrato
  const createContractMutation = useMutation({
    mutationFn: async (data: ContratoData & { enviar: boolean }) => {
      const { data: numeroContrato } = await supabase.rpc('generate_contract_number');

      // Se pagamento personalizado manual, usar as parcelas manuais
      const parcelas = isCustomPaymentManual 
        ? customInstallmentsManual.map((p, idx) => ({
            installment: idx + 1,
            due_date: formatDateForInput(p.dueDate),
            amount: parseFloat(p.amount) || 0
          }))
        : data.parcelas;

      const contratoPayload = {
        numero_contrato: numeroContrato,
        tipo_contrato: data.tipo_contrato,
        pedido_id: data.pedido_id || null,
        proposta_id: data.proposta_id || null,
        cliente_nome: data.cliente_nome,
        cliente_email: data.cliente_email,
        cliente_telefone: data.cliente_telefone,
        cliente_cnpj: data.cliente_cnpj,
        cliente_razao_social: data.cliente_razao_social,
        cliente_cargo: data.cliente_cargo,
        cliente_endereco: data.cliente_endereco,
        cliente_cidade: data.cliente_cidade,
        cliente_segmento: data.cliente_segmento,
        valor_mensal: data.valor_mensal,
        valor_total: isCustomPaymentManual ? customTotalManual : data.valor_total,
        plano_meses: data.plano_meses,
        dia_vencimento: data.dia_vencimento,
        metodo_pagamento: isCustomPaymentManual ? 'custom' : data.metodo_pagamento,
        lista_predios: data.lista_predios,
        parcelas: parcelas,
        clausulas_especiais: data.clausulas_especiais,
        total_paineis: data.lista_predios.reduce((acc: number, p: any) => acc + (p.quantidade_telas || 1), 0),
        data_inicio: data.data_inicio,
        status: data.enviar ? 'enviado' : 'rascunho',
        criado_por: session?.user?.id,
        tipo_produto: data.tipo_produto
      };

      const { data: contrato, error } = await supabase
        .from('contratos_legais')
        .insert(contratoPayload)
        .select()
        .single();

      if (error) throw error;

      if (data.enviar && contrato) {
        const { error: clicksignError } = await supabase.functions.invoke('clicksign-create-contract', {
          body: { contrato_id: contrato.id }
        });

        if (clicksignError) {
          console.error('Erro ClickSign:', clicksignError);
          toast.error('Contrato criado, mas falha ao enviar para assinatura');
        }
      }

      return contrato;
    },
    onSuccess: (contrato) => {
      toast.success('Contrato criado com sucesso!');
      navigate(buildPath(`juridico/${contrato.id}`));
    },
    onError: (error: any) => {
      console.error('Erro ao criar contrato:', error);
      toast.error('Erro ao criar contrato');
    }
  });

  // Vincular a pedido existente
  const handleVincularPedido = async (pedido: any) => {
    console.log('📋 Vinculando pedido:', pedido.id);
    
    let listaPaineis: any[] = [];
    
    if (pedido.proposta_selected_buildings && Array.isArray(pedido.proposta_selected_buildings)) {
      listaPaineis = pedido.proposta_selected_buildings.filter((p: any) => 
        p && (p.building_id || p.id) && (p.building_name || p.nome)
      );
    } else if (pedido.lista_paineis) {
      const parsed = typeof pedido.lista_paineis === 'string' 
        ? JSON.parse(pedido.lista_paineis) 
        : pedido.lista_paineis || [];
      listaPaineis = parsed.filter((p: any) => p && (p.building_id || p.id) && (p.building_name || p.nome));
    }

    const paymentType = pedido.proposta_payment_type || pedido.metodo_pagamento || 'pix_fidelidade';
    const customInstallments = pedido.proposta_custom_installments || [];
    const tipoProduto = pedido.proposta_tipo_produto || pedido.tipo_produto || 'horizontal';

    setContratoData(prev => ({
      ...prev,
      pedido_id: pedido.id,
      proposta_id: pedido.proposal_id || undefined,
      cliente_nome: pedido.proposta_nome || pedido.user_nome || pedido.client_name || '',
      cliente_email: pedido.proposta_email || pedido.user_email || pedido.client_email || '',
      cliente_telefone: pedido.proposta_telefone || pedido.user_telefone || pedido.client_phone || '',
      cliente_cnpj: pedido.proposta_cnpj || pedido.user_cnpj || pedido.client_cnpj || '',
      cliente_razao_social: pedido.proposta_razao_social || pedido.user_razao_social || pedido.client_company || '',
      cliente_segmento: pedido.user_segmento || '',
      cliente_endereco: pedido.user_endereco || '',
      valor_mensal: pedido.proposta_fidel_monthly || pedido.valor_mensal || pedido.valor_total / (pedido.plano_meses || 1),
      valor_total: pedido.proposta_cash_total || pedido.valor_total,
      plano_meses: pedido.proposta_duration_months || pedido.plano_meses || 1,
      dia_vencimento: pedido.dia_vencimento || 10,
      metodo_pagamento: paymentType,
      lista_predios: listaPaineis,
      parcelas: customInstallments,
      data_inicio: pedido.data_inicio || new Date().toISOString().split('T')[0],
      tipo_produto: tipoProduto as TipoProduto
    }));

    if (paymentType === 'custom' && customInstallments.length > 0) {
      toast.info(`Condição personalizada: ${customInstallments.length} parcelas detectadas`);
    }
    
    toast.success(`Pedido vinculado: ${listaPaineis.length} prédio(s)`);
    setStep('cliente');
  };

  const handleSubmit = (enviar: boolean) => {
    if (!contratoData.cliente_nome || !contratoData.cliente_email) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    createContractMutation.mutate({ ...contratoData, enviar });
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'tipo', label: 'Tipo' },
    { key: 'modo', label: 'Modo' },
    { key: 'vinculo', label: 'Dados' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'contrato', label: 'Contrato' },
    { key: 'preview', label: 'Preview' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('juridico'))}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <FileSignature className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Novo Contrato</h1>
            <p className="text-sm text-muted-foreground">Crie um contrato para envio via ClickSign</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                i <= currentStepIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 md:w-8 h-0.5 flex-shrink-0 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card className="max-w-3xl mx-auto p-6 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border-white/50">
        {/* Step 1: Tipo de Contrato */}
        {step === 'tipo' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Selecione o tipo de contrato</h2>
            <RadioGroup 
              value={contratoData.tipo_contrato} 
              onValueChange={(v) => setContratoData(prev => ({ ...prev, tipo_contrato: v as 'anunciante' | 'sindico' }))}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label 
                htmlFor="anunciante" 
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                  contratoData.tipo_contrato === 'anunciante' ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/30'
                }`}
              >
                <RadioGroupItem value="anunciante" id="anunciante" />
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Anunciante</p>
                  <p className="text-sm text-muted-foreground">Contrato de publicidade</p>
                </div>
              </Label>
              <Label 
                htmlFor="sindico" 
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                  contratoData.tipo_contrato === 'sindico' ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/30'
                }`}
              >
                <RadioGroupItem value="sindico" id="sindico" />
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Síndico</p>
                  <p className="text-sm text-muted-foreground">Termo de cessão de espaço</p>
                </div>
              </Label>
            </RadioGroup>
            <div className="flex justify-end">
              <Button onClick={() => setStep('modo')} className="rounded-xl">
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Modo de Preenchimento */}
        {step === 'modo' && contratoData.tipo_contrato === 'anunciante' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Como deseja preencher os dados?</h2>
            <p className="text-sm text-muted-foreground">
              Escolha entre extrair dados de um pedido existente ou preencher manualmente.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setFillMode('extract');
                  setStep('vinculo');
                }}
                className={`flex flex-col items-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                  fillMode === 'extract' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                }`}
              >
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Link2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Extrair do Pedido</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Puxa dados automaticamente de um pedido ou proposta existente
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setFillMode('manual');
                  setStep('cliente');
                }}
                className={`flex flex-col items-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                  fillMode === 'manual' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                }`}
              >
                <div className="p-4 bg-emerald-100 rounded-xl">
                  <Edit3 className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-base">Preencher Manual</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete todos os campos manualmente
                  </p>
                </div>
              </button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('tipo')} className="rounded-xl">
                Voltar
              </Button>
            </div>
          </div>
        )}

        {/* Step 2b: Síndico vai direto para seleção de prédio */}
        {step === 'modo' && contratoData.tipo_contrato === 'sindico' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Selecione o prédio</h2>
            <Select 
              onValueChange={(predioId) => {
                const predio = predios?.find(p => p.id === predioId);
                if (predio) {
                  setContratoData(prev => ({
                    ...prev,
                    lista_predios: [{
                      id: predio.id,
                      building_id: predio.id,
                      building_name: predio.nome,
                      nome: predio.nome,
                      bairro: predio.bairro,
                      endereco: predio.endereco,
                      quantidade_telas: predio.quantidade_telas || 1,
                      visualizacoes_mes: predio.visualizacoes_mes || 0
                    }]
                  }));
                }
              }}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Selecione um prédio" />
              </SelectTrigger>
              <SelectContent>
                {predios?.map(predio => (
                  <SelectItem key={predio.id} value={predio.id}>
                    {predio.nome} - {predio.bairro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('tipo')} className="rounded-xl">
                Voltar
              </Button>
              <Button onClick={() => setStep('cliente')} disabled={contratoData.lista_predios.length === 0} className="rounded-xl">
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Vincular a Pedido (modo extract) */}
        {step === 'vinculo' && fillMode === 'extract' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Selecione um pedido</h2>
            <p className="text-sm text-muted-foreground">
              Escolha um pedido pago para preencher automaticamente os dados do contrato.
            </p>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido por ID ou nome..."
                value={searchPedido}
                onChange={(e) => setSearchPedido(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {pedidos?.map(pedido => (
                <div 
                  key={pedido.id}
                  onClick={() => handleVincularPedido(pedido)}
                  className="p-3 border rounded-xl cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{pedido.client_name || 'Cliente'}</p>
                      <p className="text-sm text-muted-foreground">ID: {pedido.id.slice(0, 8)}...</p>
                      {pedido.proposta_tipo_produto === 'vertical_premium' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1">
                          <Tv className="h-3 w-3" /> Vertical Premium
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(pedido.valor_total)}
                      </p>
                      <p className="text-xs text-muted-foreground">{pedido.plano_meses || 1} meses</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('modo')} className="rounded-xl">
                Voltar
              </Button>
              <Button variant="outline" onClick={() => {
                setFillMode('manual');
                setStep('cliente');
              }} className="rounded-xl">
                Pular (criar manual)
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Dados do Cliente */}
        {step === 'cliente' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Dados do Cliente</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="cliente_nome">Nome Completo *</Label>
                <Input
                  id="cliente_nome"
                  value={contratoData.cliente_nome}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                  placeholder="Nome do representante legal"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="cliente_email">E-mail *</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={contratoData.cliente_email}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_email: e.target.value }))}
                  placeholder="email@empresa.com"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="cliente_telefone">Telefone</Label>
                <Input
                  id="cliente_telefone"
                  value={contratoData.cliente_telefone}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                  placeholder="(45) 99999-9999"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="cliente_cnpj">CNPJ</Label>
                <Input
                  id="cliente_cnpj"
                  value={contratoData.cliente_cnpj}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="cliente_razao_social">Razão Social</Label>
                <Input
                  id="cliente_razao_social"
                  value={contratoData.cliente_razao_social}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_razao_social: e.target.value }))}
                  placeholder="Empresa LTDA"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="cliente_cargo" className="flex items-center gap-2">
                  Cargo
                  {!contratoData.cliente_cargo && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Preencher</span>
                  )}
                </Label>
                <Input
                  id="cliente_cargo"
                  value={contratoData.cliente_cargo}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_cargo: e.target.value }))}
                  placeholder="Sócio-administrador"
                  className={`rounded-xl ${!contratoData.cliente_cargo ? 'border-amber-300 focus:border-amber-500' : ''}`}
                />
              </div>
              <div>
                <Label htmlFor="cliente_segmento" className="flex items-center gap-2">
                  Segmento
                  {!contratoData.cliente_segmento && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Preencher</span>
                  )}
                </Label>
                <Input
                  id="cliente_segmento"
                  value={contratoData.cliente_segmento}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_segmento: e.target.value }))}
                  placeholder="Restaurante, Clínica, etc."
                  className={`rounded-xl ${!contratoData.cliente_segmento ? 'border-amber-300 focus:border-amber-500' : ''}`}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cliente_endereco" className="flex items-center gap-2">
                  Endereço Completo
                  {!contratoData.cliente_endereco && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Preencher</span>
                  )}
                </Label>
                <Input
                  id="cliente_endereco"
                  value={contratoData.cliente_endereco}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_endereco: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className={`rounded-xl ${!contratoData.cliente_endereco ? 'border-amber-300 focus:border-amber-500' : ''}`}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(fillMode === 'extract' ? 'vinculo' : 'modo')} className="rounded-xl">
                Voltar
              </Button>
              <Button onClick={() => setStep('contrato')} className="rounded-xl">
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Dados do Contrato */}
        {step === 'contrato' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Dados do Contrato</h2>
            
            {contratoData.tipo_contrato === 'anunciante' && (
              <>
                {/* Seletor de Tipo de Produto */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tipo de Produto</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (contratoData.tipo_produto !== 'horizontal') {
                          setContratoData(prev => ({ ...prev, tipo_produto: 'horizontal', lista_predios: [] }));
                        }
                      }}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                        contratoData.tipo_produto === 'horizontal' 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <Monitor className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <p className="font-semibold">Horizontal (Padrão)</p>
                        <p className="text-xs text-muted-foreground">Vídeo 15s • 1920x1080 • Loop contínuo</p>
                      </div>
                    </button>

                    <button
                      onClick={handleVerticalPremiumToggle}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                        contratoData.tipo_produto === 'vertical_premium' 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-muted hover:border-purple-300'
                      }`}
                    >
                      <Tv className="h-6 w-6 text-purple-600" />
                      <div className="text-left">
                        <p className="font-semibold text-purple-700">Vertical Premium</p>
                        <p className="text-xs text-muted-foreground">Vídeo 10s • 1080x1920 • Tela cheia a cada 50s</p>
                        <p className="text-[10px] text-purple-600 font-medium mt-1">⚡ Inclui TODOS os prédios</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="plano_meses">Duração (meses)</Label>
                    <Select 
                      value={String(contratoData.plano_meses)}
                      onValueChange={(v) => setContratoData(prev => ({ ...prev, plano_meses: Number(v) }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 mês</SelectItem>
                        <SelectItem value="3">3 meses</SelectItem>
                        <SelectItem value="6">6 meses</SelectItem>
                        <SelectItem value="12">12 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                    <Input
                      id="valor_mensal"
                      type="number"
                      value={contratoData.valor_mensal}
                      onChange={(e) => {
                        const mensal = Number(e.target.value);
                        setContratoData(prev => ({ 
                          ...prev, 
                          valor_mensal: mensal,
                          valor_total: mensal * prev.plano_meses
                        }));
                      }}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor_total">Valor Total (R$)</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      value={contratoData.valor_total}
                      onChange={(e) => setContratoData(prev => ({ ...prev, valor_total: Number(e.target.value) }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dia_vencimento">Dia de Vencimento</Label>
                    <Select 
                      value={String(contratoData.dia_vencimento)}
                      onValueChange={(v) => setContratoData(prev => ({ ...prev, dia_vencimento: Number(v) }))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Dia 5</SelectItem>
                        <SelectItem value="10">Dia 10</SelectItem>
                        <SelectItem value="15">Dia 15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={contratoData.data_inicio}
                      onChange={(e) => setContratoData(prev => ({ ...prev, data_inicio: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Toggle para Pagamento Personalizado Manual */}
                {fillMode === 'manual' && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <Checkbox
                      id="custom-payment"
                      checked={isCustomPaymentManual}
                      onCheckedChange={(checked) => setIsCustomPaymentManual(checked === true)}
                    />
                    <Label htmlFor="custom-payment" className="text-sm cursor-pointer">
                      Usar condição de pagamento personalizada (parcelas com datas e valores específicos)
                    </Label>
                  </div>
                )}

                {/* Pagamento Personalizado Manual */}
                {isCustomPaymentManual && fillMode === 'manual' && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-amber-800">⚡ Parcelas Personalizadas</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={distributeEquallyManual} className="text-xs h-8">
                          Dividir igualmente
                        </Button>
                        <Button variant="ghost" size="sm" onClick={addCustomInstallmentManual} className="text-xs h-8">
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {customInstallmentsManual.map((installment, index) => (
                        <div key={installment.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                          <span className="text-xs font-medium text-muted-foreground w-8">{index + 1}ª</span>
                          <Input
                            type="date"
                            value={formatDateForInput(installment.dueDate)}
                            onChange={(e) => {
                              const dateValue = e.target.value;
                              if (dateValue) {
                                const newDate = new Date(dateValue + 'T00:00:00');
                                if (!isNaN(newDate.getTime())) {
                                  setCustomInstallmentsManual(prev => prev.map(p => 
                                    p.id === installment.id ? { ...p, dueDate: newDate } : p
                                  ));
                                }
                              }
                            }}
                            className="flex-1 h-9 text-sm rounded-lg"
                          />
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              placeholder="0,00"
                              value={installment.amount}
                              onChange={(e) => {
                                setCustomInstallmentsManual(prev => prev.map(p => 
                                  p.id === installment.id ? { ...p, amount: e.target.value } : p
                                ));
                              }}
                              className="pl-8 h-9 text-sm rounded-lg"
                            />
                          </div>
                          {customInstallmentsManual.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomInstallmentManual(installment.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-2 bg-amber-100 rounded flex justify-between items-center">
                      <span className="text-xs font-medium text-amber-800">Total das Parcelas:</span>
                      <span className="font-bold text-amber-900">{formatCurrency(customTotalManual)}</span>
                    </div>
                  </div>
                )}

                {/* Condição de Pagamento do Pedido (se veio de extract) */}
                {contratoData.metodo_pagamento === 'custom' && contratoData.parcelas.length > 0 && fillMode === 'extract' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <Label className="text-amber-800 font-semibold">⚡ Condição Personalizada (do Pedido)</Label>
                    <div className="mt-2 space-y-2">
                      {contratoData.parcelas.map((parcela: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-amber-700">Parcela {parcela.installment || idx + 1}</span>
                          <span className="text-amber-700">{parcela.due_date}</span>
                          <span className="font-semibold text-amber-900">
                            {formatCurrency(Number(parcela.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de Prédios */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Prédios Contratados</Label>
                    {contratoData.tipo_produto !== 'vertical_premium' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllBuildings}
                          className="text-xs h-8 rounded-lg"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selecionar Todos ({predios?.length || 0})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setContratoData(prev => ({ ...prev, lista_predios: [] }))}
                          className="text-xs h-8 rounded-lg"
                        >
                          Limpar
                        </Button>
                      </div>
                    )}
                  </div>

                  {contratoData.tipo_produto === 'vertical_premium' && (
                    <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                      <Tv className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700">
                        Vertical Premium: <strong>{predios?.length || 0} prédios</strong> incluídos automaticamente
                      </span>
                    </div>
                  )}

                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl p-2 space-y-2">
                    {predios?.map(predio => {
                      const isSelected = contratoData.lista_predios.some((p: any) => 
                        (p.building_id || p.id) === predio.id
                      );
                      return (
                        <div 
                          key={predio.id}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted border border-transparent'
                          } ${contratoData.tipo_produto === 'vertical_premium' ? 'opacity-70 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (contratoData.tipo_produto === 'vertical_premium') return;
                            setContratoData(prev => ({
                              ...prev,
                              lista_predios: isSelected
                                ? prev.lista_predios.filter((p: any) => (p.building_id || p.id) !== predio.id)
                                : [...prev.lista_predios, { 
                                    id: predio.id,
                                    building_id: predio.id,
                                    building_name: predio.nome,
                                    nome: predio.nome,
                                    bairro: predio.bairro,
                                    endereco: predio.endereco,
                                    quantidade_telas: predio.quantidade_telas || 1,
                                    visualizacoes_mes: predio.visualizacoes_mes || 0
                                  }]
                            }));
                          }}
                        >
                          <Checkbox 
                            checked={isSelected} 
                            disabled={contratoData.tipo_produto === 'vertical_premium'}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{predio.nome}</p>
                            <p className="text-xs text-muted-foreground">{predio.bairro} • {predio.endereco}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p className="font-medium">📺 {predio.quantidade_telas || 1} tela(s)</p>
                            <p>👁️ {(predio.visualizacoes_mes || 0).toLocaleString()}/mês</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>{contratoData.lista_predios.length} prédio(s) selecionado(s)</span>
                    <span>📺 {totalPaineis} tela(s) • 👁️ {totalVisualizacoes.toLocaleString()} visualizações/mês</span>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="clausulas_especiais">Cláusulas Especiais (opcional)</Label>
              <Textarea
                id="clausulas_especiais"
                value={contratoData.clausulas_especiais}
                onChange={(e) => setContratoData(prev => ({ ...prev, clausulas_especiais: e.target.value }))}
                placeholder="Condições especiais, observações..."
                rows={3}
                className="rounded-xl"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('cliente')} className="rounded-xl">
                Voltar
              </Button>
              <Button onClick={() => setStep('preview')} className="rounded-xl">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Contrato
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Preview e Envio */}
        {step === 'preview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Prévia do Contrato</h2>
            
            <div className="border rounded-xl overflow-hidden max-h-[500px] overflow-y-auto shadow-inner">
              <ContractPreview 
                data={{
                  ...contratoData,
                  parcelas: isCustomPaymentManual 
                    ? customInstallmentsManual.map((p, idx) => ({
                        installment: idx + 1,
                        due_date: formatDateForInput(p.dueDate),
                        amount: parseFloat(p.amount) || 0
                      }))
                    : contratoData.parcelas,
                  metodo_pagamento: isCustomPaymentManual ? 'custom' : contratoData.metodo_pagamento,
                  valor_total: isCustomPaymentManual ? customTotalManual : contratoData.valor_total
                }} 
              />
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <Button variant="outline" onClick={() => setStep('contrato')} className="rounded-xl">
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleSubmit(false)}
                  disabled={createContractMutation.isPending}
                  className="rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button 
                  onClick={() => {
                    setSendEmail(contratoData.cliente_email);
                    setSendNome(contratoData.cliente_nome);
                    setShowSendModal(true);
                  }}
                  disabled={createContractMutation.isPending}
                  className="bg-primary rounded-xl"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Assinatura
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Envio */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Confirmar Envio do Contrato
            </DialogTitle>
            <DialogDescription>
              Verifique os dados antes de enviar para assinatura via ClickSign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="send_nome">Nome do Signatário</Label>
              <Input
                id="send_nome"
                value={sendNome}
                onChange={(e) => setSendNome(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="send_email">E-mail para Assinatura *</Label>
              <Input
                id="send_email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
            
            {contratoData.tipo_produto === 'vertical_premium' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                <Tv className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-700">
                  Contrato <strong>Vertical Premium</strong> - Todos os prédios incluídos
                </span>
              </div>
            )}
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700">
                Ao clicar em "Enviar", o contrato será criado e enviado para o e-mail 
                informado para assinatura digital.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setContratoData(prev => ({ 
                  ...prev, 
                  cliente_email: sendEmail,
                  cliente_nome: sendNome
                }));
                setShowSendModal(false);
                handleSubmit(true);
              }}
              disabled={!sendEmail || createContractMutation.isPending}
              className="rounded-xl"
            >
              {createContractMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Contrato
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovoContratoPage;