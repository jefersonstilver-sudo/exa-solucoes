import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { CategoriaTreeSelect } from './categorias/CategoriaTreeSelect';
import { useCategoriaHierarchy } from '@/hooks/useCategoriaHierarchy';

interface NovaDespesaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

export const NovaDespesaModal: React.FC<NovaDespesaModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'fixa' | 'variavel'>('fixa');
  const [loading, setLoading] = useState(false);
  
  // Hook para obter nome da categoria
  const { getCategoriaPath } = useCategoriaHierarchy();
  
  // Form state - Despesa Fixa
  const [fixaForm, setFixaForm] = useState({
    descricao: '',
    valor: '',
    categoria_id: '',
    periodicidade: 'mensal' as Periodicidade,
    dia_vencimento: 10,
    observacao: '',
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
  });

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
      const categoriaNome = getCategoriaPath(fixaForm.categoria_id);
      
      // Inserir despesa fixa
      const { error } = await supabase
        .from('despesas_fixas')
        .insert([{
          descricao: fixaForm.descricao.trim(),
          valor: valorNumerico,
          categoria: categoriaNome || 'Outros',
          categoria_id: fixaForm.categoria_id,
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
      const categoriaNome = getCategoriaPath(variavelForm.categoria_id);
      
      const { error } = await supabase
        .from('despesas_variaveis')
        .insert([{
          descricao: variavelForm.descricao.trim(),
          valor: valorNumerico,
          categoria: categoriaNome || 'Outros',
          categoria_id: variavelForm.categoria_id,
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
      periodicidade: 'mensal',
      dia_vencimento: 10,
      observacao: '',
    });
    setVariavelForm({
      descricao: '',
      valor: '',
      categoria_id: '',
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
