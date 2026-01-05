import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import type { Contact } from '@/types/contatos';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  contacts: Contact[];
  count: number;
  totalValue: number;
  urgentCount?: number;
  onOpenChat?: (contact: Contact) => void;
  onOpenSchedule?: (contact: Contact) => void;
  onOpenProfile?: (contact: Contact) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  color,
  bgColor,
  contacts,
  count,
  totalValue,
  urgentCount = 0,
  onOpenChat,
  onOpenSchedule,
  onOpenProfile,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  const formatValue = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value}`;
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-w-[280px] max-w-[320px] rounded-2xl",
        "bg-white/40 backdrop-blur-sm border border-border/30",
        "transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5 scale-[1.02]"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", bgColor)} />
            <h3 className={cn("font-semibold text-sm", color)}>
              {title}
            </h3>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {count}
            </Badge>
          </div>
          
          {urgentCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              {urgentCount}
            </Badge>
          )}
        </div>

        {/* Metrics */}
        {totalValue > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="font-medium text-green-700">{formatValue(totalValue)}</span>
            <span>potencial</span>
          </div>
        )}
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext 
          items={contacts.map(c => c.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {contacts.map(contact => (
              <KanbanCard
                key={contact.id}
                contact={contact}
                onOpenChat={onOpenChat}
                onOpenSchedule={onOpenSchedule}
                onOpenProfile={onOpenProfile}
              />
            ))}
            
            {contacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>Nenhum contato</p>
                <p className="text-xs mt-1">Arraste cards para cá</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>

      {/* Column Footer - contador */}
      {contacts.length > 5 && (
        <div className="p-2 border-t border-border/30 text-center">
          <span className="text-xs text-muted-foreground">
            Mostrando {Math.min(contacts.length, 20)} de {count}
          </span>
        </div>
      )}
    </div>
  );
};
