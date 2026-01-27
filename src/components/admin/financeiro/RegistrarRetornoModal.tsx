/**
 * RegistrarRetornoModal - Modal para registrar retorno de investimento
 */

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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { 
  useInvestimentos, 
  Investimento,
  RetornoCategoria,
  NovoRetorno 
} from '@/hooks/financeiro/useInvestimentos';

interface RegistrarRetornoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investimento: Investimento | null;
  onSuccess?: () => void;
}

const CATEGORIAS_RETORNO: { value: RetornoCategoria; label: string }[] = [
  { value: 'operacional', label: 'Operacional' },
  { value: 'dividendo', label: 'Dividendo' },
  { value: 'juros', label: 'Juros' },
  { value: 'venda_ativo', label: 'Venda de Ativo' },
  { value: 'outro', label: 'Outro' },
];

export const RegistrarRetornoModal: React.FC<RegistrarRetornoModalProps> = ({
  open,
  onOpenChange,
  investimento,
  onSuccess
}) => {
  const { registrarRetorno } = useInvestimentos();
  
  const [loading, setLoading] = useState(false);
  const [dataRetorno, setDataRetorno] = useState<Date>(new Date());
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: 0,
    categoria: 'operacional' as RetornoCategoria,
    observacao: '',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!investimento || !formData.descricao || formData.valor <= 0) {
      return;
    }

    setLoading(true);
    try {
      const payload: NovoRetorno = {
        investimento_id: investimento.id,
        descricao: formData.descricao,
        valor: formData.valor,
        data: format(dataRetorno, 'yyyy-MM-dd'),
        categoria: formData.categoria,
        observacao: formData.observacao || undefined,
      };

      const result = await registrarRetorno(payload);
      if (result) {
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setFormData({
          descricao: '',
          valor: 0,
          categoria: 'operacional',
          observacao: '',
        });
        setDataRetorno(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  if (!investimento) return null;

  const retornoAtual = investimento.retorno_acumulado || 0;
  const roiAtual = investimento.roi_realizado || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Registrar Retorno
          </DialogTitle>
        </DialogHeader>

        {/* Info do investimento */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="font-medium text-gray-900">{investimento.descricao}</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Valor investido:</span>
            <span className="font-medium">{formatCurrency(investimento.valor)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Retorno acumulado:</span>
            <span className={cn("font-medium", retornoAtual > 0 ? "text-emerald-600" : "text-gray-600")}>
              {formatCurrency(retornoAtual)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ROI atual:</span>
            <span className={cn("font-medium", roiAtual > 0 ? "text-emerald-600" : roiAtual < 0 ? "text-red-600" : "text-gray-600")}>
              {roiAtual.toFixed(2)}%
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do Retorno *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Receita mensal de aluguel do servidor"
              required
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data do Retorno *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataRetorno && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataRetorno ? format(dataRetorno, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataRetorno}
                    onSelect={(date) => date && setDataRetorno(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value as RetornoCategoria }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_RETORNO.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Detalhes adicionais..."
              rows={2}
            />
          </div>

          {/* Preview do novo ROI */}
          {formData.valor > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-700">
                <strong>Após este lançamento:</strong><br />
                Retorno acumulado: {formatCurrency(retornoAtual + formData.valor)}<br />
                ROI estimado: {(((retornoAtual + formData.valor - investimento.valor) / investimento.valor) * 100).toFixed(2)}%
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.descricao || formData.valor <= 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Registrar Retorno'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
