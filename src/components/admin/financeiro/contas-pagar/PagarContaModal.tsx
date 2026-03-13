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
      <DialogContent className="w-[98vw] max-w-[1400px] max-h-[calc(100dvh-2rem)] p-0 gap-0 overflow-hidden bg-background flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 bg-muted/30 border-b shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo Principal - Layout Vertical */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Seção Superior - Resumo e Configurações (altura fixa) */}
          <div className="shrink-0 p-6 border-b bg-background">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Card Resumo da Conta */}
              <div className="lg:w-1/3 bg-muted/50 rounded-xl p-5 border">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Conta</p>
                    <p className="font-semibold text-foreground text-base truncate">{conta.nome}</p>
                  </div>
                  <Badge variant="outline" className="capitalize shrink-0 text-xs">
                    {conta.tipo}
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Valor</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(conta.valor_previsto)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Vencimento</p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(conta.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Opções de Ação e Método */}
              <div className="lg:flex-1 flex flex-col gap-4">
                {/* Linha 1: Ação */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ação</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModoAcao('pagar_agora')}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left
                          ${modoAcao === 'pagar_agora'
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-border bg-background hover:border-muted-foreground/30'
                          }
                        `}
                      >
                        <CheckCircle2 className={`h-4 w-4 ${modoAcao === 'pagar_agora' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${modoAcao === 'pagar_agora' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                          Pagar Agora
                        </span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setModoAcao('agendar')}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left
                          ${modoAcao === 'agendar'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'border-border bg-background hover:border-muted-foreground/30'
                          }
                        `}
                      >
                        <CalendarClock className={`h-4 w-4 ${modoAcao === 'agendar' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${modoAcao === 'agendar' ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>
                          Agendar
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Método de Pagamento */}
                  {modoAcao === 'pagar_agora' && (
                    <div className="flex-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Método</Label>
                      <RadioGroup
                        value={tipoPagamento}
                        onValueChange={(v) => setTipoPagamento(v as 'manual' | 'asaas')}
                        className="grid grid-cols-2 gap-2"
                      >
                        <Label
                          htmlFor="manual"
                          className={`
                            flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${tipoPagamento === 'manual'
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                              : 'border-border bg-background hover:border-muted-foreground/30'
                            }
                          `}
                        >
                          <RadioGroupItem value="manual" id="manual" className="sr-only" />
                          <Wallet className={`h-4 w-4 ${tipoPagamento === 'manual' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${tipoPagamento === 'manual' ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>
                            Manual
                          </span>
                        </Label>
                        
                        <Label
                          htmlFor="asaas"
                          className={`
                            flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                            ${tipoPagamento === 'asaas'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-border bg-background hover:border-muted-foreground/30'
                            }
                          `}
                        >
                          <RadioGroupItem value="asaas" id="asaas" className="sr-only" />
                          <Link2 className={`h-4 w-4 ${tipoPagamento === 'asaas' ? 'text-blue-600' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${tipoPagamento === 'asaas' ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>
                            ASAAS
                          </span>
                        </Label>
                      </RadioGroup>
                    </div>
                  )}
                </div>

                {/* Linha 2: Campos Contextuais */}
                {modoAcao === 'agendar' && (
                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex-1 space-y-2">
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

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg bg-background border border-blue-100 dark:border-blue-800 hover:border-blue-300 transition-colors sm:self-end">
                      <Checkbox
                        checked={autoPagar}
                        onCheckedChange={(checked) => setAutoPagar(!!checked)}
                      />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Marcar como pago automaticamente
                      </span>
                    </label>
                  </div>
                )}

                {modoAcao === 'pagar_agora' && tipoPagamento === 'manual' && (
                  <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-xl border">
                    <div className="sm:w-48 space-y-2">
                      <Label htmlFor="dataPagamento" className="text-sm font-medium">Data do Pagamento</Label>
                      <Input
                        id="dataPagamento"
                        type="date"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="observacao" className="text-sm font-medium">Observação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                      <Textarea
                        id="observacao"
                        placeholder="Ex: Pago via PIX..."
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        className="bg-background resize-none h-10"
                        rows={1}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção Inferior - Lista ASAAS (flex-1 para ocupar resto) */}
          <div className="flex-1 overflow-hidden flex flex-col p-6 bg-muted/20">
            {modoAcao === 'pagar_agora' && tipoPagamento === 'asaas' ? (
              <>
                {/* Header da Lista */}
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
                
                {/* Lista de Saídas */}
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
                    {/* Cabeçalho da Tabela */}
                    <div className="grid grid-cols-[40px_1fr_120px_100px_140px] items-center gap-3 px-4 py-3 bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0">
                      <div></div>
                      <div>Descrição</div>
                      <div>Data</div>
                      <div>Tipo</div>
                      <div className="text-right">Valor</div>
                    </div>
                    
                    {/* Linhas da Lista */}
                    <RadioGroup
                      value={selectedAsaasSaida || ''}
                      onValueChange={setSelectedAsaasSaida}
                      className="divide-y"
                    >
                      {saidasAsaas.map((saida) => (
                        <Label
                          key={saida.id}
                          htmlFor={saida.id}
                          className={`
                            grid grid-cols-[40px_1fr_120px_100px_140px] items-center gap-3 px-4 py-3 cursor-pointer transition-all
                            ${selectedAsaasSaida === saida.id
                              ? 'bg-blue-50 dark:bg-blue-950/30'
                              : 'hover:bg-muted/30'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center">
                            <RadioGroupItem value={saida.id} id={saida.id} />
                          </div>
                          
                          <div className="font-medium text-foreground truncate text-sm">
                            {saida.descricao || 'Sem descrição'}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(saida.data), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          
                          <div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {saida.asaas_tipo}
                            </Badge>
                          </div>
                          
                          <div className={`text-right text-lg font-bold ${selectedAsaasSaida === saida.id ? 'text-blue-600' : 'text-foreground'}`}>
                            {formatCurrency(saida.valor)}
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </ScrollArea>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center rounded-xl border bg-background">
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
                <p className="text-sm text-muted-foreground max-w-md">
                  {modoAcao === 'agendar' 
                    ? 'Configure a data e o comportamento do agendamento no painel acima e clique em "Agendar" para confirmar.'
                    : 'Preencha os dados do pagamento no formulário acima e clique em "Confirmar" para registrar.'
                  }
                </p>
                {modoAcao === 'pagar_agora' && tipoPagamento === 'manual' && (
                  <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-left max-w-sm">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">💡 Dica:</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Para vincular a uma transação real do ASAAS, selecione o método "ASAAS" acima.
                    </p>
                  </div>
                )}
              </div>
            )}
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
