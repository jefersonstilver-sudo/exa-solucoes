import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import type { Contact } from '@/types/contatos';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  contacts: Contact[];
  count: number;
  onOpenChat?: (contact: Contact) => void;
  onOpenSchedule?: (contact: Contact) => void;
  onOpenProfile?: (contact: Contact) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color,
  contacts,
  count,
  onOpenChat,
  onOpenSchedule,
  onOpenProfile,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[240px] h-full rounded-xl bg-[#f5f5f5] shrink-0 border border-gray-100/50 shadow-inner",
        "transition-all duration-300 ease-out",
        isOver && "ring-2 ring-purple-400/60 bg-purple-50/40 scale-[1.01] shadow-lg"
      )}
    >
      {/* Header com borda colorida no topo */}
      <div 
        className="px-3 py-2 rounded-t-xl bg-gradient-to-b from-white to-[#f5f5f5] shadow-sm flex items-center justify-between shrink-0"
        style={{ borderTop: `4px solid ${color}` }}
      >
        <h3 className="font-bold text-gray-600 text-xs uppercase tracking-wide truncate">
          {title}
        </h3>
        <span className="bg-gray-200/50 text-gray-500 text-[10px] px-1.5 py-0.5 rounded font-bold">
          {count}
        </span>
      </div>

      {/* Cards Container - área de drop deve cobrir todo o espaço */}
      <div className="flex-1 overflow-y-auto p-1.5 min-h-[200px]">
        <SortableContext 
          items={contacts.map(c => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 min-h-full">
            {contacts.map(contact => (
              <KanbanCard
                key={contact.id}
                contact={contact}
                categoryColor={color}
                onOpenChat={onOpenChat}
                onOpenSchedule={onOpenSchedule}
                onOpenProfile={onOpenProfile}
              />
            ))}
            
            {contacts.length === 0 && (
              <div className={cn(
                "flex-1 min-h-[150px] flex items-center justify-center text-gray-400 text-xs rounded-lg border-2 border-dashed border-transparent",
                "transition-all duration-200",
                isOver && "border-purple-300 bg-purple-50/50"
              )}>
                <p>Solte aqui</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
