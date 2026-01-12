import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Repeat,
  TrendingDown,
  Loader2,
  Building2,
  Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CategoriaTreeSelect } from './categorias/CategoriaTreeSelect';
import { useCategoriaHierarchy } from '@/hooks/useCategoriaHierarchy';
import { useActiveBuildingNames } from '@/hooks/useActiveBuildingNames';

interface NovaDespesaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Fornecedor {
  id: string;
  nome_fantasia: string;
  razao_social: string;
}

interface BuildingOption {
  id: string;
  nome: string;
}

type Periodicidade = 'semanal' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

const PERIODICIDADE_OPTIONS: { value: Periodicidade; label: string; meses: number; semanas?: number }[] = [
  { value: 'semanal', label: 'Semanal', meses: 0.25, semanas: 1 },
  { value: 'mensal', label: 'Mensal', meses: 1 },
  { value: 'trimestral', label: 'Trimestral', meses: 3 },
  { value: 'semestral', label: 'Semestral', meses: 6 },
  { value: 'anual', label: 'Anual', meses: 12 },
];

const DIAS_VENCIMENTO = [1, 5, 10, 15, 20, 25, 28];

// Palavras-chave que exigem fornecedor obrigatório
const INTERNET_KEYWORDS = ['internet', 'provedor', 'telecom', 'fibra', 'banda larga', 'wifi', 'conectividade'];

