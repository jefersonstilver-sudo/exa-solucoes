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
import { Edit, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    periodicidade: 'mensal'
  });

  useEffect(() => {
    if (open) {
      fetchCategorias();
      if (conta) {
        loadContaData();
      }
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
        setFormData({
          descricao: data.descricao || data.nome || '',
          valor: data.valor || 0,
          categoria_id: data.categoria_id || '',
          observacao: data.observacao || '',
          dia_vencimento: data.dia_vencimento || 10,
          data: data.data || '',
          data_primeiro_lancamento: data.data_primeiro_lancamento || '',
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
        // Para despesas semanais, atualizar data_primeiro_lancamento
        if (formData.periodicidade === 'semanal') {
          updateData.data_primeiro_lancamento = formData.data_primeiro_lancamento || null;
        } else {
          updateData.dia_vencimento = formData.dia_vencimento;
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

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Editar Conta - {conta.tipo === 'fixa' ? 'Fixa' : 'Variável'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Ex: Aluguel do escritório"
                className="bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  className="bg-white"
                />
              </div>

              {conta.tipo === 'fixa' ? (
                formData.periodicidade === 'semanal' ? (
                  <div className="space-y-2">
                    <Label htmlFor="data_primeiro_lancamento">Data de Início</Label>
                    <Input
                      id="data_primeiro_lancamento"
                      type="date"
                      value={formData.data_primeiro_lancamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_primeiro_lancamento: e.target.value }))}
                      className="bg-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="dia_vencimento">Dia do Vencimento</Label>
                    <Select
                      value={String(formData.dia_vencimento)}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, dia_vencimento: parseInt(v) }))}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <SelectItem key={day} value={String(day)}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className="bg-white"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, categoria_id: v }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.filter(c => !c.parent_id).map(parent => (
                    <React.Fragment key={parent.id}>
                      <SelectItem value={parent.id} className="font-medium">
                        {parent.nome}
                      </SelectItem>
                      {categorias
                        .filter(c => c.parent_id === parent.id)
                        .map(child => (
                          <SelectItem key={child.id} value={child.id} className="pl-6">
                            └ {child.nome}
                          </SelectItem>
                        ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observações</Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                placeholder="Observações adicionais..."
                className="bg-white resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
