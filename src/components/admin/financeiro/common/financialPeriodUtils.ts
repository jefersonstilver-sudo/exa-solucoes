/**
 * Financial Period Utilities
 * 
 * Tipos e funções para cálculo de períodos financeiros
 */

import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  subDays,
  subMonths,
  subQuarters,
  subYears,
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type FinancialPeriodType = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | '7days'
  | 'current_month'
  | 'last_month'
  | '30days'
  | 'current_quarter'
  | 'last_quarter'
  | 'current_semester'
  | 'current_year'
  | 'last_year'
  | 'all'
  | 'custom';

export interface PeriodOption {
  value: FinancialPeriodType;
  label: string;
  group: 'quick' | 'monthly' | 'extended' | 'other';
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  // Quick
  { value: 'today', label: 'Hoje', group: 'quick' },
  { value: 'yesterday', label: 'Ontem', group: 'quick' },
  { value: 'this_week', label: 'Esta Semana', group: 'quick' },
  { value: '7days', label: 'Últimos 7 dias', group: 'quick' },
  
  // Monthly
  { value: 'current_month', label: 'Este Mês', group: 'monthly' },
  { value: 'last_month', label: 'Mês Anterior', group: 'monthly' },
  { value: '30days', label: 'Últimos 30 dias', group: 'monthly' },
  
  // Extended
  { value: 'current_quarter', label: 'Este Trimestre', group: 'extended' },
  { value: 'last_quarter', label: 'Trimestre Anterior', group: 'extended' },
  { value: 'current_semester', label: 'Este Semestre', group: 'extended' },
  { value: 'current_year', label: 'Este Ano', group: 'extended' },
  { value: 'last_year', label: 'Ano Anterior', group: 'extended' },
  
  // Other
  { value: 'all', label: 'Tudo (Desde o Início)', group: 'other' },
  { value: 'custom', label: 'Período Personalizado', group: 'other' },
];

export interface PeriodDates {
  start: Date | undefined;
  end: Date | undefined;
  label: string;
}

/**
 * Calcula as datas de início e fim para um tipo de período
 */
export const getFinancialPeriodDates = (
  period: FinancialPeriodType,
  customStart?: Date,
  customEnd?: Date
): PeriodDates => {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Hoje'
      };

    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
        label: 'Ontem'
      };

    case 'this_week':
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }),
        end: endOfWeek(now, { weekStartsOn: 0 }),
        label: 'Esta Semana'
      };

    case '7days':
      return {
        start: startOfDay(subDays(now, 6)),
        end: endOfDay(now),
        label: 'Últimos 7 dias'
      };

    case 'current_month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: format(now, 'MMMM yyyy', { locale: ptBR })
      };

    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: format(lastMonth, 'MMMM yyyy', { locale: ptBR })
      };

    case '30days':
      return {
        start: startOfDay(subDays(now, 29)),
        end: endOfDay(now),
        label: 'Últimos 30 dias'
      };

    case 'current_quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
        label: `${Math.ceil((now.getMonth() + 1) / 3)}º Trimestre ${now.getFullYear()}`
      };

    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      return {
        start: startOfQuarter(lastQuarter),
        end: endOfQuarter(lastQuarter),
        label: `${Math.ceil((lastQuarter.getMonth() + 1) / 3)}º Trimestre ${lastQuarter.getFullYear()}`
      };

    case 'current_semester':
      const semesterStart = now.getMonth() < 6 
        ? new Date(now.getFullYear(), 0, 1)
        : new Date(now.getFullYear(), 6, 1);
      const semesterEnd = now.getMonth() < 6
        ? new Date(now.getFullYear(), 5, 30, 23, 59, 59, 999)
        : new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        start: semesterStart,
        end: semesterEnd,
        label: `${now.getMonth() < 6 ? '1º' : '2º'} Semestre ${now.getFullYear()}`
      };

    case 'current_year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: `Ano ${now.getFullYear()}`
      };

    case 'last_year':
      const lastYear = subYears(now, 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear),
        label: `Ano ${lastYear.getFullYear()}`
      };

    case 'all':
      return {
        start: undefined,
        end: undefined,
        label: 'Tudo'
      };

    case 'custom':
      if (customStart && customEnd) {
        return {
          start: startOfDay(customStart),
          end: endOfDay(customEnd),
          label: `${format(customStart, 'dd/MM/yy')} - ${format(customEnd, 'dd/MM/yy')}`
        };
      }
      return {
        start: undefined,
        end: undefined,
        label: 'Período Personalizado'
      };

    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: format(now, 'MMMM yyyy', { locale: ptBR })
      };
  }
};

/**
 * Retorna o label curto para exibição no botão
 */
export const getPeriodDisplayLabel = (
  period: FinancialPeriodType,
  customStart?: Date,
  customEnd?: Date
): string => {
  const { label } = getFinancialPeriodDates(period, customStart, customEnd);
  
  // Capitalizar primeira letra para meses
  if (period === 'current_month' || period === 'last_month') {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  
  return label;
};