export const NovaDespesaModal: React.FC<NovaDespesaModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'fixa' | 'variavel'>('fixa');
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  
  // Hook para obter nome da categoria
  const { getCategoriaPath } = useCategoriaHierarchy();
  
  // Form state - Despesa Fixa
  const [fixaForm, setFixaForm] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    periodicidade: 'mensal' as Periodicidade,
    dia_vencimento: 10,
    data_primeiro_lancamento: format(new Date(), 'yyyy-MM-dd'),
    observacao: '',
    fornecedor_id: '',
  });
  
  // Form state - Despesa Variável
  const [variavelForm, setVariavelForm] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: format(new Date(), 'yyyy-MM-dd'),
    pago: false,
    observacao: '',
    fornecedor_id: '',
  });

  // Buscar fornecedores e prédios ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchFornecedores();
      fetchBuildings();
    }
  }, [open]);

  const fetchFornecedores = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('id, nome_fantasia, razao_social')
      .eq('ativo', true)
      .order('nome_fantasia');
    
    if (!error && data) {
      setFornecedores(data);
    }
  };

  const fetchBuildings = async () => {
    const { data, error } = await supabase
      .from('buildings')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome');
    
    if (!error && data) {
      setBuildings(data);
    }
  };

  // Verificar se categoria selecionada exige fornecedor
  const isFornecedorObrigatorio = (categoriaId: string, descricao: string): boolean => {
    const categoriaPath = getCategoriaPath(categoriaId).toLowerCase();
    const descricaoLower = descricao.toLowerCase();
    
    return INTERNET_KEYWORDS.some(keyword => 
      categoriaPath.includes(keyword) || descricaoLower.includes(keyword)
    );
  };

  const toggleBuilding = (buildingId: string) => {
    setSelectedBuildings(prev => 
      prev.includes(buildingId) 
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const selectAllBuildings = () => {
    setSelectedBuildings(buildings.map(b => b.id));
  };

  const clearBuildings = () => {
    setSelectedBuildings([]);
  };

  const handleSubmitFixa = async () => {
    // Validações
    if (!fixaForm.descricao.trim()) {
      toast.error('Informe a descrição da despesa');
      return;
    }
    if (!fixaForm.valor || parseFloat(fixaForm.valor) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!fixaForm.categoria_id) {
      toast.error('Selecione uma categoria');
      return;
    }
    
    // Validar fornecedor se for categoria de Internet
    if (isFornecedorObrigatorio(fixaForm.categoria_id, fixaForm.descricao) && !fixaForm.fornecedor_id) {
      toast.error('Selecione um provedor de internet');
      return;
    }

    setLoading(true);
    try {
      const valorNumerico = parseFloat(fixaForm.valor.replace(',', '.'));
      const categoriaNome = getCategoriaPath(fixaForm.categoria_id);
      
      // Inserir despesa fixa
      const insertData: any = {
        descricao: fixaForm.descricao.trim(),
        valor: valorNumerico,
        categoria: categoriaNome || 'Outros',
        categoria_id: fixaForm.categoria_id,
        periodicidade: fixaForm.periodicidade,
        observacao: fixaForm.observacao.trim() || null,
        ativo: true,
        fornecedor_id: fixaForm.fornecedor_id || null,
      };

      // Para semanal, usa data_primeiro_lancamento; para outros, usa dia_vencimento
      if (fixaForm.periodicidade === 'semanal') {
        insertData.data_primeiro_lancamento = fixaForm.data_primeiro_lancamento;
        insertData.dia_vencimento = null;
      } else {
        insertData.dia_vencimento = fixaForm.dia_vencimento;
        insertData.data_primeiro_lancamento = null;
      }

      const { data: despesaCriada, error } = await supabase
        .from('despesas_fixas')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Inserir vínculos com prédios se houver selecionados
      if (selectedBuildings.length > 0 && despesaCriada) {
        const prediosVinculos = selectedBuildings.map(buildingId => ({
          despesa_fixa_id: despesaCriada.id,
          building_id: buildingId,
        }));
        
        // Usar any temporariamente até os tipos serem regenerados
        const { error: vinculoError } = await (supabase as any)
          .from('despesas_predios')
          .insert(prediosVinculos);
        
        if (vinculoError) {
          console.error('Erro ao vincular prédios:', vinculoError);
          // Não falhar a operação, apenas avisar
          toast.warning('Despesa criada, mas houve erro ao vincular prédios');
        }
      }

      // Parcelas são geradas automaticamente via trigger no banco de dados
      toast.success('Despesa fixa criada com sucesso!');
      resetForms();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar despesa fixa:', error);
      toast.error(error.message || 'Erro ao criar despesa fixa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVariavel = async () => {
    // Validações
    if (!variavelForm.descricao.trim()) {
      toast.error('Informe a descrição da despesa');
      return;
    }
    if (!variavelForm.valor || parseFloat(variavelForm.valor) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }
    if (!variavelForm.categoria_id) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (!variavelForm.data) {
      toast.error('Informe a data da despesa');
      return;
    }

    setLoading(true);
    try {
      const valorNumerico = parseFloat(variavelForm.valor.replace(',', '.'));
      const categoriaNome = getCategoriaPath(variavelForm.categoria_id);
      
      const { error } = await supabase
        .from('despesas_variaveis')
        .insert([{
          descricao: variavelForm.descricao.trim(),
          valor: valorNumerico,
          categoria: categoriaNome || 'Outros',
          categoria_id: variavelForm.categoria_id,
          data: variavelForm.data,
          pago: variavelForm.pago,
          observacao: variavelForm.observacao.trim() || null,
        }]);

      if (error) throw error;

      toast.success('Despesa variável registrada!');
      resetForms();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar despesa variável:', error);
      toast.error(error.message || 'Erro ao registrar despesa');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setFixaForm({
      descricao: '',
      valor: '',
      categoria_id: '',
      periodicidade: 'mensal',
      dia_vencimento: 10,
      data_primeiro_lancamento: format(new Date(), 'yyyy-MM-dd'),
      observacao: '',
      fornecedor_id: '',
    });
    setVariavelForm({
      descricao: '',
      valor: '',
      categoria_id: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      data_vencimento: format(new Date(), 'yyyy-MM-dd'),
      pago: false,
      observacao: '',
      fornecedor_id: '',
    });
    setSelectedBuildings([]);
    setActiveTab('fixa');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            Nova Despesa
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fixa' | 'variavel')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="fixa" className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Fixa (Recorrente)
            </TabsTrigger>
            <TabsTrigger value="variavel" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Variável (Única)
            </TabsTrigger>
          </TabsList>

          {/* TAB: DESPESA FIXA */}
          <TabsContent value="fixa" className="space-y-4">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="fixa-descricao" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Nome da Despesa
              </Label>
              <Input
                id="fixa-descricao"
                placeholder="Ex: Aluguel do escritório"
                value={fixaForm.descricao}
                onChange={(e) => setFixaForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            {/* Valor e Periodicidade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fixa-valor" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Valor (R$)
                </Label>
                <Input
                  id="fixa-valor"
                  type="text"
                  placeholder="0,00"
                  value={fixaForm.valor}
                  onChange={(e) => setFixaForm(prev => ({ ...prev, valor: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5" />
                  Frequência
                </Label>
                <Select 
                  value={fixaForm.periodicidade} 
                  onValueChange={(v) => setFixaForm(prev => ({ ...prev, periodicidade: v as Periodicidade }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODICIDADE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categoria (TreeSelect) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Categoria
              </Label>
              <CategoriaTreeSelect
                value={fixaForm.categoria_id}
                onChange={(v) => setFixaForm(prev => ({ ...prev, categoria_id: v }))}
                fluxo="saida"
                placeholder="Selecione uma categoria..."
                allowCreate={true}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            {/* Fornecedor/Provedor - Obrigatório para Internet */}
            {isFornecedorObrigatorio(fixaForm.categoria_id, fixaForm.descricao) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Wifi className="h-3.5 w-3.5" />
                  Provedor de Internet *
                </Label>
                <Select 
                  value={fixaForm.fornecedor_id} 
                  onValueChange={(v) => setFixaForm(prev => ({ ...prev, fornecedor_id: v }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Selecione o provedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome_fantasia || f.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Prédios vinculados - Multi-select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Prédios Vinculados
                </Label>
                <div className="flex gap-2 text-xs">
                  <button 
                    type="button" 
                    onClick={selectAllBuildings}
                    className="text-primary hover:underline"
                  >
                    Todos
                  </button>
                  <span className="text-gray-300">|</span>
                  <button 
                    type="button" 
                    onClick={clearBuildings}
                    className="text-muted-foreground hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <ScrollArea className="h-32 border rounded-lg p-2 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  {buildings.map(b => (
                    <label 
                      key={b.id} 
                      className="flex items-center gap-2 cursor-pointer hover:bg-white p-1.5 rounded transition-colors"
                    >
                      <Checkbox 
                        checked={selectedBuildings.includes(b.id)} 
                        onCheckedChange={() => toggleBuilding(b.id)}
                      />
                      <span className="text-sm text-gray-700 truncate">{b.nome}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              {selectedBuildings.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedBuildings.length} prédio(s) selecionado(s)
                </p>
              )}
            </div>

            {/* Dia de Vencimento ou Data do Primeiro Lançamento */}
            {fixaForm.periodicidade === 'semanal' ? (
              <div className="space-y-2">
                <Label htmlFor="fixa-data-inicial" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Data do Primeiro Lançamento
                </Label>
                <Input
                  id="fixa-data-inicial"
                  type="date"
                  value={fixaForm.data_primeiro_lancamento}
                  onChange={(e) => setFixaForm(prev => ({ ...prev, data_primeiro_lancamento: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
                <p className="text-xs text-gray-500">
                  As próximas parcelas serão geradas a cada semana a partir desta data.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Dia de Vencimento
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_VENCIMENTO.map(dia => (
                    <Badge
                      key={dia}
                      variant={fixaForm.dia_vencimento === dia ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        fixaForm.dia_vencimento === dia 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                      onClick={() => setFixaForm(prev => ({ ...prev, dia_vencimento: dia }))}
                    >
                      Dia {dia}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="fixa-obs" className="text-sm font-medium text-gray-700">Observações (opcional)</Label>
              <Textarea
                id="fixa-obs"
                placeholder="Notas adicionais..."
                value={fixaForm.observacao}
                onChange={(e) => setFixaForm(prev => ({ ...prev, observacao: e.target.value }))}
                className="bg-gray-50 border-gray-200 h-20 resize-none"
              />
            </div>

            {/* Info sobre recorrência */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p className="flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5 text-gray-500" />
                Despesas fixas geram parcelas automáticas para os próximos 12 períodos.
              </p>
            </div>

            {/* Botão Submit */}
            <Button 
              onClick={handleSubmitFixa} 
              disabled={loading}
              className="w-full shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Despesa Fixa'
              )}
            </Button>
          </TabsContent>

          {/* TAB: DESPESA VARIÁVEL */}
          <TabsContent value="variavel" className="space-y-4">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="var-descricao" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Descrição
              </Label>
              <Input
                id="var-descricao"
                placeholder="Ex: Compra de material de escritório"
                value={variavelForm.descricao}
                onChange={(e) => setVariavelForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="var-valor" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Valor (R$)
                </Label>
                <Input
                  id="var-valor"
                  type="text"
                  placeholder="0,00"
                  value={variavelForm.valor}
                  onChange={(e) => setVariavelForm(prev => ({ ...prev, valor: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="var-data" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Data da Despesa
                </Label>
                <Input
                  id="var-data"
                  type="date"
                  value={variavelForm.data}
                  onChange={(e) => setVariavelForm(prev => ({ ...prev, data: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Categoria (TreeSelect) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Categoria
              </Label>
              <CategoriaTreeSelect
                value={variavelForm.categoria_id}
                onChange={(v) => setVariavelForm(prev => ({ ...prev, categoria_id: v }))}
                fluxo="saida"
                placeholder="Selecione uma categoria..."
                allowCreate={true}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            {/* Data de Vencimento e Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="var-venc" className="text-sm font-medium text-gray-700">Data de Vencimento</Label>
                <Input
                  id="var-venc"
                  type="date"
                  value={variavelForm.data_vencimento}
                  onChange={(e) => setVariavelForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={!variavelForm.pago ? 'default' : 'outline'}
                    className={`cursor-pointer flex-1 justify-center py-2 ${
                      !variavelForm.pago 
                        ? 'bg-amber-500 text-white hover:bg-amber-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setVariavelForm(prev => ({ ...prev, pago: false }))}
                  >
                    Pendente
                  </Badge>
                  <Badge
                    variant={variavelForm.pago ? 'default' : 'outline'}
                    className={`cursor-pointer flex-1 justify-center py-2 ${
                      variavelForm.pago 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setVariavelForm(prev => ({ ...prev, pago: true }))}
                  >
                    Já Pago
                  </Badge>
                </div>
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="var-obs" className="text-sm font-medium text-gray-700">Observações (opcional)</Label>
              <Textarea
                id="var-obs"
                placeholder="Notas adicionais..."
                value={variavelForm.observacao}
                onChange={(e) => setVariavelForm(prev => ({ ...prev, observacao: e.target.value }))}
                className="bg-gray-50 border-gray-200 h-20 resize-none"
              />
            </div>

            {/* Botão Submit */}
            <Button 
              onClick={handleSubmitVariavel} 
              disabled={loading}
              className="w-full shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Registrar Despesa Variável'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
