/**
 * TaskChecklist - Lista de checklist editável
 * Exibe itens obrigatórios e opcionais, com status de conclusão
 */

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskChecklistItem } from './TaskChecklistItem';
import type { TaskChecklistItem as TaskChecklistItemType } from '@/types/tarefas';

interface TaskChecklistProps {
  items: TaskChecklistItemType[];
  onToggle: (itemId: string, concluido: boolean) => Promise<void>;
  isUpdating: boolean;
}

export const TaskChecklist: React.FC<TaskChecklistProps> = ({
  items,
  onToggle,
  isUpdating
}) => {
  // Ordenar itens: obrigatórios primeiro, depois por ordem
  const sortedItems = [...items].sort((a, b) => {
    if (a.obrigatorio && !b.obrigatorio) return -1;
    if (!a.obrigatorio && b.obrigatorio) return 1;
    return a.ordem - b.ordem;
  });

  const totalConcluidos = items.filter(i => i.concluido).length;
  const totalObrigatorios = items.filter(i => i.obrigatorio).length;
  const obrigatoriosConcluidos = items.filter(i => i.obrigatorio && i.concluido).length;
  const progressoPct = items.length > 0 ? Math.round((totalConcluidos / items.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Header do checklist */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Check className="h-4 w-4 text-gray-400" />
          Checklist
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {totalConcluidos}/{items.length}
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progressoPct === 100 ? "bg-emerald-500" : "bg-blue-500"
              )}
              style={{ width: `${progressoPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Aviso de obrigatórios */}
      {totalObrigatorios > 0 && obrigatoriosConcluidos < totalObrigatorios && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
          {totalObrigatorios - obrigatoriosConcluidos} item(ns) obrigatório(s) pendente(s)
        </div>
      )}

      {/* Lista de itens */}
      <div className="space-y-1">
        {sortedItems.map((item) => (
          <TaskChecklistItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskChecklist;
