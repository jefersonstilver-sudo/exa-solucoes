import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Repeat, Calendar, TrendingUp, Infinity, Hash } from 'lucide-react';
import { format, addMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/format';

interface RecorrenciaProgressCardProps {
  recorrenciaTipo: 'infinita' | 'limitada' | 'personalizada';
  periodicidade: string;
  totalParcelas: number | null;
  parcelasPagas: number;
  valor: number;
  dataProximoVencimento: string | null;
  reajusteTipo: string | null;
  reajustePercentual: number | null;
  dataProximoReajuste: string | null;
  className?: string;
}

export const RecorrenciaProgressCard: React.FC<RecorrenciaProgressCardProps> = ({
  recorrenciaTipo,
  periodicidade,
  totalParcelas,
  parcelasPagas,
  valor,
  dataProximoVencimento,
  reajusteTipo,
  reajustePercentual,
  dataProximoReajuste,
  className = '',
}) => {
  const progressPercentage = totalParcelas ? (parcelasPagas / totalParcelas) * 100 : 0;

  const getRecorrenciaLabel = () => {
    switch (recorrenciaTipo) {
      case 'infinita':
        return { icon: Infinity, label: 'Infinita', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'limitada':
        return { icon: Hash, label: 'Limitada', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'personalizada':
        return { icon: Repeat, label: 'Personalizada', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      default:
        return { icon: Repeat, label: 'Recorrente', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const getReajusteLabel = () => {
    switch (reajusteTipo) {
      case 'ipca':
        return 'IPCA (anual)';
      case 'igpm':
        return 'IGP-M (anual)';
      case 'fixo':
        return `Fixo (${reajustePercentual || 0}% a.a.)`;
      default:
        return null;
    }
  };

  const recConfig = getRecorrenciaLabel();
  const RecIcon = recConfig.icon;
  const reajusteLabel = getReajusteLabel();

  return (
    <div className={`bg-gray-50 rounded-xl p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Resumo da Recorrência</span>
        </div>
        <Badge variant="outline" className={`${recConfig.color} text-xs capitalize`}>
          <RecIcon className="h-3 w-3 mr-1" />
          {recConfig.label}
        </Badge>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Periodicidade</p>
          <p className="font-medium text-gray-900 capitalize">{periodicidade}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Valor</p>
          <p className="font-medium text-gray-900">{formatCurrency(valor)}</p>
        </div>
      </div>

      {/* Progress - Only for limited recurrence */}
      {recorrenciaTipo === 'limitada' && totalParcelas && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium text-gray-900">
              {parcelasPagas} de {totalParcelas} pagas
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-gray-500 text-right">
            {Math.round(progressPercentage)}% concluído
          </p>
        </div>
      )}

      {/* Next Due Date */}
      {dataProximoVencimento && (
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Próximo vencimento</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {format(new Date(dataProximoVencimento), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      )}

      {/* Reajuste Info */}
      {reajusteLabel && (
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-emerald-700">Reajuste</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-800">{reajusteLabel}</p>
            {dataProximoReajuste && (
              <p className="text-xs text-emerald-600">
                Próximo em {format(new Date(dataProximoReajuste), 'MMM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
