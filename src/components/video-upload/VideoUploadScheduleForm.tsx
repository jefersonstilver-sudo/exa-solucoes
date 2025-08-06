import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, Plus, Trash2, ArrowLeft, Upload } from 'lucide-react';

export interface ScheduleRule {
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface VideoUploadScheduleFormProps {
  videoTitle: string;
  fileName: string;
  onBack: () => void;
  onSubmit: (scheduleRules: ScheduleRule[]) => void;
  uploading: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullName: 'Domingo' },
  { value: 1, label: 'Seg', fullName: 'Segunda-feira' },
  { value: 2, label: 'Ter', fullName: 'Terça-feira' },
  { value: 3, label: 'Qua', fullName: 'Quarta-feira' },
  { value: 4, label: 'Qui', fullName: 'Quinta-feira' },
  { value: 5, label: 'Sex', fullName: 'Sexta-feira' },
  { value: 6, label: 'Sáb', fullName: 'Sábado' }
];

export const VideoUploadScheduleForm: React.FC<VideoUploadScheduleFormProps> = ({
  videoTitle,
  fileName,
  onBack,
  onSubmit,
  uploading
}) => {
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([
    {
      daysOfWeek: [1, 2, 3, 4, 5], // Segunda a sexta por padrão
      startTime: '08:00',
      endTime: '18:00',
      isActive: true
    }
  ]);

  const addScheduleRule = () => {
    const newRule: ScheduleRule = {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00',
      isActive: true
    };
    setScheduleRules([...scheduleRules, newRule]);
  };

  const updateScheduleRule = (ruleIndex: number, field: keyof ScheduleRule, value: any) => {
    const updated = [...scheduleRules];
    updated[ruleIndex] = {
      ...updated[ruleIndex],
      [field]: value
    };
    setScheduleRules(updated);
  };

  const removeScheduleRule = (ruleIndex: number) => {
    const updated = scheduleRules.filter((_, i) => i !== ruleIndex);
    setScheduleRules(updated);
  };

  const toggleDay = (ruleIndex: number, day: number) => {
    const rule = scheduleRules[ruleIndex];
    const currentDays = rule.daysOfWeek;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    updateScheduleRule(ruleIndex, 'daysOfWeek', newDays);
  };

  const handleSubmit = () => {
    onSubmit(scheduleRules);
  };

  const isValidSchedule = scheduleRules.some(rule => 
    rule.isActive && 
    rule.daysOfWeek.length > 0 && 
    rule.startTime && 
    rule.endTime
  );

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Agendamento do Vídeo
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Informações do vídeo */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Título: {videoTitle}</p>
            <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>
          </div>
        </div>


        {/* Regras de horário */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Regras de Exibição</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addScheduleRule}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Nova Regra
            </Button>
          </div>

          {scheduleRules.map((rule, ruleIndex) => (
            <div key={ruleIndex} className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  Regra {ruleIndex + 1}
                </Label>
                {scheduleRules.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScheduleRule(ruleIndex)}
                    className="text-destructive hover:text-destructive h-6 w-6 sm:h-8 sm:w-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Dias da semana */}
              <div>
                <Label className="text-xs sm:text-sm">Dias da Semana</Label>
                <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1 sm:gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Badge
                      key={day.value}
                      variant={rule.daysOfWeek.includes(day.value) ? "default" : "outline"}
                      className="cursor-pointer select-none hover:opacity-80 transition-opacity text-xs p-1 sm:p-2"
                      onClick={() => toggleDay(ruleIndex, day.value)}
                      title={day.fullName}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toque nos dias para selecionar/deselecionar
                </p>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <Label htmlFor={`start-time-${ruleIndex}`} className="text-xs sm:text-sm">
                    Horário de Início
                  </Label>
                  <Input
                    id={`start-time-${ruleIndex}`}
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => updateScheduleRule(ruleIndex, 'startTime', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor={`end-time-${ruleIndex}`} className="text-xs sm:text-sm">
                    Horário de Fim
                  </Label>
                  <Input
                    id={`end-time-${ruleIndex}`}
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => updateScheduleRule(ruleIndex, 'endTime', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Status ativo */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`active-${ruleIndex}`}
                  checked={rule.isActive}
                  onCheckedChange={(checked) => 
                    updateScheduleRule(ruleIndex, 'isActive', checked)
                  }
                />
                <Label htmlFor={`active-${ruleIndex}`} className="text-xs sm:text-sm">
                  Regra ativa
                </Label>
              </div>
            </div>
          ))}
        </div>

        {/* Dicas */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded-lg">
          <p>💡 <strong>Dicas para configurar o agendamento:</strong></p>
          <p>• Configure diferentes horários para dias específicos</p>
          <p>• Use múltiplas regras para períodos diferentes</p>
          <p>• Desative regras temporariamente sem excluí-las</p>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!isValidSchedule || uploading}
            className="w-full sm:flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Fazer Upload com Agendamento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};