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
import { 
  Calendar, 
  CreditCard, 
  Link2, 
  Loader2, 
  CheckCircle2, 
  CalendarClock, 
  Clock, 
  RefreshCw,
  Wallet,
  ArrowRight
} from 'lucide-react';
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
  status: 'pago' | 'pendente' | 'atrasado' | 'parcial' | 'agendado';
  data_pagamento?: string;
  data_pagamento_agendado?: string;
  auto_pagar_na_data?: boolean;
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
  const [syncingSaidas, setSyncingSaidas] = useState(false);
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

  const handleSyncAndRefresh = async () => {
    setSyncingSaidas(true);
    try {
      const { error } = await supabase.functions.invoke('sync-asaas-outflows');
      if (error) throw error;
      await fetchSaidasAsaas();
      toast.success('Saídas ASAAS atualizadas');
    } catch (error) {
      console.error('Erro ao sincronizar ASAAS:', error);
      toast.error('Erro ao sincronizar');
    } finally {
      setSyncingSaidas(false);
    }
  };

  const handleSave = async () => {
    if (!conta) return;

    setSaving(true);
    try {
      const table = conta.tipo === 'fixa' ? 'despesas_fixas' : 'despesas_variaveis';
      
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
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-white">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Resumo da conta */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Conta</p>
                <p className="font-semibold text-slate-900 truncate">{conta.nome}</p>
              </div>
              <Badge variant="outline" className="capitalize shrink-0 bg-white border-slate-200">
                {conta.tipo}
              </Badge>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Valor</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(conta.valor_previsto)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Vencimento</p>
                <p className="text-sm font-medium text-slate-700 flex items-center justify-end gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Seleção de Ação */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ação</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModoAcao('pagar_agora')}
                className={`
                  relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${modoAcao === 'pagar_agora'
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modoAcao === 'pagar_agora' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <CheckCircle2 className={`h-5 w-5 ${modoAcao === 'pagar_agora' ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${modoAcao === 'pagar_agora' ? 'text-emerald-900' : 'text-slate-700'}`}>Pagar Agora</p>
                  <p className="text-xs text-slate-500">Registrar como pago</p>
                </div>
                {modoAcao === 'pagar_agora' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setModoAcao('agendar')}
                className={`
                  relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${modoAcao === 'agendar'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modoAcao === 'agendar' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <CalendarClock className={`h-5 w-5 ${modoAcao === 'agendar' ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${modoAcao === 'agendar' ? 'text-blue-900' : 'text-slate-700'}`}>Agendar</p>
                  <p className="text-xs text-slate-500">Pagar em data futura</p>
                </div>
                {modoAcao === 'agendar' && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>
          </div>

          {/* Seção de Agendamento */}
          {modoAcao === 'agendar' && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="space-y-2">
                <Label htmlFor="data-agendada" className="text-sm font-medium text-blue-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Data do Pagamento
                </Label>
                <Input
                  id="data-agendada"
                  type="date"
                  value={dataAgendada}
                  onChange={(e) => setDataAgendada(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-white border-blue-200 focus:border-blue-400"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-white border border-blue-100 hover:border-blue-200 transition-colors">
                <Checkbox
                  checked={autoPagar}
                  onCheckedChange={(checked) => setAutoPagar(!!checked)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-blue-800">Marcar como pago automaticamente</p>
                  <p className="text-xs text-blue-600 mt-0.5">O sistema marcará a conta como paga na data agendada.</p>
                </div>
              </label>

              {!autoPagar && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700">Você receberá um lembrete na data para confirmar o pagamento.</p>
                </div>
              )}
            </div>
          )}

          {/* Tipo de pagamento */}
          {modoAcao === 'pagar_agora' && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Método de Pagamento</Label>
              <RadioGroup
                value={tipoPagamento}
                onValueChange={(v) => setTipoPagamento(v as 'manual' | 'asaas')}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="manual"
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${tipoPagamento === 'manual'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }
                  `}
                >
                  <RadioGroupItem value="manual" id="manual" className="sr-only" />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tipoPagamento === 'manual' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <Wallet className={`h-5 w-5 ${tipoPagamento === 'manual' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${tipoPagamento === 'manual' ? 'text-emerald-900' : 'text-slate-700'}`}>Manual</p>
                    <p className="text-xs text-slate-500">Registrar data</p>
                  </div>
                </Label>
                
                <Label
                  htmlFor="asaas"
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${tipoPagamento === 'asaas'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                    }
                  `}
                >
                  <RadioGroupItem value="asaas" id="asaas" className="sr-only" />
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tipoPagamento === 'asaas' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Link2 className={`h-5 w-5 ${tipoPagamento === 'asaas' ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${tipoPagamento === 'asaas' ? 'text-blue-900' : 'text-slate-700'}`}>ASAAS</p>
                    <p className="text-xs text-slate-500">Vincular saída</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Campos do pagamento manual */}
          {modoAcao === 'pagar_agora' && tipoPagamento === 'manual' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-2">
                <Label htmlFor="dataPagamento" className="text-sm font-medium text-slate-700">Data do Pagamento</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao" className="text-sm font-medium text-slate-700">Observação <span className="text-slate-400 font-normal">(opcional)</span></Label>
                <Textarea
                  id="observacao"
                  placeholder="Ex: Pago via PIX..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="bg-white border-slate-200 resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Lista de saídas ASAAS */}
          {modoAcao === 'pagar_agora' && tipoPagamento === 'asaas' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Saídas ASAAS Disponíveis
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-medium">
                    {saidasAsaas.length} disponíveis
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSyncAndRefresh}
                    disabled={syncingSaidas || loadingSaidas}
                    className="h-8 w-8 p-0 hover:bg-slate-100"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncingSaidas ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {loadingSaidas || syncingSaidas ? (
                <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm text-slate-500">Carregando saídas...</p>
                </div>
              ) : saidasAsaas.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Link2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Nenhuma saída disponível</p>
                  <p className="text-xs text-slate-400 mb-3">Sincronize para buscar novas transações</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSyncAndRefresh}
                    className="border-slate-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar ASAAS
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[220px] rounded-xl border border-slate-200 bg-white">
                  <RadioGroup
                    value={selectedAsaasSaida || ''}
                    onValueChange={setSelectedAsaasSaida}
                    className="p-2 space-y-2"
                  >
                    {saidasAsaas.map((saida) => (
                      <Label
                        key={saida.id}
                        htmlFor={saida.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                          ${selectedAsaasSaida === saida.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                          }
                        `}
                      >
                        <RadioGroupItem value={saida.id} id={saida.id} className="sr-only" />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedAsaasSaida === saida.id ? 'bg-blue-100' : 'bg-slate-100'}`}>
                          {selectedAsaasSaida === saida.id ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {saida.descricao || 'Sem descrição'}
                            </p>
                            <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(saida.valor)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {format(new Date(saida.data), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize bg-white">
                              {saida.asaas_tipo}
                            </Badge>
                          </div>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

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
            disabled={saving} 
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : modoAcao === 'agendar' ? (
              <>
                <CalendarClock className="h-4 w-4 mr-2" />
                Agendar
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
