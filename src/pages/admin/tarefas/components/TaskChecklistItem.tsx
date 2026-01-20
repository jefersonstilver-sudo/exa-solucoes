/**
 * TaskChecklistItem - Item individual do checklist
 * Checkbox sutil, strikethrough quando concluído
 */

import React, { useState } from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TaskChecklistItem as TaskChecklistItemType } from '@/types/tarefas';

interface TaskChecklistItemProps {
  item: TaskChecklistItemType;
  onToggle: (itemId: string, concluido: boolean) => Promise<void>;
  isUpdating: boolean;
}

export const TaskChecklistItem: React.FC<TaskChecklistItemProps> = ({
  item,
  onToggle,
  isUpdating
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isUpdating || isToggling) return;
    
    setIsToggling(true);
    try {
      await onToggle(item.id, !item.concluido);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group",
        "hover:bg-gray-50/80",
        item.concluido && "bg-gray-50/50"
      )}
      onClick={handleToggle}
    >
      {/* Checkbox */}
      <div 
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
          item.concluido 
            ? "bg-emerald-500 border-emerald-500" 
            : "border-gray-300 group-hover:border-gray-400",
          isToggling && "opacity-50"
        )}
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 text-white animate-spin" />
        ) : item.concluido ? (
          <Check className="h-3 w-3 text-white" />
        ) : null}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span 
            className={cn(
              "text-sm leading-snug",
              item.concluido 
                ? "text-gray-400 line-through" 
                : "text-gray-700"
            )}
          >
            {item.descricao}
          </span>
          
          {/* Badge obrigatório */}
          {item.obrigatorio && !item.concluido && (
            <Star className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Info de conclusão */}
        {item.concluido && item.concluido_em && (
          <p className="text-[11px] text-gray-400 mt-1">
            Concluído {formatDistanceToNow(parseISO(item.concluido_em), { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskChecklistItem;
