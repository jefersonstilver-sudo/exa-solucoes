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
import { 
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Repeat,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addMonths, setDate } from 'date-fns';

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface Subcategoria {
  id: string;
  categoria_id: string;
  nome: string;
  descricao?: string;
}

interface NovaDespesaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Periodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual';

const PERIODICIDADE_OPTIONS: { value: Periodicidade; label: string; meses: number }[] = [
  { value: 'mensal', label: 'Mensal', meses: 1 },
  { value: 'trimestral', label: 'Trimestral', meses: 3 },
  { value: 'semestral', label: 'Semestral', meses: 6 },
  { value: 'anual', label: 'Anual', meses: 12 },
];

const DIAS_VENCIMENTO = [1, 5, 10, 15, 20, 25, 28];

export const NovaDespesaModal: React.FC<NovaDespesaModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'fixa' | 'variavel'>('fixa');
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  
  // Categorias e subcategorias
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState<Subcategoria[]>([]);
  
  // Form state - Despesa Fixa
  const [fixaForm, setFixaForm] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    subcategoria_id: '',
    periodicidade: 'mensal' as Periodicidade,
    dia_vencimento: 10,
    observacao: '',
  });
  
  // Form state - Despesa Variável
  const [variavelForm, setVariavelForm] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    subcategoria_id: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    data_vencimento: format(new Date(), 'yyyy-MM-dd'),
    pago: false,
    observacao: '',
  });

  // Carregar categorias e subcategorias
  useEffect(() => {
    if (open) {
      fetchCategoriasESubcategorias();
    }
  }, [open]);

  // Filtrar subcategorias quando categoria muda
  useEffect(() => {
    const categoriaId = activeTab === 'fixa' ? fixaForm.categoria_id : variavelForm.categoria_id;
    if (categoriaId) {
      setSubcategoriasFiltradas(subcategorias.filter(s => s.categoria_id === categoriaId));
    } else {
      setSubcategoriasFiltradas([]);
    }
  }, [fixaForm.categoria_id, variavelForm.categoria_id, subcategorias, activeTab]);

  const fetchCategoriasESubcategorias = async () => {
    setLoadingCategorias(true);
    try {
      // Buscar categorias
      const { data: cats, error: catsError } = await supabase
        .from('categorias_despesas')
        .select('id, nome, tipo')
        .eq('ativo', true)
        .order('nome');
      
      if (catsError) throw catsError;
      setCategorias(cats || []);

      // Buscar subcategorias
      const { data: subs, error: subsError } = await supabase
        .from('subcategorias_despesas')
        .select('id, categoria_id, nome, descricao')
        .eq('ativo', true)
        .order('nome');
      
      if (subsError) throw subsError;
      setSubcategorias(subs || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleCategoriaChange = (categoriaId: string, tipo: 'fixa' | 'variavel') => {
    if (tipo === 'fixa') {
      setFixaForm(prev => ({ ...prev, categoria_id: categoriaId, subcategoria_id: '' }));
    } else {
      setVariavelForm(prev => ({ ...prev, categoria_id: categoriaId, subcategoria_id: '' }));
    }
  };

  // Parcelas são geradas automaticamente via trigger no banco de dados
  // Função removida do frontend para evitar duplicidade

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

    setLoading(true);
    try {
      const valorNumerico = parseFloat(fixaForm.valor.replace(',', '.'));
      
      // Inserir despesa fixa
      const { data: despesa, error } = await supabase
        .from('despesas_fixas')
        .insert([{
          descricao: fixaForm.descricao.trim(),
          valor: valorNumerico,
          categoria: categorias.find(c => c.id === fixaForm.categoria_id)?.nome || 'Outros',
          categoria_id: fixaForm.categoria_id,
          subcategoria_id: fixaForm.subcategoria_id || null,
          periodicidade: fixaForm.periodicidade,
          dia_vencimento: fixaForm.dia_vencimento,
          observacao: fixaForm.observacao.trim() || null,
          ativo: true,
        }])
        .select()
        .single();

      if (error) throw error;

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
      
      const { error } = await supabase
        .from('despesas_variaveis')
        .insert([{
          descricao: variavelForm.descricao.trim(),
          valor: valorNumerico,
          categoria: categorias.find(c => c.id === variavelForm.categoria_id)?.nome || 'Outros',
          categoria_id: variavelForm.categoria_id,
          subcategoria_id: variavelForm.subcategoria_id || null,
          data: variavelForm.data,
          data_vencimento: variavelForm.data_vencimento,
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
      subcategoria_id: '',
      periodicidade: 'mensal',
      dia_vencimento: 10,
      observacao: '',
    });
    setVariavelForm({
      descricao: '',
      valor: '',
      categoria_id: '',
      subcategoria_id: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      data_vencimento: format(new Date(), 'yyyy-MM-dd'),
      pago: false,
      observacao: '',
    });
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

            {/* Categoria e Subcategoria */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Categoria
                </Label>
                <Select 
                  value={fixaForm.categoria_id} 
                  onValueChange={(v) => handleCategoriaChange(v, 'fixa')}
                  disabled={loadingCategorias}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subcategoria</Label>
                <Select 
                  value={fixaForm.subcategoria_id} 
                  onValueChange={(v) => setFixaForm(prev => ({ ...prev, subcategoria_id: v }))}
                  disabled={!fixaForm.categoria_id || subcategoriasFiltradas.length === 0}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder={subcategoriasFiltradas.length === 0 ? 'Nenhuma' : 'Opcional'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriasFiltradas.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dia de Vencimento */}
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

            {/* Categoria e Subcategoria */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Categoria
                </Label>
                <Select 
                  value={variavelForm.categoria_id} 
                  onValueChange={(v) => handleCategoriaChange(v, 'variavel')}
                  disabled={loadingCategorias}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subcategoria</Label>
                <Select 
                  value={variavelForm.subcategoria_id} 
                  onValueChange={(v) => setVariavelForm(prev => ({ ...prev, subcategoria_id: v }))}
                  disabled={!variavelForm.categoria_id || subcategoriasFiltradas.length === 0}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder={subcategoriasFiltradas.length === 0 ? 'Nenhuma' : 'Opcional'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoriasFiltradas.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
