import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface ScheduleRule {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface VideoScheduleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoName: string;
  scheduleRules?: ScheduleRule[];
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const formatTime = (time: string) => {
  return time.slice(0, 5); // Remove seconds from HH:MM:SS
};

const formatDays = (days: number[]) => {
  return days.map(day => dayNames[day]).join(', ');
};

export const VideoScheduleDetailsModal: React.FC<VideoScheduleDetailsModalProps> = ({
  isOpen,
  onClose,
  videoName,
  scheduleRules
}) => {
  const hasScheduleRules = scheduleRules && scheduleRules.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Programação do Vídeo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm text-muted-foreground">Vídeo</p>
            <p className="font-semibold truncate">{videoName}</p>
          </div>

          {hasScheduleRules ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Regras de Programação
              </h4>
              
              {scheduleRules.map((rule, index) => (
                <div 
                  key={rule.id} 
                  className={`p-3 border rounded-lg ${
                    rule.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Regra {index + 1}</span>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dias: </span>
                      <span className="font-medium">{formatDays(rule.days_of_week)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Horário: </span>
                      <span className="font-medium">
                        {formatTime(rule.start_time)} - {formatTime(rule.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 text-sm">
                    Sem Programação Específica
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Este vídeo não possui horários de exibição específicos configurados. 
                    Será exibido conforme as regras padrão do sistema.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};