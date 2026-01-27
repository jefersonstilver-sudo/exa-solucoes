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
  ArrowRight,
  Receipt
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
      <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh] max-h-[850px] p-0 gap-0 overflow-hidden bg-background flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-muted/30 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo Principal - Duas Colunas */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Coluna Esquerda - Resumo e Configurações */}
            <div className="p-6 overflow-y-auto border-r border-border">
              <div className="space-y-5">
                {/* Resumo da conta */}
                <div className="bg-muted/50 rounded-xl p-5 border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Conta</p>
                      <p className="font-semibold text-foreground text-lg">{conta.nome}</p>
                    </div>
                    <Badge variant="outline" className="capitalize shrink-0 text-sm">
                      {conta.tipo}
                    </Badge>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Valor a Pagar</p>
                      <p className="text-3xl font-bold text-foreground">{formatCurrency(conta.valor_previsto)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vencimento</p>
                      <p className="text-base font-medium text-foreground flex items-center justify-end gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seleção de Ação */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ação</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModoAcao('pagar_agora')}
                      className={`
                        relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                        ${modoAcao === 'pagar_agora'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                          : 'border-border bg-background hover:border-muted-foreground/30'
                        }
                      `}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modoAcao === 'pagar_agora' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'}`}>
                        <CheckCircle2 className={`h-5 w-5 ${modoAcao === 'pagar_agora' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${modoAcao === 'pagar_agora' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>Pagar Agora</p>
                        <p className="text-xs text-muted-foreground">Registrar como pago</p>
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
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                          : 'border-border bg-background hover:border-muted-foreground/30'
                        }
                      `}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${modoAcao === 'agendar' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-muted'}`}>
                        <CalendarClock className={`h-5 w-5 ${modoAcao === 'agendar' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${modoAcao === 'agendar' ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>Agendar</p>
                        <p className="text-xs text-muted-foreground">Pagar em data futura</p>
                      </div>
                      {modoAcao === 'agendar' && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Seção de Agendamento */}
                {modoAcao === 'agendar' && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="space-y-2">
                      <Label htmlFor="data-agendada" className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        Data do Pagamento
                      </Label>
                      <Input
                        id="data-agendada"
                        type="date"
                        value={dataAgendada}
                        onChange={(e) => setDataAgendada(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-background border-blue-200 dark:border-blue-700"
                      />
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-background border border-blue-100 dark:border-blue-800 hover:border-blue-300 transition-colors">
                      <Checkbox
                        checked={autoPagar}
                        onCheckedChange={(checked) => setAutoPagar(!!checked)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Marcar como pago automaticamente</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">O sistema marcará a conta como paga na data agendada.</p>
                      </div>
                    </label>

                    {!autoPagar && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">Você receberá um lembrete na data para confirmar o pagamento.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tipo de pagamento */}
                {modoAcao === 'pagar_agora' && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Método de Pagamento</Label>
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
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-border bg-background hover:border-muted-foreground/30'
                          }
                        `}
                      >
                        <RadioGroupItem value="manual" id="manual" className="sr-only" />
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tipoPagamento === 'manual' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'}`}>
                          <Wallet className={`h-5 w-5 ${tipoPagamento === 'manual' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${tipoPagamento === 'manual' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>Manual</p>
                          <p className="text-xs text-muted-foreground">Registrar data</p>
                        </div>
                      </Label>
                      
                      <Label
                        htmlFor="asaas"
                        className={`
                          flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${tipoPagamento === 'asaas'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-border bg-background hover:border-muted-foreground/30'
                          }
                        `}
                      >
                        <RadioGroupItem value="asaas" id="asaas" className="sr-only" />
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tipoPagamento === 'asaas' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-muted'}`}>
                          <Link2 className={`h-5 w-5 ${tipoPagamento === 'asaas' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${tipoPagamento === 'asaas' ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>ASAAS</p>
                          <p className="text-xs text-muted-foreground">Vincular saída</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>
                )}

                {/* Campos do pagamento manual */}
                {modoAcao === 'pagar_agora' && tipoPagamento === 'manual' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-xl border">
                    <div className="space-y-2">
                      <Label htmlFor="dataPagamento" className="text-sm font-medium">Data do Pagamento</Label>
                      <Input
                        id="dataPagamento"
                        type="date"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacao" className="text-sm font-medium">Observação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                      <Textarea
                        id="observacao"
                        placeholder="Ex: Pago via PIX..."
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        className="bg-background resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita - Lista de Saídas ASAAS */}
            <div className="p-6 overflow-hidden flex flex-col bg-muted/20">
              {modoAcao === 'pagar_agora' && tipoPagamento === 'asaas' ? (
                <>
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div>
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-blue-500" />
                        Saídas ASAAS Disponíveis
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Selecione uma saída para vincular ao pagamento</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">
                        {saidasAsaas.length} disponíveis
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSyncAndRefresh}
                        disabled={syncingSaidas || loadingSaidas}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1.5 ${syncingSaidas ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                    </div>
                  </div>
                  
                  {loadingSaidas || syncingSaidas ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-background rounded-xl border">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
                      <p className="text-sm text-muted-foreground">Carregando saídas...</p>
                    </div>
                  ) : saidasAsaas.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-background rounded-xl border">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Link2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-medium text-foreground mb-1">Nenhuma saída disponível</p>
                      <p className="text-sm text-muted-foreground mb-4">Sincronize para buscar novas transações</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSyncAndRefresh}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar ASAAS
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 rounded-xl border bg-background">
                      <RadioGroup
                        value={selectedAsaasSaida || ''}
                        onValueChange={setSelectedAsaasSaida}
                        className="p-3 space-y-2"
                      >
                        {saidasAsaas.map((saida) => (
                          <Label
                            key={saida.id}
                            htmlFor={saida.id}
                            className={`
                              flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                              ${selectedAsaasSaida === saida.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                                : 'border-transparent bg-muted/30 hover:border-muted-foreground/20 hover:bg-muted/50'
                              }
                            `}
                          >
                            <RadioGroupItem value={saida.id} id={saida.id} className="sr-only" />
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selectedAsaasSaida === saida.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-muted'}`}>
                              {selectedAsaasSaida === saida.id ? (
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              ) : (
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate mb-1">
                                {saida.descricao || 'Sem descrição'}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(saida.data), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
                                  {saida.asaas_tipo}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-lg font-bold ${selectedAsaasSaida === saida.id ? 'text-blue-600' : 'text-foreground'}`}>
                                {formatCurrency(saida.valor)}
                              </p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </ScrollArea>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    {modoAcao === 'agendar' ? (
                      <CalendarClock className="h-10 w-10 text-blue-400" />
                    ) : (
                      <Wallet className="h-10 w-10 text-emerald-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {modoAcao === 'agendar' ? 'Agendamento de Pagamento' : 'Pagamento Manual'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {modoAcao === 'agendar' 
                      ? 'Configure a data e o comportamento do agendamento no painel ao lado.'
                      : 'Preencha os dados do pagamento no formulário ao lado para registrar manualmente.'
                    }
                  </p>
                  {modoAcao === 'pagar_agora' && tipoPagamento === 'manual' && (
                    <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-left w-full max-w-sm">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-2">💡 Dica:</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Para vincular a uma transação real do ASAAS, selecione o método "ASAAS" acima.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/30 border-t gap-2 sm:gap-2 shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={saving}
            className="flex-1 sm:flex-none"
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
