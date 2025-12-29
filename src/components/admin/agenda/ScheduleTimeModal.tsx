import React, { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, Timer, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotionTask {
  id: string;
  nome: string;
  prioridade: string | null;
  status: string | null;
  data: string | null;
}

interface ScheduleTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: NotionTask | null;
  targetDate: string | null;
  onConfirm: (hora: string, tipoHorario: 'fixo' | 'ate') => void;
  isLoading?: boolean;
}

const ScheduleTimeModal: React.FC<ScheduleTimeModalProps> = ({
  open,
  onOpenChange,
  task,
  targetDate,
  onConfirm,
  isLoading = false,
}) => {
  const [tipoHorario, setTipoHorario] = useState<'fixo' | 'ate'>('fixo');
  const [hora, setHora] = useState('09:00');

  const handleConfirm = () => {
    if (!hora) return;
    onConfirm(hora, tipoHorario);
  };

  const handleClose = () => {
    setTipoHorario('fixo');
    setHora('09:00');
    onOpenChange(false);
  };

  const formattedDate = targetDate 
    ? format(parseISO(targetDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-blue-50">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            Agendar Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Task Info */}
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {task?.nome || 'Tarefa'}
            </p>
            {task?.prioridade && (
              <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${
                task.prioridade === 'Alta' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {task.prioridade}
              </span>
            )}
          </div>

          {/* Date Display */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Data selecionada</p>
              <p className="text-sm font-semibold text-blue-800 capitalize">{formattedDate}</p>
            </div>
          </div>

          {/* Time Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Tipo de horário</Label>
            <RadioGroup
              value={tipoHorario}
              onValueChange={(value) => setTipoHorario(value as 'fixo' | 'ate')}
              className="grid grid-cols-2 gap-3"
            >
              <label
                htmlFor="tipo-fixo"
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  tipoHorario === 'fixo'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="fixo" id="tipo-fixo" />
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${tipoHorario === 'fixo' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${tipoHorario === 'fixo' ? 'text-blue-700' : 'text-gray-700'}`}>
                      Horário fixo
                    </p>
                    <p className="text-[10px] text-gray-500">Ex: às 14:00</p>
                  </div>
                </div>
              </label>

              <label
                htmlFor="tipo-ate"
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  tipoHorario === 'ate'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="ate" id="tipo-ate" />
                <div className="flex items-center gap-2">
                  <Timer className={`h-4 w-4 ${tipoHorario === 'ate' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${tipoHorario === 'ate' ? 'text-amber-700' : 'text-gray-700'}`}>
                      Até horário
                    </p>
                    <p className="text-[10px] text-gray-500">Ex: até 17:00</p>
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <Label htmlFor="hora" className="text-sm font-medium text-gray-700">
              {tipoHorario === 'fixo' ? 'Horário' : 'Até que horas?'}
            </Label>
            <div className="relative">
              <Input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="pl-10 text-lg h-12"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Warning if no time */}
          {!hora && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-700">Selecione um horário para continuar</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!hora || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Confirmar Agendamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTimeModal;
