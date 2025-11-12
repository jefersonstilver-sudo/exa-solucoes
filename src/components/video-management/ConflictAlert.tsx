import React from 'react';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ConflictDetails {
  conflictingVideoName: string;
  day: string;
  conflictingTimeRange: string;
  newVideoTimeRange: string;
}

interface ConflictAlertProps {
  conflicts: ConflictDetails[];
  suggestions?: Record<string, string[]>;
  newVideoName: string;
}

const DAYS_MAP: Record<string, string> = {
  '0': 'Domingo',
  '1': 'Segunda-feira',
  '2': 'Terça-feira',
  '3': 'Quarta-feira',
  '4': 'Quinta-feira',
  '5': 'Sexta-feira',
  '6': 'Sábado'
};

export const ConflictAlert: React.FC<ConflictAlertProps> = ({
  conflicts,
  suggestions = {},
  newVideoName
}) => {
  // Agrupar conflitos por dia
  const conflictsByDay = conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.day]) {
      acc[conflict.day] = [];
    }
    acc[conflict.day].push(conflict);
    return acc;
  }, {} as Record<string, ConflictDetails[]>);

  return (
    <Alert variant="destructive" className="mb-4 border-2 border-red-500 bg-red-50">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertTitle className="text-lg font-semibold text-red-900 mb-3">
        ⚠️ Conflito de Agendamento Detectado
      </AlertTitle>
      
      <AlertDescription className="space-y-4">
        <p className="text-sm text-red-800">
          O vídeo <strong>"{newVideoName}"</strong> possui horários que conflitam com outros vídeos já agendados neste pedido.
        </p>

        {/* Lista de Conflitos por Dia */}
        <div className="space-y-3">
          <h4 className="font-medium text-red-900 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Conflitos Identificados:
          </h4>
          
          {Object.entries(conflictsByDay).map(([dayNum, dayConflicts]) => (
            <Card key={dayNum} className="p-3 bg-white border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  {DAYS_MAP[dayNum]}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {dayConflicts.map((conflict, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-start gap-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">
                          Vídeo "{conflict.conflictingVideoName}"
                        </span>
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Horário existente: {conflict.conflictingTimeRange}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-red-600">Horário conflitante: {conflict.newVideoTimeRange}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Sugestões de Horários Disponíveis */}
        {Object.keys(suggestions).length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              💡 Sugestões de Horários Disponíveis:
            </h4>
            <div className="space-y-2">
              {Object.entries(suggestions).map(([day, times]) => (
                <div key={day} className="text-sm">
                  <span className="font-medium text-blue-800">{DAYS_MAP[day]}:</span>
                  <div className="ml-4 text-blue-700">
                    {times.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {times.map((time, idx) => (
                          <li key={idx}>{time}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-blue-600">Nenhum horário disponível neste dia</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-900">
            <strong>📋 Ação Necessária:</strong> Por favor, ajuste os horários ou dias do agendamento para evitar sobreposição com vídeos já programados.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};