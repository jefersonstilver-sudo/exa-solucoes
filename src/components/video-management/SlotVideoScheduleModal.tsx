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

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

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

  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>(
    existingRules.length > 0 ? existingRules : []
  );
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
    updated[index] = { ...updated[index], [field]: value };
    
    // Se ativou "Dia Inteiro", configurar horários automaticamente
    if (field === 'is_all_day' && value === true) {
      updated[index].start_time = '00:00';
      updated[index].end_time = '23:59';
    }
    
    setScheduleRules(updated);
  };

  const toggleDay = (ruleIndex: number, dayValue: number) => {
    const rule = scheduleRules[ruleIndex];
    const days = rule.days_of_week.includes(dayValue)
      ? rule.days_of_week.filter(d => d !== dayValue)
      : [...rule.days_of_week, dayValue].sort((a, b) => a - b);
    
    updateRule(ruleIndex, 'days_of_week', days);
  };

  // Validação de regra individual
  const isRuleValid = (rule: ScheduleRule) => {
    const hasDays = rule.days_of_week.length > 0;
    const hasValidTime = rule.is_all_day || (rule.start_time && rule.end_time && rule.start_time < rule.end_time);
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
    const invalidRules = scheduleRules.filter((rule) => !isRuleValid(rule));

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
      const { data: { session } } = await supabase.auth.getSession();
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
      if (error.message?.includes('Sessão') || 
          error.message?.includes('permission') ||
          error.message?.includes('Permissão') ||
          error.code === 'PGRST301') {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Agendar Vídeo: {videoName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerta de Conflitos */}
          {conflicts.length > 0 && (
            <ConflictAlert
              conflicts={conflicts}
              suggestions={suggestions}
              newVideoName={videoName}
            />
          )}

          {/* Indicador de Validação */}
          {conflicts.length === 0 && scheduleRules.length > 0 && !validating && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                ✓ Sem conflitos detectados
              </span>
            </div>
          )}

          {/* Informações */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Como funciona:</strong> Configure horários específicos para este vídeo ser exibido. 
              Durante os horários agendados, este vídeo terá prioridade sobre o vídeo base.
            </p>
          </div>

          {/* Lista de Regras */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Regras de Agendamento</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewRule}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Regra</span>
              </Button>
            </div>

            {scheduleRules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhuma regra de agendamento configurada</p>
                <p className="text-sm">Clique em "Nova Regra" para começar</p>
              </div>
            )}

            {scheduleRules.map((rule, index) => {
              const ruleIsValid = isRuleValid(rule);
              return (
              <div key={index} className={`border rounded-lg p-4 space-y-4 ${ruleIsValid ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-gray-700">Regra {index + 1}</h4>
                    {ruleIsValid ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">✓ Válida</span>
                    ) : (
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">⚠ Incompleta</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dias da Semana + Toggle Dia Inteiro */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Label className={`text-sm font-medium mb-2 block ${rule.days_of_week.length === 0 ? 'text-orange-600' : ''}`}>
                      Dias da Semana {rule.days_of_week.length === 0 && '(obrigatório)'}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = rule.days_of_week.includes(day.value);
                        return (
                          <Badge
                            key={day.value}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer ${isSelected ? 'bg-blue-600' : ''}`}
                            onClick={() => toggleDay(index, day.value)}
                          >
                            {day.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="ml-4 mt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`all-day-${index}`}
                        checked={rule.is_all_day || false}
                        onCheckedChange={(checked) => updateRule(index, 'is_all_day', checked)}
                      />
                      <Label htmlFor={`all-day-${index}`} className="text-sm font-medium">
                        Dia Inteiro
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Horários - só aparecem se NÃO for dia inteiro */}
                {!rule.is_all_day && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`start-${index}`} className={`text-sm font-medium ${!rule.start_time ? 'text-orange-600' : ''}`}>
                        Horário Início {!rule.start_time && '(obrigatório)'}
                      </Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={rule.start_time}
                        onChange={(e) => updateRule(index, 'start_time', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end-${index}`} className={`text-sm font-medium ${!rule.end_time ? 'text-orange-600' : ''}`}>
                        Horário Fim {!rule.end_time && '(obrigatório)'}
                      </Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        value={rule.end_time}
                        onChange={(e) => updateRule(index, 'end_time', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Preview da Regra */}
                {rule.days_of_week.length > 0 && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-700">
                      <strong>Preview:</strong> {formatDaysText(rule.days_of_week)} 
                      {rule.is_all_day ? ' - Dia inteiro' : ` das ${rule.start_time} às ${rule.end_time}`}
                    </p>
                  </div>
                )}

                {/* Status Ativo */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`active-${index}`}
                    checked={rule.is_active}
                    onCheckedChange={(checked) => updateRule(index, 'is_active', checked)}
                  />
                  <Label htmlFor={`active-${index}`} className="text-sm">
                    Regra ativa
                  </Label>
                </div>
              </div>
              );
            })}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving || validating || conflicts.length > 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {validating ? 'Validando conflitos...' : saving ? 'Salvando...' : 'Salvar Agendamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};