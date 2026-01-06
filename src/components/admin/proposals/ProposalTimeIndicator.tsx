import React from 'react';
import { differenceInDays, differenceInHours, isPast } from 'date-fns';
import { Clock, AlertTriangle, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalTimeIndicatorProps {
  createdAt: string;
  expiresAt: string | null;
  status: string;
  compact?: boolean;
}

export const ProposalTimeIndicator: React.FC<ProposalTimeIndicatorProps> = ({
  createdAt,
  expiresAt,
  status,
  compact = false
}) => {
  // Status finais não precisam de indicador de tempo
  const finalStatuses = ['aceita', 'paga', 'convertida', 'recusada', 'cancelada'];
  if (finalStatuses.includes(status)) return null;

  const now = new Date();
  const created = new Date(createdAt);
  const daysActive = differenceInDays(now, created);
  
  // Sem expiração (indeterminada)
  if (!expiresAt) {
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-blue-50 text-blue-700 border border-blue-200",
        compact && "px-1.5"
      )}>
        <Infinity className={cn("h-3 w-3", compact && "h-2.5 w-2.5")} />
        <span className={cn("text-[10px] font-medium", compact && "text-[9px]")}>
          {daysActive}d ativa
        </span>
      </div>
    );
  }

  const expires = new Date(expiresAt);
  const hoursUntilExpiry = differenceInHours(expires, now);
  const daysUntilExpiry = differenceInDays(expires, now);
  const isExpired = isPast(expires);
  const isAboutToExpire = hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 3;

  // JÁ EXPIRADA
  if (isExpired) {
    const daysExpired = differenceInDays(now, expires);
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full animate-pulse",
        "bg-red-100 text-red-700 border border-red-300",
        compact && "px-1.5"
      )}>
        <AlertTriangle className={cn("h-3 w-3", compact && "h-2.5 w-2.5")} />
        <span className={cn("text-[10px] font-medium", compact && "text-[9px]")}>
          Expirada há {daysExpired}d
        </span>
      </div>
    );
  }

  // EXPIRA EM MENOS DE 24H
  if (isAboutToExpire) {
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full animate-pulse",
        "bg-orange-100 text-orange-700 border border-orange-300",
        compact && "px-1.5"
      )}>
        <AlertTriangle className={cn("h-3 w-3", compact && "h-2.5 w-2.5")} />
        <span className={cn("text-[10px] font-medium", compact && "text-[9px]")}>
          Expira em {hoursUntilExpiry}h
        </span>
      </div>
    );
  }

  // EXPIRA EM ATÉ 3 DIAS
  if (isExpiringSoon) {
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full",
        "bg-amber-50 text-amber-700 border border-amber-200",
        compact && "px-1.5"
      )}>
        <Clock className={cn("h-3 w-3", compact && "h-2.5 w-2.5")} />
        <span className={cn("text-[10px] font-medium", compact && "text-[9px]")}>
          Expira em {daysUntilExpiry}d
        </span>
      </div>
    );
  }

  // ATIVA COM TEMPO
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-0.5 rounded-full",
      "bg-gray-50 text-gray-600 border border-gray-200",
      compact && "px-1.5"
    )}>
      <Clock className={cn("h-3 w-3", compact && "h-2.5 w-2.5")} />
      <span className={cn("text-[10px] font-medium", compact && "text-[9px]")}>
        {daysActive}d • vence em {daysUntilExpiry}d
      </span>
    </div>
  );
};
