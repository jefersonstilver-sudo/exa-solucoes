import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Save, Loader2, User, Building2, Phone, Mail, Globe, MapPin, Sparkles, FileText, CheckCircle, Info, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Contact, CategoriaContato, OrigemContato } from '@/types/contatos';
import { useContatos } from '@/hooks/contatos';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { toast } from 'sonner';
import { NameInput } from '@/components/ui/name-input';

// Tipos de categoria para a Etapa 1
const CATEGORY_OPTIONS = [
  {
    value: 'lead' as CategoriaContato,
    label: 'Lead Comercial',
    description: 'Potencial cliente interessado em serviços ou produtos. Foco em conversão.',
    icon: '🎯',
    bgColor: 'bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    value: 'sindico_lead' as CategoriaContato,
    label: 'Síndico Lead',
    description: 'Responsável por condomínios com potencial de contratação de gestão.',
    icon: '🏢',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    value: 'anunciante' as CategoriaContato,
    label: 'Anunciante',
    description: 'Parceiro interessado em espaços publicitários ou patrocínios.',
    icon: '📢',
    bgColor: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    value: 'parceiro_exa' as CategoriaContato,
    label: 'Parceiro Estratégico',
    description: 'Aliado comercial para indicações mútuas e crescimento conjunto.',
    icon: '🤝',
    bgColor: 'bg-pink-50',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  {
    value: 'cliente' as CategoriaContato,
    label: 'Cliente Ativo',
    description: 'Cliente já convertido. Foco em retenção e upsell.',
    icon: '✅',
    bgColor: 'bg-teal-50',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  {
    value: 'outros' as CategoriaContato,
    label: 'Outro',
    description: 'Categoria personalizada ou não listada acima.',
    icon: '•••',
    bgColor: 'bg-gray-50',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600'
  },
];

const ORIGEM_OPTIONS: { value: OrigemContato; label: string; group: string }[] = [
  { value: 'site', label: 'Checkout do Site', group: 'Digital' },
  { value: 'google', label: 'Google / Busca', group: 'Digital' },
  { value: 'instagram', label: 'Instagram', group: 'Digital' },
  { value: 'email', label: 'Email Marketing', group: 'Digital' },
  { value: 'cadastro_manual', label: 'Cadastro Manual', group: 'Offline / Direto' },
  { value: 'indicacao', label: 'Indicação de Cliente', group: 'Offline / Direto' },
  { value: 'telefone', label: 'Ligação Ativa', group: 'Offline / Direto' },
  { value: 'rua', label: 'Evento / Networking', group: 'Offline / Direto' },
  { value: 'outros', label: 'Outros', group: 'Offline / Direto' },
];

const QUICK_TAGS = ['Decisor', 'Orçamento Aprovado', 'Urgente', 'Investigação'];

const DORES_OPTIONS = [
  { id: 'baixa_conversao', label: 'Baixa conversão de leads', icon: '📉' },
  { id: 'processos_manuais', label: 'Processos manuais', icon: '⚙️' },
  { id: 'falta_visibilidade', label: 'Falta de visibilidade', icon: '👁️' },
  { id: 'ticket_baixo', label: 'Ticket médio baixo', icon: '💳' },
];

const PUBLICO_TAGS = ['B2B', 'B2C', 'Classe A/B', 'PME'];

const NovoContatoPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { createContact } = useContatos();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<Partial<Contact> & { 
    notifyTeam?: boolean; 
    addToWatchlist?: boolean;
    selectedDores?: string[];
    selectedPublico?: string[];
    canaisAtuais?: string[];
    outraDor?: string;
  }>({
    nome: '',
    sobrenome: '',
    empresa: '',
    cargo_tomador: '',
    telefone: '',
    email: '',
    website: '',
    endereco: '',
    cnpj: '',
    categoria: undefined,
    origem: undefined,
    publico_alvo: '',
    dores_identificadas: '',
    observacoes_estrategicas: '',
    notifyTeam: true,
    addToWatchlist: false,
    selectedDores: [],
    selectedPublico: [],
    canaisAtuais: [],
    outraDor: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (category: CategoriaContato) => {
    handleChange('categoria', category);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.categoria) {
      toast.error('Selecione uma categoria para continuar');
      return;
    }
    if (currentStep === 2) {
      if (!formData.nome || !formData.sobrenome) {
        toast.error('Preencha o nome e sobrenome');
        return;
      }
      if (!formData.telefone || !formData.email) {
        toast.error('Preencha telefone e email');
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.telefone || !formData.categoria) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const contactData: Partial<Contact> = {
        ...formData,
        dores_identificadas: formData.selectedDores?.join(', ') || formData.outraDor || '',
        publico_alvo: formData.selectedPublico?.join(', ') || formData.publico_alvo || '',
      };
      
      const newContact = await createContact(contactData);
      toast.success('Contato criado com sucesso!');
      navigate(buildPath(`contatos/${newContact.id}`));
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error('Erro ao criar contato');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(buildPath('contatos'));
  };

  const toggleDor = (dorId: string) => {
    const current = formData.selectedDores || [];
    const updated = current.includes(dorId) 
      ? current.filter(d => d !== dorId)
      : [...current, dorId];
    handleChange('selectedDores', updated);
  };

  const togglePublico = (tag: string) => {
    const current = formData.selectedPublico || [];
    const updated = current.includes(tag) 
      ? current.filter(t => t !== tag)
      : [...current, tag];
    handleChange('selectedPublico', updated);
  };

  const addCanal = (canal: string) => {
    const current = formData.canaisAtuais || [];
    if (!current.includes(canal) && canal.trim()) {
      handleChange('canaisAtuais', [...current, canal.trim()]);
    }
  };

  const removeCanal = (canal: string) => {
    const current = formData.canaisAtuais || [];
    handleChange('canaisAtuais', current.filter(c => c !== canal));
  };

  const addQuickTag = (tag: string) => {
    const current = formData.observacoes_estrategicas || '';
    const tagText = `[${tag}] `;
    if (!current.includes(tagText)) {
      handleChange('observacoes_estrategicas', current + tagText);
    }
  };

  // Render stepper header
  const renderStepper = () => {
    const steps = [
      { num: 1, label: 'Tipo' },
      { num: 2, label: 'Identidade' },
      { num: 3, label: 'Detalhes' },
      { num: 4, label: currentStep === 4 ? '' : '' },
    ];

    return (
      <div className="flex items-center justify-center w-full">
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className="flex items-center">
              {currentStep > step.num ? (
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 border border-green-200 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              ) : currentStep === step.num ? (
                <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center text-base font-bold shadow-lg z-10">
                  {step.num}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-sm font-semibold">
                  {step.num}
                </div>
              )}
              {step.label && (
                <span className={`ml-2 text-sm font-medium hidden sm:block ${
                  currentStep > step.num ? 'text-green-700' : 
                  currentStep === step.num ? 'text-gray-900 font-bold' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 md:w-16 h-px mx-2 ${
                currentStep > step.num ? 'bg-green-200' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Step 1: Category Selection
  const renderStep1 = () => (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-white border-gray-100 shadow-sm rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900">Iniciar Dossiê do Contato</h3>
            <p className="text-sm text-gray-500 mt-1">Selecione a categoria do novo contato.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleCategorySelect(cat.value)}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                  formData.categoria === cat.value 
                    ? 'border-red-500 bg-red-50/50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-full ${cat.iconBg} flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{cat.label}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{cat.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 2: Identity Form
  const renderStep2 = () => (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="bg-white border-gray-100 shadow-sm rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Dados Pessoais & Corporativos</h3>
              <p className="text-sm text-gray-500">Informações primárias para identificação do contato.</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Nome e Sobrenome */}
            <NameInput
              firstName={formData.nome || ''}
              lastName={formData.sobrenome || ''}
              onFirstNameChange={(v) => handleChange('nome', v)}
              onLastNameChange={(v) => handleChange('sobrenome', v)}
              required
              firstNameLabel="NOME"
              lastNameLabel="SOBRENOME"
              firstNamePlaceholder="Ex: Ana"
              lastNamePlaceholder="Ex: Souza"
              className="gap-6"
            />

            {/* Empresa e CNPJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.empresa || ''}
                    onChange={(e) => handleChange('empresa', e.target.value)}
                    placeholder="Nome da empresa"
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wide">CNPJ</Label>
                <Input
                  value={formData.cnpj || ''}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="h-11 bg-gray-50/50 border-gray-200"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Telefone e Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Telefone Principal <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.telefone || ''}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Email Corporativo <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="nome@empresa.com"
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Website / LinkedIn</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://..."
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Endereço Completo</Label>
              <Textarea
                value={formData.endereco || ''}
                onChange={(e) => handleChange('endereco', e.target.value)}
                placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                className="bg-gray-50/50 border-gray-200 resize-none"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 3: Intelligence Details
  const renderStep3 = () => (
    <div className="w-full max-w-2xl mx-auto">
      {/* Info Banner */}
      <Card className="bg-white border-gray-100 shadow-sm rounded-xl mb-6">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-lg">Detalhes de Inteligência</h3>
            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
              Informar a origem correta do contato ajuda a rastrear a eficiência das campanhas de marketing e canais de aquisição. Utilize o campo de observações para detalhes sensíveis ou estratégicos.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Origem */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-500" />
              Origem do Contato <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.origem}
              onValueChange={(v) => handleChange('origem', v as OrigemContato)}
            >
              <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200">
                <SelectValue placeholder="Selecione a origem..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Digital</div>
                {ORIGEM_OPTIONS.filter(o => o.group === 'Digital').map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 mt-2">Offline / Direto</div>
                {ORIGEM_OPTIONS.filter(o => o.group === 'Offline / Direto').map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 pl-1">Selecione o canal principal onde este contato foi iniciado.</p>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Observações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                Observações Internas
              </Label>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Opcional</span>
            </div>
            <div className="relative">
              <Textarea
                value={formData.observacoes_estrategicas || ''}
                onChange={(e) => handleChange('observacoes_estrategicas', e.target.value)}
                placeholder="Digite informações relevantes sobre o perfil, contexto da negociação ou detalhes pessoais importantes para o relacionamento..."
                className="bg-gray-50/50 border-gray-200 resize-none h-40"
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                Máx. 500 caracteres
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addQuickTag(tag)}
                  className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-100 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: Review & Confirm
  const renderStep4 = () => {
    const selectedCategory = CATEGORY_OPTIONS.find(c => c.value === formData.categoria);
    
    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-800 font-medium">Revise as informações antes de salvar.</p>
            <p className="text-blue-600 text-sm">
              Este é o resumo do dossiê criado. As métricas de inteligência comercial serão processadas definitivamente após a confirmação.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Contact Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-100 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                {/* Contact Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
                      <span className="text-xs">✏️</span>
                    </button>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formData.nome} {formData.sobrenome}
                    </h2>
                    {formData.cargo_tomador && (
                      <p className="text-gray-600">{formData.cargo_tomador}</p>
                    )}
                    {formData.empresa && (
                      <p className="text-green-600 font-medium">{formData.empresa}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {selectedCategory && (
                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                          {selectedCategory.label}
                        </Badge>
                      )}
                      {formData.origem && (
                        <Badge variant="outline" className="border-gray-200 text-gray-600">
                          {ORIGEM_OPTIONS.find(o => o.value === formData.origem)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Corporativo</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {formData.email || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Telefone Principal</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      {formData.telefone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Origem do Contato</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      {ORIGEM_OPTIONS.find(o => o.value === formData.origem)?.label || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Localização</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      {formData.endereco ? formData.endereco.substring(0, 30) + '...' : 'Não informado'}
                    </p>
                  </div>
                </div>

                {/* Notes Section */}
                {formData.observacoes_estrategicas && (
                  <Card className="bg-gray-50 border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-gray-900 text-sm">Notas Iniciais</span>
                      </div>
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        "{formData.observacoes_estrategicas}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Intelligence Panel */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span className="font-semibold">Inteligência EXA</span>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                    PREVIEW
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/70 uppercase tracking-wide">Pontuação Estimada</span>
                      <span className="text-xs text-orange-400 animate-pulse">Calculando...</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-green-400 rounded-full animate-pulse" />
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      O cálculo definitivo de <span className="text-white">fit comercial</span> será gerado após o salvamento dos dados.
                    </p>
                  </div>

                  <div className="h-px bg-white/10" />

                  <div>
                    <span className="text-xs text-white/70 uppercase tracking-wide">Bloqueio de Ações</span>
                    <div className="mt-2 p-3 bg-green-500/20 rounded-lg border border-green-500/30 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Sem Restrições</p>
                        <p className="text-xs text-green-300">Contato livre para abordagem.</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                      Nenhuma duplicidade ou bloqueio de compliance encontrado preliminarmente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
              <CardContent className="p-4 space-y-4">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  Configurações do Dossiê
                </span>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Adicionar à Watchlist</span>
                  <Switch
                    checked={formData.addToWatchlist}
                    onCheckedChange={(v) => handleChange('addToWatchlist', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Notificar Time de Vendas</span>
                  <Switch
                    checked={formData.notifyTeam}
                    onCheckedChange={(v) => handleChange('notifyTeam', v)}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="w-8 h-8 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
              {currentStep === 1 ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <ArrowLeft className="w-3 h-3" />
                    <span>Voltar para Contatos</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
                    Novo Contato
                  </h2>
                </>
              ) : currentStep === 4 ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide mb-1">
                    <span>Contatos</span>
                    <span>›</span>
                    <span>Novo Contato</span>
                    <span>›</span>
                    <span className="text-red-500 font-bold">Confirmação</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Resumo do Contato</h2>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span>Contatos</span>
                    <span>›</span>
                    <span className="text-red-500">Novo Contato</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {currentStep === 2 ? 'Identidade do Contato' : 'Inteligência Comercial'}
                  </h2>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Etapa 1 de 3: Classificação Inicial
              </div>
            )}
            {currentStep === 4 && (
              <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <Check className="w-4 h-4" />
                Passo 3 de 3
              </div>
            )}
            {currentStep !== 1 && currentStep !== 4 && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                  <HelpCircle className="w-5 h-5 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancel} className="w-8 h-8 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* Stepper - only show on steps 2, 3 */}
        {(currentStep === 2 || currentStep === 3) && (
          <div className="mb-10">
            {renderStepper()}
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Footer Actions */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between mt-8 mb-12">
          {currentStep === 1 ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="px-6">
                Cancelar
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!formData.categoria}
                className="px-8 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              >
                Próximo: Dados Básicos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : currentStep === 4 ? (
            <>
              <Button variant="outline" onClick={handlePrevStep} className="px-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Contato
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handlePrevStep} className="px-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleNextStep}
                className="px-8 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              >
                {currentStep === 3 ? 'Revisar e Salvar' : 'Próximo'}
                {currentStep === 3 ? <CheckCircle className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovoContatoPage;
