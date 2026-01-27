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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CreditCard, Link2, Loader2, CheckCircle2, CalendarClock, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type ModoAcao = 'pagar_agora' | 'agendar';

interface ContaPagar {
  id: string;
  nome: string;
  valor_previsto: number;
  data_vencimento: string;
  tipo: 'fixa' | 'variavel';
  status: string;
}

interface AsaasSaida {
  id: string;
  data: string;
  valor: number;
  descricao: string | null;
  status: string | null;
  asaas_tipo: string;
}

interface PagarContaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaPagar | null;
  onSuccess: () => void;
}

export const PagarContaModal: React.FC<PagarContaModalProps> = ({
  open,
  onOpenChange,
  conta,
  onSuccess
}) => {
  const [modoAcao, setModoAcao] = useState<ModoAcao>('pagar_agora');
  const [tipoPagamento, setTipoPagamento] = useState<'manual' | 'asaas'>('manual');
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataAgendada, setDataAgendada] = useState('');
  const [autoPagar, setAutoPagar] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [saidasAsaas, setSaidasAsaas] = useState<AsaasSaida[]>([]);
  const [selectedAsaasSaida, setSelectedAsaasSaida] = useState<string | null>(null);
  const [loadingSaidas, setLoadingSaidas] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && tipoPagamento === 'asaas') {
      fetchSaidasAsaas();
    }
  }, [open, tipoPagamento]);

  const fetchSaidasAsaas = async () => {
    setLoadingSaidas(true);
    try {
      const { data, error } = await supabase
        .from('asaas_saidas')
        .select('id, data, valor, descricao, status, asaas_tipo')
        .eq('conciliado', false)
        .order('data', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSaidasAsaas(data || []);
    } catch (error) {
      console.error('Erro ao buscar saídas ASAAS:', error);
      toast.error('Erro ao carregar saídas ASAAS');
    } finally {
      setLoadingSaidas(false);
    }
  };

  const handleSave = async () => {
    if (!conta) return;

    setSaving(true);
    try {
      const table = conta.tipo === 'fixa' ? 'despesas_fixas' : 'despesas_variaveis';
      
      // Modo Agendar
      if (modoAcao === 'agendar') {
        if (!dataAgendada) {
          toast.error('Selecione a data para agendamento');
          setSaving(false);
          return;
        }

        const { error } = await (supabase as any)
          .from(table)
          .update({
            status: 'agendado',
            data_pagamento_agendado: dataAgendada,
            auto_pagar_na_data: autoPagar,
            observacao: observacao || null
          })
          .eq('id', conta.id);

        if (error) throw error;
        
        toast.success(autoPagar 
          ? `Pagamento agendado para ${format(new Date(dataAgendada), 'dd/MM/yyyy', { locale: ptBR })} (automático)`
          : `Lembrete agendado para ${format(new Date(dataAgendada), 'dd/MM/yyyy', { locale: ptBR })}`
        );
      } else if (tipoPagamento === 'manual') {
        // Pagamento manual
        const { error } = await (supabase as any)
          .from(table)
          .update({
            status: 'pago',
            valor_pago: conta.valor_previsto,
            data_pagamento: dataPagamento,
            data_pagamento_agendado: null,
            auto_pagar_na_data: false,
            observacao: observacao || null
          })
          .eq('id', conta.id);

        if (error) throw error;
        
        toast.success('Pagamento registrado com sucesso!');
      } else {
        // Vincular a saída ASAAS
        if (!selectedAsaasSaida) {
          toast.error('Selecione uma saída ASAAS para vincular');
          setSaving(false);
          return;
        }

        const asaasSaida = saidasAsaas.find(s => s.id === selectedAsaasSaida);
        if (!asaasSaida) {
          toast.error('Saída ASAAS não encontrada');
          setSaving(false);
          return;
        }

        // 1. Atualizar despesa como paga e vincular
        const { error: updateError } = await (supabase as any)
          .from(table)
          .update({
            status: 'pago',
            valor_pago: conta.valor_previsto,
            data_pagamento: asaasSaida.data,
            data_pagamento_agendado: null,
            auto_pagar_na_data: false,
            asaas_saida_id: asaasSaida.id
          })
          .eq('id', conta.id);

        if (updateError) throw updateError;

        // 2. Marcar saída ASAAS como conciliada
        const { data: userData } = await supabase.auth.getUser();
        const { error: asaasError } = await supabase
          .from('asaas_saidas')
          .update({
            conciliado: true,
            conciliado_at: new Date().toISOString(),
            conciliado_by: userData.user?.id || null
          })
          .eq('id', asaasSaida.id);

        if (asaasError) throw asaasError;

        // 3. Registrar no histórico
        await supabase.from('lancamento_historico').insert({
          lancamento_id: asaasSaida.id,
          lancamento_tipo: 'asaas_saida',
          acao: 'conciliacao',
          campo_alterado: 'conciliado',
          valor_anterior: 'false',
          valor_novo: 'true',
          usuario_id: userData.user?.id || null
        });

        toast.success('Pagamento vinculado ao ASAAS com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setModoAcao('pagar_agora');
    setTipoPagamento('manual');
    setDataPagamento(format(new Date(), 'yyyy-MM-dd'));
    setDataAgendada('');
    setAutoPagar(false);
    setObservacao('');
    setSelectedAsaasSaida(null);
  };

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo da conta */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Conta</p>
                <p className="font-medium text-gray-900">{conta.nome}</p>
              </div>
              <Badge variant="outline" className="capitalize">
                {conta.tipo}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(conta.valor_previsto)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Vencimento</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Seleção de Ação: Pagar Agora vs Agendar */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ação</Label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setModoAcao('pagar_agora')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  modoAcao === 'pagar_agora'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CheckCircle2 className={`h-5 w-5 ${modoAcao === 'pagar_agora' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium text-sm">Pagar Agora</p>
                  <p className="text-xs text-gray-500">Registrar como pago</p>
                </div>
              </div>
              <div
                onClick={() => setModoAcao('agendar')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  modoAcao === 'agendar'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CalendarClock className={`h-5 w-5 ${modoAcao === 'agendar' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium text-sm">Agendar</p>
                  <p className="text-xs text-gray-500">Pagar em data futura</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Agendamento */}
          {modoAcao === 'agendar' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="space-y-2">
                <Label htmlFor="data-agendada" className="text-sm font-medium text-blue-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Data do Pagamento Agendado
                </Label>
                <Input
                  id="data-agendada"
                  type="date"
                  value={dataAgendada}
                  onChange={(e) => setDataAgendada(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-white border-blue-200"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={autoPagar}
                    onCheckedChange={(checked) => setAutoPagar(!!checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Marcar como pago automaticamente
                    </p>
                    <p className="text-xs text-blue-600">
                      O sistema marcará a conta como paga na data agendada.
                    </p>
                  </div>
                </label>

                {!autoPagar && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Você receberá um lembrete na data para confirmar o pagamento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tipo de pagamento - Só mostra se for Pagar Agora */}
          {modoAcao === 'pagar_agora' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipo de Pagamento</Label>
              <RadioGroup
                value={tipoPagamento}
                onValueChange={(v) => setTipoPagamento(v as 'manual' | 'asaas')}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="manual"
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    tipoPagamento === 'manual'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="manual" id="manual" />
                  <div>
                    <p className="font-medium text-sm">Pagamento Manual</p>
                    <p className="text-xs text-gray-500">Registrar data e obs.</p>
                  </div>
                </Label>
                <Label
                  htmlFor="asaas"
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    tipoPagamento === 'asaas'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="asaas" id="asaas" />
                  <div>
                    <p className="font-medium text-sm">Vincular ASAAS</p>
                    <p className="text-xs text-gray-500">Conciliar saída</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Campos do pagamento manual */}
          {tipoPagamento === 'manual' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  placeholder="Ex: Pago via PIX..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="bg-white resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Lista de saídas ASAAS */}
          {tipoPagamento === 'asaas' && (
            <div className="space-y-2">
              <Label>Selecione uma saída não conciliada</Label>
              {loadingSaidas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : saidasAsaas.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <Link2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma saída disponível</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-xl p-2">
                  <RadioGroup
                    value={selectedAsaasSaida || ''}
                    onValueChange={setSelectedAsaasSaida}
                    className="space-y-2"
                  >
                    {saidasAsaas.map((saida) => (
                      <Label
                        key={saida.id}
                        htmlFor={saida.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedAsaasSaida === saida.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <RadioGroupItem value={saida.id} id={saida.id} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {saida.descricao || 'Sem descrição'}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                              {formatCurrency(saida.valor)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {format(new Date(saida.data), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {saida.asaas_tipo}
                            </Badge>
                            {saida.status && (
                              <Badge variant="secondary" className="text-xs">
                                {saida.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedAsaasSaida === saida.id && (
                          <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : modoAcao === 'agendar' ? (
              <>
                <CalendarClock className="h-4 w-4 mr-2" />
                Agendar Pagamento
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
