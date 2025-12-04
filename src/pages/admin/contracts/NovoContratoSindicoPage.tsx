import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  FileText,
  Send,
  Save,
  Eye,
  Search,
  Users,
  CheckCircle2,
  Wifi,
  WifiOff,
  ChevronRight,
  Scale
} from 'lucide-react';
import ComodatoTemplate from '@/components/admin/contracts/ComodatoTemplate';
import { CustomCheckbox } from '@/components/ui/custom-checkbox';

interface SindicoInteressado {
  id: string;
  nome_completo: string;
  nome_predio: string;
  endereco: string;
  numero_andares: number;
  numero_unidades: number;
  elevadores_sociais?: number;
  elevadores_servico?: number;
  email: string;
  celular: string;
  status: string;
}

const NovoContratoSindicoPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { isMobile } = useResponsiveLayout();
  const [searchParams] = useSearchParams();
  const sindicoIdFromUrl = searchParams.get('sindico_id');

  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [selectedSindico, setSelectedSindico] = useState<SindicoInteressado | null>(null);
  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_sobrenome: '',
    cliente_email: '',
    cliente_telefone: '',
    cliente_cpf: '',
    cliente_cnpj: '',
    cliente_razao_social: '',
    cliente_cargo: 'Síndico',
    cliente_cidade: 'Foz do Iguaçu - PR',
    predio_nome: '',
    predio_endereco: '',
    numero_telas_instaladas: 1,
    posicao_elevador: 'social',
    prazo_aviso_rescisao: 30,
    requer_internet: true,
    clausulas_especiais: '',
    data_inicio: new Date().toISOString().split('T')[0],
  });

  // Fetch síndicos interessados
  const { data: sindicos, isLoading: loadingSindicos } = useQuery({
    queryKey: ['sindicos-interessados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sindicos_interessados')
        .select('*')
        .in('status', ['novo', 'contatado', 'interessado'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SindicoInteressado[];
    }
  });

  // Load sindico from URL param
  useEffect(() => {
    if (sindicoIdFromUrl && sindicos) {
      const sindico = sindicos.find(s => s.id === sindicoIdFromUrl);
      if (sindico) {
        selectSindico(sindico);
      }
    }
  }, [sindicoIdFromUrl, sindicos]);

  const selectSindico = (sindico: SindicoInteressado) => {
    // Separar nome completo em nome e sobrenome
    const nameParts = (sindico.nome_completo || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setSelectedSindico(sindico);
    setFormData(prev => ({
      ...prev,
      cliente_nome: firstName,
      cliente_sobrenome: lastName,
      cliente_email: sindico.email,
      cliente_telefone: sindico.celular,
      predio_nome: sindico.nome_predio,
      predio_endereco: sindico.endereco,
      numero_telas_instaladas: (sindico.elevadores_sociais || 1) + (sindico.elevadores_servico || 0),
      posicao_elevador: sindico.elevadores_servico && sindico.elevadores_servico > 0 ? 'ambos' : 'social',
    }));
    setStep(2);
  };

  const filteredSindicos = sindicos?.filter(s => 
    s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nome_predio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Generate contract number
  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `CTR-CMD-${year}-${random}`;
  };

  // Save contract mutation
  const saveContractMutation = useMutation({
    mutationFn: async (asDraft: boolean) => {
      const contractNumber = generateContractNumber();
      
      // Concatenar nome completo para ClickSign
      const clienteNomeCompleto = `${formData.cliente_nome.trim()} ${formData.cliente_sobrenome.trim()}`.trim();
      
      const contractData = {
        tipo_contrato: 'comodato',
        numero_contrato: contractNumber,
        cliente_nome: clienteNomeCompleto,
        cliente_sobrenome: formData.cliente_sobrenome,
        cliente_email: formData.cliente_email,
        cliente_telefone: formData.cliente_telefone,
        cliente_cpf: formData.cliente_cpf || null,
        cliente_cnpj: formData.cliente_cnpj || null,
        cliente_razao_social: formData.cliente_razao_social || null,
        cliente_cargo: formData.cliente_cargo,
        cliente_cidade: formData.cliente_cidade,
        predio_nome: formData.predio_nome,
        predio_endereco: formData.predio_endereco,
        numero_telas_instaladas: formData.numero_telas_instaladas,
        posicao_elevador: formData.posicao_elevador,
        prazo_aviso_rescisao: formData.prazo_aviso_rescisao,
        requer_internet: formData.requer_internet,
        clausulas_especiais: formData.clausulas_especiais || null,
        data_inicio: formData.data_inicio,
        sindico_id: selectedSindico?.id || null,
        status: asDraft ? 'rascunho' : 'rascunho',
        valor_total: 0,
        valor_mensal: 0,
      };

      const { data, error } = await supabase
        .from('contratos_legais')
        .insert(contractData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Contrato salvo com sucesso!');
      navigate(buildPath(`juridico/${data.id}`));
    },
    onError: (error) => {
      console.error('Erro ao salvar contrato:', error);
      toast.error('Erro ao salvar contrato');
    }
  });

  const steps = [
    { number: 1, title: 'Síndico', icon: Users },
    { number: 2, title: 'Local', icon: Building2 },
    { number: 3, title: 'Equipamento', icon: Scale },
    { number: 4, title: 'Condições', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(buildPath('juridico'))}
              className="h-9 w-9 p-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Novo Contrato Comodato</h1>
              <p className="text-[11px] text-muted-foreground">Síndico/Condomínio</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="h-9 px-3"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>

        {/* Steps indicator */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              return (
                <React.Fragment key={s.number}>
                  <button
                    onClick={() => step >= s.number && setStep(s.number)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                      isActive 
                        ? 'bg-[#9C1E1E] text-white' 
                        : isCompleted 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {!isMobile && <span>{s.title}</span>}
                  </button>
                  {i < steps.length - 1 && (
                    <ChevronRight className={`h-4 w-4 ${isCompleted ? 'text-emerald-500' : 'text-gray-300'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-32">
        {/* Step 1: Selecionar Síndico */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-4 bg-white/80 backdrop-blur-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#9C1E1E]" />
                Selecionar Síndico Interessado
              </h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar síndico ou prédio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {loadingSindicos ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : filteredSindicos.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum síndico encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredSindicos.map(sindico => (
                    <button
                      key={sindico.id}
                      onClick={() => selectSindico(sindico)}
                      className="w-full p-3 rounded-lg border border-gray-200 hover:border-[#9C1E1E] hover:bg-[#9C1E1E]/5 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{sindico.nome_completo}</p>
                          <p className="text-xs text-muted-foreground">{sindico.nome_predio}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{sindico.endereco}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {sindico.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-white/80 backdrop-blur-sm">
              <button
                onClick={() => setStep(2)}
                className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#9C1E1E] transition-colors text-center"
              >
                <FileText className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">Preencher Manualmente</p>
                <p className="text-xs text-muted-foreground">Sem vincular a síndico cadastrado</p>
              </button>
            </Card>
          </div>
        )}

        {/* Step 2: Dados do Local */}
        {step === 2 && (
          <Card className="p-4 bg-white/80 backdrop-blur-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#9C1E1E]" />
              Dados do Local
            </h3>

            <div className="grid gap-4">
              <div>
                <Label>Nome do Edifício *</Label>
                <Input
                  value={formData.predio_nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, predio_nome: e.target.value }))}
                  placeholder="Ex: Edifício Villa Park"
                />
              </div>
              <div>
                <Label>Endereço Completo *</Label>
                <Input
                  value={formData.predio_endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, predio_endereco: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cliente_cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cliente_cidade: e.target.value }))}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm mb-3">Dados do Responsável</h4>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input
                      value={formData.cliente_nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_nome: e.target.value }))}
                      placeholder="Primeiro nome"
                    />
                  </div>
                  <div>
                    <Label>Sobrenome *</Label>
                    <Input
                      value={formData.cliente_sobrenome}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_sobrenome: e.target.value }))}
                      placeholder="Sobrenome"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      value={formData.cliente_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={formData.cliente_telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_telefone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CPF</Label>
                    <Input
                      value={formData.cliente_cpf}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <Input
                      value={formData.cliente_cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_cargo: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>CNPJ do Condomínio (opcional)</Label>
                  <Input
                    value={formData.cliente_cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Equipamento */}
        {step === 3 && (
          <Card className="p-4 bg-white/80 backdrop-blur-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#9C1E1E]" />
              Equipamentos
            </h3>

            <div className="grid gap-4">
              <div>
                <Label>Quantidade de Telas</Label>
                <Select
                  value={String(formData.numero_telas_instaladas)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, numero_telas_instaladas: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} tela(s)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Posição do Elevador</Label>
                <Select
                  value={formData.posicao_elevador}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, posicao_elevador: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Elevador Social</SelectItem>
                    <SelectItem value="servico">Elevador de Serviço</SelectItem>
                    <SelectItem value="ambos">Ambos (Social e Serviço)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {formData.requer_internet ? (
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Requer Internet do Prédio</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.requer_internet ? 'Prédio fornecerá conexão' : 'EXA fornecerá 4G'}
                    </p>
                  </div>
                </div>
                <CustomCheckbox
                  checked={formData.requer_internet}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requer_internet: checked as boolean }))}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Condições */}
        {step === 4 && (
          <Card className="p-4 bg-white/80 backdrop-blur-sm space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#9C1E1E]" />
              Condições do Contrato
            </h3>

            <div className="grid gap-4">
              <div>
                <Label>Prazo para Aviso de Rescisão</Label>
                <Select
                  value={String(formData.prazo_aviso_rescisao)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, prazo_aviso_rescisao: Number(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                />
              </div>

              <div>
                <Label>Cláusulas Especiais (opcional)</Label>
                <Textarea
                  value={formData.clausulas_especiais}
                  onChange={(e) => setFormData(prev => ({ ...prev, clausulas_especiais: e.target.value }))}
                  placeholder="Condições especiais acordadas..."
                  rows={4}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Resumo do Contrato
              </h4>
              <div className="space-y-1 text-sm">
                <p><strong>Local:</strong> {formData.predio_nome || '-'}</p>
                <p><strong>Responsável:</strong> {formData.cliente_nome || '-'}</p>
                <p><strong>Telas:</strong> {formData.numero_telas_instaladas} unidade(s)</p>
                <p><strong>Posição:</strong> {formData.posicao_elevador}</p>
                <p><strong>Internet:</strong> {formData.requer_internet ? 'Prédio fornece' : 'EXA fornece 4G'}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 safe-area-bottom z-50">
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 h-11 bg-[#9C1E1E] hover:bg-[#7D1818]"
              disabled={step === 2 && (!formData.cliente_nome || !formData.cliente_email || !formData.predio_nome)}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => saveContractMutation.mutate(true)}
                disabled={saveContractMutation.isPending}
                className="flex-1 h-11"
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar Rascunho
              </Button>
              <Button
                onClick={() => saveContractMutation.mutate(false)}
                disabled={saveContractMutation.isPending}
                className="flex-1 h-11 bg-[#9C1E1E] hover:bg-[#7D1818]"
              >
                <Send className="h-4 w-4 mr-1" />
                Criar Contrato
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Contrato de Comodato</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <ComodatoTemplate data={formData} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NovoContratoSindicoPage;
