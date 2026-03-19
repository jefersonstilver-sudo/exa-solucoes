import React from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

export interface TaskReminder {
  id: string;
  tipo: string;
  unidade: string;
  valor: number;
  ativo: boolean;
}

interface TaskRemindersPanelProps {
  reminders: TaskReminder[];
  onChange: (reminders: TaskReminder[]) => void;
  maxReminders?: number;
  className?: string;
}

const UNIDADE_LABELS: Record<string, string> = {
  minutos: 'min',
  horas: 'h',
  dias: 'dias',
  semanas: 'sem',
};

const TIPO_LABELS: Record<string, string> = {
  notificacao: '🔔 Alerta',
  email: '📧 Email',
};

export const DEFAULT_REMINDERS: TaskReminder[] = [
  { id: crypto.randomUUID(), tipo: 'notificacao', unidade: 'minutos', valor: 30, ativo: true },
  { id: crypto.randomUUID(), tipo: 'notificacao', unidade: 'dias', valor: 1, ativo: true },
  { id: crypto.randomUUID(), tipo: 'notificacao', unidade: 'semanas', valor: 1, ativo: true },
];

export const TaskRemindersPanel = ({
  reminders,
  onChange,
  maxReminders = 5,
  className,
}: TaskRemindersPanelProps) => {

  const updateReminder = (id: string, field: keyof TaskReminder, value: any) => {
    onChange(reminders.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeReminder = (id: string) => {
    onChange(reminders.filter(r => r.id !== id));
  };

  const addReminder = () => {
    if (reminders.length >= maxReminders) return;
    onChange([
      ...reminders,
      { id: crypto.randomUUID(), tipo: 'notificacao', unidade: 'minutos', valor: 15, ativo: true },
    ]);
  };

  const activeCount = reminders.filter(r => r.ativo).length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" /> Lembretes
        </h3>
        {reminders.length > 0 && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {activeCount} ativo{activeCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Reminders list */}
      {reminders.length === 0 ? (
        <div className="text-center py-4 bg-background rounded-xl border border-dashed">
          <Bell className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1.5" />
          <p className="text-xs text-muted-foreground">Nenhum lembrete configurado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200',
                reminder.ativo
                  ? 'bg-background border-border shadow-sm'
                  : 'bg-muted/30 border-transparent opacity-60'
              )}
            >
              {/* Toggle */}
              <Toggle
                size="small"
                checked={reminder.ativo}
                onChange={(e) => updateReminder(reminder.id, 'ativo', e.target.checked)}
                color="red"
              />

              {/* Tipo */}
              <Select
                value={reminder.tipo}
                onValueChange={(v) => updateReminder(reminder.id, 'tipo', v)}
              >
                <SelectTrigger className="h-8 w-[100px] text-xs border-border/50 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Valor numérico */}
              <Input
                type="number"
                min={1}
                max={999}
                value={reminder.valor}
                onChange={(e) => updateReminder(reminder.id, 'valor', Math.max(1, parseInt(e.target.value) || 1))}
                className="h-8 w-14 text-xs text-center border-border/50 bg-muted/50 focus-visible:ring-[#9C1E1E]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              {/* Unidade */}
              <Select
                value={reminder.unidade}
                onValueChange={(v) => updateReminder(reminder.id, 'unidade', v)}
              >
                <SelectTrigger className="h-8 w-[80px] text-xs border-border/50 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIDADE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Remover */}
              <button
                type="button"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto shrink-0"
                onClick={() => removeReminder(reminder.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {reminders.length < maxReminders && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs gap-1.5 border-dashed border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E]/50"
          onClick={addReminder}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar lembrete
        </Button>
      )}
    </div>
  );
};

export default TaskRemindersPanel;
