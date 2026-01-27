import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Edit, Loader2, Save, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContaPagar {
  id: string;
  nome: string;
  categoria: string;
  valor_previsto: number;
  valor_pago: number;
  data_vencimento: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial';
  tipo: 'fixa' | 'variavel';
  responsavel?: string;
  observacoes?: string;
}

interface EditarContaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaPagar | null;
  onSuccess: () => void;
}

interface Categoria {
  id: string;
  nome: string;
  parent_id: string | null;
}

const toLocalDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string' && value.includes('T')) return new Date(value);
  return parse(String(value), 'yyyy-MM-dd', new Date());
};

export const EditarContaModal: React.FC<EditarContaModalProps> = ({
  open,
  onOpenChange,
  conta,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: 0,
    categoria_id: '',
    observacao: '',
    dia_vencimento: 10,
    data: '',
    data_primeiro_lancamento: '',
    data_proximo_vencimento: '',
    periodicidade: 'mensal'
  });

  useEffect(() => {
    if (open) {
      fetchCategorias();
      if (conta) {
        loadContaData();
      }
    } else {
      setFormData({
        descricao: '',
        valor: 0,
        categoria_id: '',
        observacao: '',
        dia_vencimento: 10,
        data: '',
        data_primeiro_lancamento: '',
        data_proximo_vencimento: '',
        periodicidade: 'mensal'
      });
    }
  }, [open, conta?.id]);

  const fetchCategorias = async () => {
    try {
      const { data } = await supabase
        .from('categorias_despesas')
        .select('id, nome, parent_id')
        .eq('fluxo', 'saida')
        .eq('ativo', true)
        .order('nome');

      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const loadContaData = async () => {
    if (!conta) return;
    setLoading(true);

    try {
      const table = conta.tipo === 'fixa' ? 'despesas_fixas' : 'despesas_variaveis';
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*')
        .eq('id', conta.id)
        .single();

      if (error) throw error;

      if (data) {
        let dataProximoVencimento = '';
        if (conta.tipo === 'fixa') {
          if (data.data_primeiro_lancamento) {
            dataProximoVencimento = data.data_primeiro_lancamento;
          } else if (data.dia_vencimento) {
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = hoje.getMonth();
            const dataCalc = new Date(ano, mes, data.dia_vencimento);
            dataProximoVencimento = format(dataCalc, 'yyyy-MM-dd');
          }
        }

        setFormData({
          descricao: data.descricao || data.nome || '',
          valor: data.valor || 0,
          categoria_id: data.categoria_id || '',
          observacao: data.observacao || '',
          dia_vencimento: data.dia_vencimento || 10,
          data: data.data || '',
          data_primeiro_lancamento: data.data_primeiro_lancamento || '',
          data_proximo_vencimento: dataProximoVencimento,
          periodicidade: data.periodicidade || 'mensal'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da conta:', error);
      toast.error('Erro ao carregar dados da conta');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!conta) return;

    if (!formData.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }

    if (formData.valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    setSaving(true);

    try {
      const table = conta.tipo === 'fixa' ? 'despesas_fixas' : 'despesas_variaveis';
      
      const updateData: any = {
        descricao: formData.descricao.trim(),
        valor: formData.valor,
        categoria_id: formData.categoria_id || null,
        observacao: formData.observacao.trim() || null
      };

      if (conta.tipo === 'fixa') {
        if (formData.periodicidade === 'semanal') {
          updateData.data_primeiro_lancamento = formData.data_primeiro_lancamento || null;
        } else {
          updateData.data_primeiro_lancamento = formData.data_proximo_vencimento || null;
          
          if (formData.data_proximo_vencimento) {
            const dataSelected = toLocalDate(formData.data_proximo_vencimento);
            if (dataSelected) {
              updateData.dia_vencimento = dataSelected.getDate();
            }
          } else {
            updateData.dia_vencimento = formData.dia_vencimento;
          }
        }
      } else {
        updateData.data = formData.data || null;
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', conta.id);

      if (error) throw error;

      toast.success('Conta atualizada com sucesso');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
    } finally {
      setSaving(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        data_proximo_vencimento: format(date, 'yyyy-MM-dd') 
      }));
    }
  };

  const handleDateSelectVariavel = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        data: format(date, 'yyyy-MM-dd') 
      }));
    }
  };

  const handleDateSelectSemanal = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        data_primeiro_lancamento: format(date, 'yyyy-MM-dd') 
      }));
    }
  };

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            Editar Conta {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-sm font-medium text-slate-700">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Aluguel do escritório"
                className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-medium text-slate-700">
                  Valor (R$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              {conta.tipo === 'fixa' ? (
                formData.periodicidade === 'semanal' ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal bg-slate-50 border-slate-200 hover:bg-white",
                            !formData.data_primeiro_lancamento && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                          {formData.data_primeiro_lancamento
                            ? format(toLocalDate(formData.data_primeiro_lancamento)!, 'dd/MM/yyyy', { locale: ptBR })
                            : <span>Selecionar</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50 bg-white shadow-lg border-slate-200" align="start">
                        <Calendar
                          mode="single"
                          selected={toLocalDate(formData.data_primeiro_lancamento)}
                          onSelect={handleDateSelectSemanal}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Data do Vencimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal bg-slate-50 border-slate-200 hover:bg-white",
                            !formData.data_proximo_vencimento && "text-slate-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                          {formData.data_proximo_vencimento
                            ? format(toLocalDate(formData.data_proximo_vencimento)!, 'dd/MM/yyyy', { locale: ptBR })
                            : <span>Selecionar</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50 bg-white shadow-lg border-slate-200" align="start">
                        <Calendar
                          mode="single"
                          selected={toLocalDate(formData.data_proximo_vencimento)}
                          onSelect={handleDateSelect}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal bg-slate-50 border-slate-200 hover:bg-white",
                          !formData.data && "text-slate-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {formData.data
                          ? format(toLocalDate(formData.data)!, 'dd/MM/yyyy', { locale: ptBR })
                          : <span>Selecionar</span>
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-white shadow-lg border-slate-200" align="start">
                      <Calendar
                        mode="single"
                        selected={toLocalDate(formData.data)}
                        onSelect={handleDateSelectVariavel}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria" className="text-sm font-medium text-slate-700">Categoria</Label>
              <Select
                value={formData.categoria_id || '__none__'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, categoria_id: v === '__none__' ? '' : v }))}
              >
                <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 border-slate-200 shadow-lg">
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {categorias.filter(c => !c.parent_id).flatMap(parent => [
                    <SelectItem key={parent.id} value={parent.id} className="font-medium">
                      {parent.nome}
                    </SelectItem>,
                    ...categorias
                      .filter(c => c.parent_id === parent.id)
                      .map(child => (
                        <SelectItem key={child.id} value={child.id} className="pl-6 text-slate-600">
                          └ {child.nome}
                        </SelectItem>
                      ))
                  ])}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao" className="text-sm font-medium text-slate-700">
                Observações <span className="text-slate-400 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                placeholder="Observações adicionais..."
                className="bg-slate-50 border-slate-200 resize-none focus:bg-white"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-200 gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={saving}
            className="flex-1 sm:flex-none border-slate-200 hover:bg-white"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
