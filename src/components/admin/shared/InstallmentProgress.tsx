import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Installment {
  installment: number;
  due_date: string;
  amount: number;
  status?: string;
  paid_at?: string;
}

interface InstallmentProgressProps {
  installments: Installment[];
  totalValue: number;
  compact?: boolean;
  showDetails?: boolean;
}

const formatCurrency = (value: number) => {
  return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const InstallmentProgress: React.FC<InstallmentProgressProps> = ({
  installments,
  totalValue,
  compact = false,
  showDetails = false,
}) => {
  if (!installments || installments.length === 0) return null;

  // Calculate paid amount and progress
  const paidInstallments = installments.filter(i => i.status === 'pago');
  const paidAmount = paidInstallments.reduce((sum, i) => sum + i.amount, 0);
  const progressPercent = totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0;

  // Find next pending installment
  const pendingInstallments = installments
    .filter(i => i.status !== 'pago')
    .sort((a, b) => a.installment - b.installment);
  const nextInstallment = pendingInstallments[0];

  // Find last paid installment
  const lastPaid = paidInstallments
    .sort((a, b) => b.installment - a.installment)[0];

  if (compact) {
    return (
      <div className="space-y-1.5">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progressPercent === 100 ? "bg-emerald-500" : "bg-[#9C1E1E]"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {progressPercent}%
          </span>
        </div>

        {/* Next and last paid */}
        <div className="flex items-center justify-between text-[10px]">
          {lastPaid && (
            <div className="flex items-center gap-1 text-emerald-600">
              <Check className="h-3 w-3" />
              <span>{formatCurrency(lastPaid.amount)}</span>
            </div>
          )}
          {nextInstallment && (
            <div className="flex items-center gap-1 text-amber-600">
              <Clock className="h-3 w-3" />
              <span>{formatCurrency(nextInstallment.amount)} ({formatDate(nextInstallment.due_date)})</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {paidInstallments.length}/{installments.length} parcelas pagas
        </span>
        <span className={cn(
          "text-xs font-bold",
          progressPercent === 100 ? "text-emerald-600" : "text-[#9C1E1E]"
        )}>
          {progressPercent}% recebido
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            progressPercent === 100 ? "bg-emerald-500" : "bg-[#9C1E1E]"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Values summary */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-muted-foreground">Recebido: </span>
          <span className="font-semibold text-emerald-600">{formatCurrency(paidAmount)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Falta: </span>
          <span className="font-semibold text-amber-600">{formatCurrency(totalValue - paidAmount)}</span>
        </div>
      </div>

      {/* Next installment highlight */}
      {nextInstallment && (
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-[10px] text-amber-700">Próxima parcela</p>
              <p className="text-sm font-bold text-amber-800">
                {formatCurrency(nextInstallment.amount)}
                <span className="text-xs font-normal ml-1">
                  vence {formatDate(nextInstallment.due_date)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last paid */}
      {lastPaid && (
        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <div className="flex-1">
              <p className="text-[10px] text-emerald-700">Última paga</p>
              <p className="text-sm font-bold text-emerald-800">
                {formatCurrency(lastPaid.amount)}
                {lastPaid.paid_at && (
                  <span className="text-xs font-normal ml-1">
                    em {formatDate(lastPaid.paid_at)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full installment list */}
      {showDetails && (
        <div className="space-y-1 pt-2 border-t">
          <p className="text-[10px] font-medium text-muted-foreground mb-2">Todas as parcelas:</p>
          {installments.map((inst) => (
            <div 
              key={inst.installment}
              className={cn(
                "flex items-center justify-between p-1.5 rounded text-xs",
                inst.status === 'pago' ? "bg-emerald-50" : "bg-gray-50"
              )}
            >
              <div className="flex items-center gap-2">
                {inst.status === 'pago' ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Clock className="h-3 w-3 text-gray-400" />
                )}
                <span className="font-medium">{inst.installment}ª</span>
                <span className="text-muted-foreground">{formatDate(inst.due_date)}</span>
              </div>
              <span className={cn(
                "font-semibold",
                inst.status === 'pago' ? "text-emerald-600" : "text-foreground"
              )}>
                {formatCurrency(inst.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
