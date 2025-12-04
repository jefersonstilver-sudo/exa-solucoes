import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  FileSignature,
  Users,
  Building2,
  Loader2,
  Send,
  Save,
  Eye,
  Search
} from 'lucide-react';
import ContractPreview from '@/components/admin/contracts/ContractPreview';

type Step = 'tipo' | 'vinculo' | 'cliente' | 'contrato' | 'preview';

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
}

const NovoContratoPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buildPath } = useAdminBasePath();
  const { session } = useAuth();
  const [step, setStep] = useState<Step>('tipo');
  const [searchPedido, setSearchPedido] = useState('');
  
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
    data_inicio: new Date().toISOString().split('T')[0]
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
        query = query.or(`id.ilike.%${searchPedido}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: step === 'vinculo'
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

  // Criar contrato
  const createContractMutation = useMutation({
    mutationFn: async (data: ContratoData & { enviar: boolean }) => {
      // Gerar número do contrato
      const { data: numeroContrato } = await supabase.rpc('generate_contract_number');

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
        valor_total: data.valor_total,
        plano_meses: data.plano_meses,
        dia_vencimento: data.dia_vencimento,
        metodo_pagamento: data.metodo_pagamento,
        lista_predios: data.lista_predios,
        parcelas: data.parcelas,
        clausulas_especiais: data.clausulas_especiais,
        total_paineis: data.lista_predios.reduce((acc: number, p: any) => acc + (p.quantidade_telas || 1), 0),
        data_inicio: data.data_inicio,
        status: data.enviar ? 'enviado' : 'rascunho',
        criado_por: session?.user?.id
      };

      const { data: contrato, error } = await supabase
        .from('contratos_legais')
        .insert(contratoPayload)
        .select()
        .single();

      if (error) throw error;

      // Se enviar, chamar ClickSign
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
      navigate(buildPath(`contratos/${contrato.id}`));
    },
    onError: (error: any) => {
      console.error('Erro ao criar contrato:', error);
      toast.error('Erro ao criar contrato');
    }
  });

  // Vincular a pedido existente
  const handleVincularPedido = (pedido: any) => {
    const listaPaineis = typeof pedido.lista_paineis === 'string' 
      ? JSON.parse(pedido.lista_paineis) 
      : pedido.lista_paineis || [];

    setContratoData(prev => ({
      ...prev,
      pedido_id: pedido.id,
      cliente_nome: pedido.client_name || '',
      cliente_email: pedido.client_email || '',
      cliente_telefone: pedido.client_phone || '',
      cliente_cnpj: pedido.client_cnpj || '',
      cliente_razao_social: pedido.client_company || '',
      valor_mensal: pedido.valor_mensal || pedido.valor_total / (pedido.plano_meses || 1),
      valor_total: pedido.valor_total,
      plano_meses: pedido.plano_meses || 1,
      dia_vencimento: pedido.dia_vencimento || 10,
      metodo_pagamento: pedido.metodo_pagamento || 'pix_fidelidade',
      lista_predios: listaPaineis,
      data_inicio: pedido.data_inicio || new Date().toISOString().split('T')[0]
    }));

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
    { key: 'vinculo', label: 'Vínculo' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'contrato', label: 'Contrato' },
    { key: 'preview', label: 'Preview' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('contratos'))}>
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
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                i <= currentStepIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${i < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <Card className="max-w-3xl mx-auto p-6 bg-white/80 backdrop-blur-sm">
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
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  contratoData.tipo_contrato === 'anunciante' ? 'border-primary bg-primary/5' : 'border-muted'
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
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  contratoData.tipo_contrato === 'sindico' ? 'border-primary bg-primary/5' : 'border-muted'
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
              <Button onClick={() => setStep('vinculo')}>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Vincular a Pedido */}
        {step === 'vinculo' && contratoData.tipo_contrato === 'anunciante' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Vincular a um pedido existente?</h2>
            <p className="text-sm text-muted-foreground">
              Selecione um pedido pago para preencher automaticamente os dados do contrato.
            </p>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido por ID..."
                value={searchPedido}
                onChange={(e) => setSearchPedido(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {pedidos?.map(pedido => (
                <div 
                  key={pedido.id}
                  onClick={() => handleVincularPedido(pedido)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{pedido.users?.full_name || 'Cliente'}</p>
                      <p className="text-sm text-muted-foreground">{pedido.users?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                      </p>
                      <p className="text-xs text-muted-foreground">{pedido.plano_meses || 1} meses</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('tipo')}>
                Voltar
              </Button>
              <Button variant="outline" onClick={() => setStep('cliente')}>
                Pular (criar manual)
              </Button>
            </div>
          </div>
        )}

        {/* Step 2b: Síndico vai direto para cliente */}
        {step === 'vinculo' && contratoData.tipo_contrato === 'sindico' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Selecione o prédio</h2>
            <Select 
              onValueChange={(predioId) => {
                const predio = predios?.find(p => p.id === predioId);
                if (predio) {
                  setContratoData(prev => ({
                    ...prev,
                    lista_predios: [predio]
                  }));
                }
              }}
            >
              <SelectTrigger>
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
              <Button variant="outline" onClick={() => setStep('tipo')}>
                Voltar
              </Button>
              <Button onClick={() => setStep('cliente')} disabled={contratoData.lista_predios.length === 0}>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Dados do Cliente */}
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
                />
              </div>
              <div>
                <Label htmlFor="cliente_telefone">Telefone</Label>
                <Input
                  id="cliente_telefone"
                  value={contratoData.cliente_telefone}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                  placeholder="(45) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="cliente_cnpj">CNPJ</Label>
                <Input
                  id="cliente_cnpj"
                  value={contratoData.cliente_cnpj}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div>
                <Label htmlFor="cliente_razao_social">Razão Social</Label>
                <Input
                  id="cliente_razao_social"
                  value={contratoData.cliente_razao_social}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_razao_social: e.target.value }))}
                  placeholder="Empresa LTDA"
                />
              </div>
              <div>
                <Label htmlFor="cliente_cargo">Cargo</Label>
                <Input
                  id="cliente_cargo"
                  value={contratoData.cliente_cargo}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_cargo: e.target.value }))}
                  placeholder="Sócio-administrador"
                />
              </div>
              <div>
                <Label htmlFor="cliente_segmento">Segmento</Label>
                <Input
                  id="cliente_segmento"
                  value={contratoData.cliente_segmento}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_segmento: e.target.value }))}
                  placeholder="Restaurante, Clínica, etc."
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cliente_endereco">Endereço Completo</Label>
                <Input
                  id="cliente_endereco"
                  value={contratoData.cliente_endereco}
                  onChange={(e) => setContratoData(prev => ({ ...prev, cliente_endereco: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('vinculo')}>
                Voltar
              </Button>
              <Button onClick={() => setStep('contrato')}>
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Dados do Contrato */}
        {step === 'contrato' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Dados do Contrato</h2>
            
            {contratoData.tipo_contrato === 'anunciante' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="plano_meses">Duração (meses)</Label>
                    <Select 
                      value={String(contratoData.plano_meses)}
                      onValueChange={(v) => setContratoData(prev => ({ ...prev, plano_meses: Number(v) }))}
                    >
                      <SelectTrigger>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="valor_total">Valor Total (R$)</Label>
                    <Input
                      id="valor_total"
                      type="number"
                      value={contratoData.valor_total}
                      onChange={(e) => setContratoData(prev => ({ ...prev, valor_total: Number(e.target.value) }))}
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
                      <SelectTrigger>
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
                    />
                  </div>
                </div>

                {/* Lista de Prédios */}
                <div>
                  <Label>Prédios Contratados</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {predios?.map(predio => {
                      const isSelected = contratoData.lista_predios.some((p: any) => p.id === predio.id);
                      return (
                        <div 
                          key={predio.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}
                          onClick={() => {
                            setContratoData(prev => ({
                              ...prev,
                              lista_predios: isSelected
                                ? prev.lista_predios.filter((p: any) => p.id !== predio.id)
                                : [...prev.lista_predios, predio]
                            }));
                          }}
                        >
                          <Checkbox checked={isSelected} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{predio.nome}</p>
                            <p className="text-xs text-muted-foreground">{predio.bairro}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {predio.quantidade_telas || 1} tela(s)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contratoData.lista_predios.length} prédio(s) selecionado(s)
                  </p>
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
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('cliente')}>
                Voltar
              </Button>
              <Button onClick={() => setStep('preview')}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Contrato
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Preview e Envio */}
        {step === 'preview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Prévia do Contrato</h2>
            
            <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              <ContractPreview data={contratoData} />
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <Button variant="outline" onClick={() => setStep('contrato')}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleSubmit(false)}
                  disabled={createContractMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Rascunho
                </Button>
                <Button 
                  onClick={() => handleSubmit(true)}
                  disabled={createContractMutation.isPending}
                  className="bg-primary"
                >
                  {createContractMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar para Assinatura
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NovoContratoPage;
