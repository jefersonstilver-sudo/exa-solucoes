import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendWebhookAfterScheduleSave } from '@/services/webhookProgramacaoService';
import { validateBeforeSave } from '@/services/videoScheduleValidationService';
import { ConflictAlert } from './ConflictAlert';
interface ScheduleRule {
  id?: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_all_day?: boolean;
}
interface SlotVideoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoName: string;
  videoId: string;
  onSave: (scheduleRules: ScheduleRule[]) => Promise<void>;
  existingRules?: ScheduleRule[];
  orderId?: string; // Novo: ID do pedido para enviar webhook
}
const DAYS_OF_WEEK = [{
  value: 0,
  label: 'Dom'
}, {
  value: 1,
  label: 'Seg'
}, {
  value: 2,
  label: 'Ter'
}, {
  value: 3,
  label: 'Qua'
}, {
  value: 4,
  label: 'Qui'
}, {
  value: 5,
  label: 'Sex'
}, {
  value: 6,
  label: 'Sáb'
}];
export const SlotVideoScheduleModal: React.FC<SlotVideoScheduleModalProps> = ({
  isOpen,
  onClose,
  videoName,
  videoId,
  onSave,
  existingRules = [],
  orderId
}) => {
  console.log('🎬 [SCHEDULE_MODAL] Modal inicializado com:', {
    videoId,
    videoName,
    orderId,
    existingRulesCount: existingRules.length
  });
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>(existingRules.length > 0 ? existingRules : []);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const addNewRule = () => {
    const newRule: ScheduleRule = {
      days_of_week: [],
      start_time: '09:00',
      end_time: '18:00',
      is_active: true,
      is_all_day: false
    };
    setScheduleRules([...scheduleRules, newRule]);
  };
  const removeRule = (index: number) => {
    console.log('🗑️ [SCHEDULE_MODAL] Removendo regra:', {
      ruleIndex: index,
      ruleId: scheduleRules[index].id,
      remainingRules: scheduleRules.length - 1
    });
    const updatedRules = scheduleRules.filter((_, i) => i !== index);
    setScheduleRules(updatedRules);

    // Limpar conflitos ao remover regra
    setConflicts([]);
    toast.success('Regra removida. Clique em "Salvar" para confirmar.');
  };
  const updateRule = (index: number, field: keyof ScheduleRule, value: any) => {
    const updated = [...scheduleRules];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // Se ativou "Dia Inteiro", configurar horários automaticamente
    if (field === 'is_all_day' && value === true) {
      updated[index].start_time = '00:00';
      updated[index].end_time = '23:59';
    }
    setScheduleRules(updated);
  };
  const toggleDay = (ruleIndex: number, dayValue: number) => {
    const rule = scheduleRules[ruleIndex];
    const days = rule.days_of_week.includes(dayValue) ? rule.days_of_week.filter(d => d !== dayValue) : [...rule.days_of_week, dayValue].sort((a, b) => a - b);
    updateRule(ruleIndex, 'days_of_week', days);
  };

  // Validação de regra individual
  const isRuleValid = (rule: ScheduleRule) => {
    const hasDays = rule.days_of_week.length > 0;
    const hasValidTime = rule.is_all_day || rule.start_time && rule.end_time && rule.start_time < rule.end_time;
    return hasDays && hasValidTime;
  };

  // Calcular se todas as regras são válidas em tempo real
  // Permitir salvar se:
  // - Não há regras (array vazio = remover agendamento)
  // - OU todas as regras existentes são válidas
  const canSave = useMemo(() => {
    return scheduleRules.length === 0 || scheduleRules.every(rule => isRuleValid(rule));
  }, [scheduleRules]);
  const validateRules = (): boolean => {
    // Se não há regras, é válido (permitir remover agendamento)
    if (scheduleRules.length === 0) {
      return true;
    }

    // Se há regras, todas devem ser válidas
    const invalidRules = scheduleRules.filter(rule => !isRuleValid(rule));
    if (invalidRules.length > 0) {
      toast.error('Por favor, complete todas as regras de agendamento corretamente');
      return false;
    }
    return true;
  };
  const handleSave = async () => {
    if (!validateRules()) return;

    // VALIDAÇÃO CRÍTICA: Verificar conflitos ANTES de salvar
    if (scheduleRules.length > 0 && orderId && videoId) {
      setValidating(true);
      try {
        console.log('🔍 [SCHEDULE_MODAL] Validando conflitos antes de salvar...', {
          orderId,
          videoId,
          scheduleRulesCount: scheduleRules.length
        });
        const validationResult = await validateBeforeSave(orderId, videoId, scheduleRules);
        console.log('📊 [SCHEDULE_MODAL] Resultado da validação:', validationResult);
        if (validationResult.hasConflict) {
          console.error('🚨 [SCHEDULE_MODAL] CONFLITOS DETECTADOS - BLOQUEANDO SALVAMENTO:', validationResult.conflicts);
          setConflicts(validationResult.conflicts);
          setSuggestions(validationResult.suggestions);
          setValidating(false);
          toast.error('Conflitos de agendamento detectados. Ajuste os horários antes de salvar.');
          return;
        }
        console.log('✅ [SCHEDULE_MODAL] Nenhum conflito detectado - prosseguindo com salvamento');
        setConflicts([]);
        setSuggestions({});
        setValidating(false);
      } catch (validationError: any) {
        console.error('❌ [SCHEDULE_MODAL] Erro na validação:', validationError);
        console.error('❌ [SCHEDULE_MODAL] Stack trace:', validationError?.stack);
        console.error('❌ [SCHEDULE_MODAL] Mensagem detalhada:', validationError?.message);

        // Se o erro for de rede ou timeout, permitir salvar (fail-safe)
        const errorMessage = validationError?.message || '';
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
          console.warn('⚠️ [SCHEDULE_MODAL] Erro de rede na validação - permitindo salvar');
          toast.warning('Não foi possível validar conflitos (erro de rede). Salvando mesmo assim...');
          setConflicts([]);
          setSuggestions({});
          setValidating(false);
          // Continuar com o salvamento
        } else {
          toast.error(`Erro ao validar: ${errorMessage}`);
          setValidating(false);
          return;
        }
      }
    } else {
      // Se não há regras ou dados necessários, limpar estados de conflito
      console.log('ℹ️ [SCHEDULE_MODAL] Pulando validação (sem regras ou IDs ausentes)');
      setConflicts([]);
      setSuggestions({});
    }
    setSaving(true);
    try {
      // VERIFICAR AUTENTICAÇÃO ANTES DE SALVAR
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sua sessão expirou. Fazendo logout...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      console.log('💾 [SCHEDULE_MODAL] Salvando regras:', {
        videoId,
        orderId,
        rulesCount: scheduleRules.length,
        userId: session.user.id,
        userEmail: session.user.email
      });

      // Mensagem diferenciada se estiver removendo todas as regras
      if (scheduleRules.length === 0) {
        console.log('🗑️ [SCHEDULE_MODAL] Removendo todas as regras de agendamento');
      }
      await onSave(scheduleRules);
      console.log('✅ [SCHEDULE_MODAL] Agendamento salvo com sucesso');

      // Mensagem apropriada baseada na ação
      if (scheduleRules.length === 0) {
        toast.success('Agendamento removido com sucesso!');
      } else {
        toast.success('Agendamento salvo com sucesso!');
      }

      // Enviar webhook após salvar com sucesso (só se tiver orderId)
      if (orderId) {
        console.log('📡 [SCHEDULE_MODAL] Enviando webhook de programação...');
        try {
          await sendWebhookAfterScheduleSave(orderId, videoName);
          console.log('✅ [SCHEDULE_MODAL] Webhook enviado com sucesso');
        } catch (webhookError) {
          console.error('❌ [SCHEDULE_MODAL] Erro no webhook (não afeta o save):', webhookError);
          // Não mostrar erro do webhook para o usuário, pois o save foi bem-sucedido
        }
      }
      onClose();

      // Forçar refresh da página após salvar para garantir que as mudanças sejam refletidas
      setTimeout(() => {
        console.log('🔄 [SCHEDULE_MODAL] Forçando refresh da página após save');
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('❌ [SCHEDULE_MODAL] Erro ao salvar:', error);
      console.error('❌ [SCHEDULE_MODAL] Stack:', error?.stack);

      // Detectar erro de autenticação/RLS
      if (error.message?.includes('Sessão') || error.message?.includes('permission') || error.message?.includes('Permissão') || error.code === 'PGRST301') {
        toast.error('Sessão expirada. Redirecionando para login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setSaving(false);
    }
  };
  const formatDaysText = (days: number[]) => {
    return days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ');
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header Moderno */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Agendar Vídeo</h2>
              <p className="text-sm text-gray-600 font-normal">{videoName}</p>
            </div>
          </DialogTitle>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Alerta de Conflitos */}
          {conflicts.length > 0 && <ConflictAlert conflicts={conflicts} suggestions={suggestions} newVideoName={videoName} />}

          {/* Indicador de Sucesso */}
          {conflicts.length === 0 && scheduleRules.length > 0 && !validating}

          {/* Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">Como funciona</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Configure horários específicos para este vídeo ser exibido. Durante os períodos agendados, este vídeo terá prioridade sobre o vídeo principal.
                </p>
              </div>
            </div>
          </div>

          {/* Header das Regras */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Regras de Agendamento</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {scheduleRules.length === 0 ? 'Nenhuma regra configurada' : `${scheduleRules.length} ${scheduleRules.length === 1 ? 'regra' : 'regras'} configurada${scheduleRules.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Button type="button" onClick={addNewRule} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          {/* Empty State */}
          {scheduleRules.length === 0 && <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
              <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">Nenhuma regra de agendamento</p>
              <p className="text-sm text-gray-500">Clique em "Nova Regra" para começar</p>
            </div>}

          {/* Lista de Regras - Novo Design */}
          <div className="space-y-4">
            {scheduleRules.map((rule, index) => {
            const ruleIsValid = isRuleValid(rule);
            return <div key={index} className={`border-2 rounded-xl p-5 transition-all ${ruleIsValid ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
                  {/* Header da Regra */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ruleIsValid ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <Calendar className={`h-4 w-4 ${ruleIsValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Regra {index + 1}</h4>
                        {ruleIsValid ? <span className="text-xs text-emerald-600 font-medium">✓ Configuração válida</span> : <span className="text-xs text-amber-600 font-medium">⚠ Preencha todos os campos</span>}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRule(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Dias da Semana - Novo Design */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between">
                      <Label className={`text-sm font-medium ${rule.days_of_week.length === 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                        Dias da Semana {rule.days_of_week.length === 0 && <span className="text-amber-600">*</span>}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Checkbox id={`all-day-${index}`} checked={rule.is_all_day || false} onCheckedChange={checked => updateRule(index, 'is_all_day', checked)} />
                        <Label htmlFor={`all-day-${index}`} className="text-sm font-medium text-gray-600 cursor-pointer">
                          Dia Inteiro
                        </Label>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => {
                    const isSelected = rule.days_of_week.includes(day.value);
                    return <button key={day.value} type="button" onClick={() => toggleDay(index, day.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-300'}`}>
                            {day.label}
                          </button>;
                  })}
                    </div>
                  </div>

                  {/* Horários - Novo Design */}
                  {!rule.is_all_day && <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <Label htmlFor={`start-${index}`} className="text-sm font-medium text-gray-700 mb-2 block">
                          <Clock className="h-3.5 w-3.5 inline mr-1" />
                          Horário Início
                        </Label>
                        <Input id={`start-${index}`} type="time" value={rule.start_time} onChange={e => updateRule(index, 'start_time', e.target.value)} className="border-2 focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <Label htmlFor={`end-${index}`} className="text-sm font-medium text-gray-700 mb-2 block">
                          <Clock className="h-3.5 w-3.5 inline mr-1" />
                          Horário Fim
                        </Label>
                        <Input id={`end-${index}`} type="time" value={rule.end_time} onChange={e => updateRule(index, 'end_time', e.target.value)} className="border-2 focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>}

                  {/* Preview da Regra */}
                  {rule.days_of_week.length > 0 && <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">PRÉVIA</p>
                      <p className="text-sm text-gray-900">
                        <strong>{formatDaysText(rule.days_of_week)}</strong>
                        {rule.is_all_day ? ' • Dia inteiro' : ` • ${rule.start_time} às ${rule.end_time}`}
                      </p>
                    </div>}

                  {/* Status Ativo */}
                  <div className="flex items-center gap-2 pt-4 border-t mt-4">
                    <Checkbox id={`active-${index}`} checked={rule.is_active} onCheckedChange={checked => updateRule(index, 'is_active', checked as boolean)} />
                    <Label htmlFor={`active-${index}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                      Regra ativa
                    </Label>
                  </div>
                </div>;
          })}
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving || validating} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving || validating} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"> 
Salvar{validating ? <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validando...
              </> : saving ? <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </> : <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvar Agendamento
              </>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};