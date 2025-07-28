import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleRule {
  id?: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface CampaignScheduleEditProps {
  campaignId: string;
  isAdvanced: boolean;
  onScheduleUpdate?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

const CampaignScheduleEdit: React.FC<CampaignScheduleEditProps> = ({
  campaignId,
  isAdvanced,
  onScheduleUpdate
}) => {
  const [schedules, setSchedules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdvanced) {
      loadSchedules();
    }
  }, [campaignId, isAdvanced]);

  const loadSchedules = async () => {
    try {
      // Buscar horários existentes para campanhas avançadas
      const { data: videoSchedules, error: scheduleError } = await supabase
        .from('campaign_video_schedules')
        .select(`
          id,
          campaign_schedule_rules (
            id,
            days_of_week,
            start_time,
            end_time,
            is_active
          )
        `)
        .eq('campaign_id', campaignId);

      if (scheduleError) throw scheduleError;

      const rules: ScheduleRule[] = [];
      videoSchedules?.forEach(schedule => {
        if (schedule.campaign_schedule_rules) {
          rules.push(...schedule.campaign_schedule_rules);
        }
      });

      if (rules.length === 0) {
        // Se não há horários, criar um padrão
        setSchedules([{
          days_of_week: [1, 2, 3, 4, 5], // Segunda a Sexta
          start_time: '09:00',
          end_time: '18:00',
          is_active: true
        }]);
      } else {
        setSchedules(rules);
      }
    } catch (error: any) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários da campanha');
    }
  };

  const addSchedule = () => {
    setSchedules(prev => [...prev, {
      days_of_week: [1, 2, 3, 4, 5],
      start_time: '09:00',
      end_time: '18:00',
      is_active: true
    }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof ScheduleRule, value: any) => {
    setSchedules(prev => prev.map((schedule, i) => 
      i === index ? { ...schedule, [field]: value } : schedule
    ));
  };

  const toggleDay = (scheduleIndex: number, dayValue: number) => {
    setSchedules(prev => prev.map((schedule, i) => {
      if (i === scheduleIndex) {
        const days = schedule.days_of_week.includes(dayValue)
          ? schedule.days_of_week.filter(d => d !== dayValue)
          : [...schedule.days_of_week, dayValue].sort();
        return { ...schedule, days_of_week: days };
      }
      return schedule;
    }));
  };

  const saveSchedules = async () => {
    if (!isAdvanced) {
      toast.error('Horários só podem ser editados em campanhas avançadas');
      return;
    }

    setLoading(true);
    try {
      // Primeiro, buscar ou criar um video schedule para esta campanha
      let { data: videoSchedules, error: scheduleError } = await supabase
        .from('campaign_video_schedules')
        .select('id')
        .eq('campaign_id', campaignId);

      if (scheduleError) throw scheduleError;

      let videoScheduleId: string;

      if (!videoSchedules || videoSchedules.length === 0) {
        // Criar um novo video schedule se não existir
        const { data: newSchedule, error: createError } = await supabase
          .from('campaign_video_schedules')
          .insert({
            campaign_id: campaignId,
            video_id: null, // Pode ser null para schedules de horário
            slot_position: 1
          })
          .select('id')
          .single();

        if (createError) throw createError;
        videoScheduleId = newSchedule.id;
      } else {
        videoScheduleId = videoSchedules[0].id;
      }

      // Deletar regras antigas
      const { error: deleteError } = await supabase
        .from('campaign_schedule_rules')
        .delete()
        .eq('campaign_video_schedule_id', videoScheduleId);

      if (deleteError) throw deleteError;

      // Inserir novas regras
      const newRules = schedules.map(schedule => ({
        campaign_video_schedule_id: videoScheduleId,
        days_of_week: schedule.days_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_active: schedule.is_active
      }));

      if (newRules.length > 0) {
        const { error: insertError } = await supabase
          .from('campaign_schedule_rules')
          .insert(newRules);

        if (insertError) throw insertError;
      }

      // Resetar o status da campanha para permitir que o scheduler controle automaticamente
      await supabase
        .from('campaigns_advanced')
        .update({ status: 'scheduled' }) // Definir como scheduled para que o scheduler calcule o status correto
        .eq('id', campaignId);

      toast.success('Horários salvos com sucesso! O status será recalculado automaticamente.');
      onScheduleUpdate?.();
    } catch (error: any) {
      console.error('Erro ao salvar horários:', error);
      toast.error('Erro ao salvar horários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdvanced) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horários de Veiculação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            A edição de horários está disponível apenas para campanhas avançadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Horários de Veiculação
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addSchedule}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Horário
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedules.map((schedule, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Horário {index + 1}</h4>
              {schedules.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSchedule(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Dias da Semana */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Dias da Semana</Label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${index}-${day.value}`}
                      checked={schedule.days_of_week.includes(day.value)}
                      onCheckedChange={() => toggleDay(index, day.value)}
                    />
                    <Label 
                      htmlFor={`day-${index}-${day.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`start-${index}`} className="text-sm font-medium mb-1 block">
                  Horário de Início
                </Label>
                <Input
                  id={`start-${index}`}
                  type="time"
                  value={schedule.start_time}
                  onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`end-${index}`} className="text-sm font-medium mb-1 block">
                  Horário de Fim
                </Label>
                <Input
                  id={`end-${index}`}
                  type="time"
                  value={schedule.end_time}
                  onChange={(e) => updateSchedule(index, 'end_time', e.target.value)}
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`active-${index}`}
                checked={schedule.is_active}
                onCheckedChange={(checked) => updateSchedule(index, 'is_active', checked)}
              />
              <Label htmlFor={`active-${index}`} className="text-sm cursor-pointer">
                Horário ativo
              </Label>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button onClick={saveSchedules} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Horários'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignScheduleEdit;