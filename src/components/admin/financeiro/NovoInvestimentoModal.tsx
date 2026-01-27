/**
 * NovoInvestimentoModal - Modal para cadastro de investimentos
 */

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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { 
  useInvestimentos, 
  NovoInvestimento, 
  InvestimentoTipo,
  CentroCusto 
} from '@/hooks/financeiro/useInvestimentos';

interface NovoInvestimentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const TIPOS_INVESTIMENTO: { value: InvestimentoTipo; label: string }[] = [
  { value: 'capex', label: 'CAPEX' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'outros', label: 'Outros' },
];

export const NovoInvestimentoModal: React.FC<NovoInvestimentoModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { criarInvestimento, fetchCentrosCusto, centrosCusto, criarCentroCusto } = useInvestimentos();
  
  const [loading, setLoading] = useState(false);
  const [criandoCentro, setCriandoCentro] = useState(false);
  const [novoCentroNome, setNovoCentroNome] = useState('');
  
  const [formData, setFormData] = useState<NovoInvestimento>({
    descricao: '',
    valor: 0,
    data: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'capex',
    retorno_esperado: 0,
    previsao_retorno: '',
    observacao: '',
    centro_custo_id: undefined,
    investidor_nome: '',
  });
  
  const [dataInvestimento, setDataInvestimento] = useState<Date>(new Date());
  const [dataRetorno, setDataRetorno] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open) {
      fetchCentrosCusto();
    }
  }, [open, fetchCentrosCusto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || formData.valor <= 0) {
      return;
    }

    setLoading(true);
    try {
      const payload: NovoInvestimento = {
        ...formData,
        data: format(dataInvestimento, 'yyyy-MM-dd'),
        previsao_retorno: dataRetorno ? format(dataRetorno, 'yyyy-MM-dd') : undefined,
      };

      const result = await criarInvestimento(payload);
      if (result) {
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setFormData({
          descricao: '',
          valor: 0,
          data: format(new Date(), 'yyyy-MM-dd'),
          tipo: 'capex',
          retorno_esperado: 0,
          previsao_retorno: '',
          observacao: '',
          centro_custo_id: undefined,
          investidor_nome: '',
        });
        setDataInvestimento(new Date());
        setDataRetorno(undefined);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCentroCusto = async () => {
    if (!novoCentroNome.trim()) return;
    
    setCriandoCentro(true);
    try {
      const novoCentro = await criarCentroCusto(novoCentroNome.trim());
      if (novoCentro) {
        setFormData(prev => ({ ...prev, centro_custo_id: novoCentro.id }));
        setNovoCentroNome('');
      }
    } finally {
      setCriandoCentro(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Novo Investimento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Ex: Compra de servidor Dell PowerEdge"
              required
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Investido *</Label>
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
              <Label>Data do Investimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInvestimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInvestimento ? format(dataInvestimento, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInvestimento}
                    onSelect={(date) => date && setDataInvestimento(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tipo e Centro de Custo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as InvestimentoTipo }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INVESTIMENTO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Centro de Custo</Label>
              <Select
                value={formData.centro_custo_id || '__none__'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  centro_custo_id: value === '__none__' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar centro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {centrosCusto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      [{cc.codigo}] {cc.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Criar novo centro de custo */}
          <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-gray-500">Criar novo centro de custo</Label>
              <Input
                value={novoCentroNome}
                onChange={(e) => setNovoCentroNome(e.target.value)}
                placeholder="Nome do centro (ex: Gestora XYZ)"
                className="h-9"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCriarCentroCusto}
              disabled={!novoCentroNome.trim() || criandoCentro}
              className="h-9"
            >
              {criandoCentro ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {/* Investidor/Gestora */}
          <div className="space-y-2">
            <Label htmlFor="investidor_nome">Investidor/Gestora (opcional)</Label>
            <Input
              id="investidor_nome"
              value={formData.investidor_nome}
              onChange={(e) => setFormData(prev => ({ ...prev, investidor_nome: e.target.value }))}
              placeholder="Nome da gestora ou investidor externo"
            />
          </div>

          {/* Retorno Esperado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retorno_esperado">Retorno Esperado (R$)</Label>
              <Input
                id="retorno_esperado"
                type="number"
                step="0.01"
                min="0"
                value={formData.retorno_esperado || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, retorno_esperado: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Previsão de Retorno</Label>
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
                    onSelect={setDataRetorno}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              placeholder="Detalhes adicionais sobre o investimento..."
              rows={3}
            />
          </div>

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
                'Cadastrar Investimento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
