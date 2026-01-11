/**
 * LancamentoDetalheDialog - Modal para editar classificação de lançamentos
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Tag, 
  Repeat, 
  CheckCircle2,
  Calendar,
  User,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lancamento {
  id: string;
  tipo: 'entrada' | 'saida';
  origem: string;
  descricao: string;
  valor: number;
  valor_liquido?: number;
  data: string;
  status: string;
  status_original?: string;
  cliente?: string;
  metodo_pagamento?: string;
  categoria_id?: string;
  categoria_nome?: string;
  tipo_receita?: 'fixa' | 'variavel';
  recorrente?: boolean;
  conciliado?: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface LancamentoDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamento: Lancamento | null;
  categorias: Categoria[];
  onSave: (updates: Partial<Lancamento>) => void;
}

const LancamentoDetalheDialog: React.FC<LancamentoDetalheDialogProps> = ({
  open,
  onOpenChange,
  lancamento,
  categorias,
  onSave
}) => {
  const [categoriaId, setCategoriaId] = useState<string>('none');
  const [tipoReceita, setTipoReceita] = useState<'fixa' | 'variavel' | ''>('');
  const [recorrente, setRecorrente] = useState(false);
  const [conciliado, setConciliado] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lancamento) {
      setCategoriaId(lancamento.categoria_id || 'none');
      setTipoReceita(lancamento.tipo_receita || '');
      setRecorrente(lancamento.recorrente || false);
      setConciliado(lancamento.conciliado || false);
    }
  }, [lancamento]);

  // Early return moved AFTER all hooks
  if (!lancamento) {
    return null;
  }

  const isAsaas = lancamento.origem === 'asaas';
  const isEntrada = lancamento.tipo === 'entrada';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        categoria_id: categoriaId === 'none' ? undefined : categoriaId || undefined,
        tipo_receita: tipoReceita as 'fixa' | 'variavel' | undefined,
        recorrente,
        conciliado
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEntrada ? (
              <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
            )}
            Detalhes do Lançamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumo do Lançamento */}
          <div className="p-4 rounded-lg bg-gray-50 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-900">{lancamento.descricao}</p>
                {lancamento.cliente && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {lancamento.cliente}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${isEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isEntrada ? '+' : '-'}{formatCurrency(lancamento.valor)}
                </p>
                {lancamento.valor_liquido && lancamento.valor_liquido !== lancamento.valor && (
                  <p className="text-xs text-muted-foreground">
                    Líquido: {formatCurrency(lancamento.valor_liquido)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(lancamento.data), 'dd/MM/yyyy', { locale: ptBR })}
              </Badge>
              {lancamento.metodo_pagamento && (
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="h-3 w-3" />
                  {lancamento.metodo_pagamento}
                </Badge>
              )}
              <Badge variant={lancamento.status === 'realizado' ? 'default' : 'secondary'}>
                {lancamento.status}
              </Badge>
              <Badge variant="outline">{lancamento.origem}</Badge>
            </div>
          </div>

          {/* Edição - Apenas para ASAAS */}
          {isAsaas ? (
            <div className="space-y-4">
              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="categoria" className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Categoria
                </Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
              <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categorias.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Receita */}
              {isEntrada && (
                <div className="space-y-2">
                  <Label>Classificação da Receita</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={tipoReceita === 'fixa' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoReceita('fixa')}
                      className={tipoReceita === 'fixa' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      Receita Fixa
                    </Button>
                    <Button
                      type="button"
                      variant={tipoReceita === 'variavel' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTipoReceita('variavel')}
                      className={tipoReceita === 'variavel' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                    >
                      Receita Variável
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fixa = assinaturas/mensalidades • Variável = vendas avulsas
                  </p>
                </div>
              )}

              {/* Recorrente */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="recorrente" className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    Lançamento Recorrente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Este lançamento se repete mensalmente
                  </p>
                </div>
                <Switch
                  id="recorrente"
                  checked={recorrente}
                  onCheckedChange={setRecorrente}
                />
              </div>

              {/* Conciliado */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="conciliado" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Conciliado
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Valor conferido com extrato bancário
                  </p>
                </div>
                <Switch
                  id="conciliado"
                  checked={conciliado}
                  onCheckedChange={setConciliado}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                Este lançamento é de origem <strong>{lancamento.origem}</strong> e 
                sua classificação é gerenciada no módulo correspondente (Despesas Fixas/Variáveis).
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {isAsaas && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Classificação'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LancamentoDetalheDialog;
