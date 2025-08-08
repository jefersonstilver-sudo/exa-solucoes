import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
  existingRules = []
}) => {
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>(
    existingRules.length > 0 ? existingRules : []
  );
  const [saving, setSaving] = useState(false);

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
    setScheduleRules(scheduleRules.filter((_, i) => i !== index));
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

  const validateRules = (): boolean => {
    for (const rule of scheduleRules) {
      if (rule.days_of_week.length === 0) {
        toast.error('Selecione pelo menos um dia da semana para cada regra');
        return false;
      }
      
      // Pular validação de horários se for "Dia Inteiro"
      if (!rule.is_all_day && rule.start_time >= rule.end_time) {
        toast.error('Horário de início deve ser menor que horário de fim');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateRules()) return;
    
    setSaving(true);
    try {
      await onSave(scheduleRules);
      toast.success('Agendamento salvo com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
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

            {scheduleRules.map((rule, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700">Regra {index + 1}</h4>
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
                    <Label className="text-sm font-medium mb-2 block">Dias da Semana</Label>
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
                      <Label htmlFor={`start-${index}`} className="text-sm font-medium">
                        Horário Início
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
                      <Label htmlFor={`end-${index}`} className="text-sm font-medium">
                        Horário Fim
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
            ))}
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
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Salvando...' : 'Salvar Agendamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};