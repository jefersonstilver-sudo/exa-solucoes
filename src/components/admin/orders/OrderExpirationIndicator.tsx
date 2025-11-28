import React from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { differenceInDays, differenceInHours, isPast } from 'date-fns';

interface OrderExpirationIndicatorProps {
  endDate: string;
  compact?: boolean;
}

const OrderExpirationIndicator: React.FC<OrderExpirationIndicatorProps> = ({ 
  endDate,
  compact = false 
}) => {
  const now = new Date();
  const end = new Date(endDate);
  
  // Verificar se já expirou
  if (isPast(end)) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 border border-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Clock className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-medium text-gray-600">Finalizado</span>
      </div>
    );
  }
  
  const daysRemaining = differenceInDays(end, now);
  const hoursRemaining = differenceInHours(end, now);
  
  // Determinar cor e estilo baseado nos dias restantes
  let bgColor = '';
  let textColor = '';
  let borderColor = '';
  let icon = <Clock className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
  let animate = '';
  let displayText = '';
  
  if (daysRemaining > 10) {
    // Verde - mais de 10 dias
    bgColor = 'bg-green-50';
    textColor = 'text-green-700';
    borderColor = 'border-green-300';
    displayText = `${daysRemaining} dias`;
  } else if (daysRemaining >= 6) {
    // Laranja - 6 a 10 dias
    bgColor = 'bg-orange-50';
    textColor = 'text-orange-700';
    borderColor = 'border-orange-300';
    icon = <AlertTriangle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    displayText = `${daysRemaining} dias`;
  } else if (daysRemaining >= 3) {
    // Vermelho - 3 a 5 dias
    bgColor = 'bg-red-50';
    textColor = 'text-red-700';
    borderColor = 'border-red-300';
    icon = <AlertCircle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    displayText = `${daysRemaining} dias`;
  } else {
    // Vermelho piscando - 1 a 2 dias (mostrar horas)
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    borderColor = 'border-red-400';
    icon = <AlertCircle className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    animate = 'animate-pulse';
    
    if (hoursRemaining > 24) {
      displayText = `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`;
    } else {
      displayText = `${hoursRemaining}h`;
    }
  }
  
  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${bgColor} ${textColor} ${borderColor} ${animate} ${compact ? 'text-xs' : 'text-sm'}`}
      title={`Faltam ${daysRemaining} dias para o término`}
    >
      {icon}
      <span className="font-medium whitespace-nowrap">{displayText}</span>
    </div>
  );
};

export default OrderExpirationIndicator;
