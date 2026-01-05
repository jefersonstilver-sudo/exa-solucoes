import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanChatPanel } from './KanbanChatPanel';
import { KanbanSchedulePopover } from './KanbanSchedulePopover';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Contact } from '@/types/contatos';
import type { KanbanColumn as KanbanColumnType } from '@/hooks/contatos/useKanbanContatos';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  onMoveContact: (contactId: string, targetColumnId: string) => Promise<void>;
  loading?: boolean;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onMoveContact,
  loading,
}) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [chatContact, setChatContact] = useState<Contact | null>(null);
  const [scheduleContact, setScheduleContact] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContact = (id: string): Contact | undefined => {
    for (const column of columns) {
      const contact = column.contacts.find(c => c.id === id);
      if (contact) return contact;
    }
    return undefined;
  };

  const findColumnByContactId = (contactId: string): string | undefined => {
    for (const column of columns) {
      if (column.contacts.some(c => c.id === contactId)) {
        return column.id;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const contact = findContact(active.id as string);
    setActiveContact(contact || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveContact(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Encontrar coluna de origem
    const sourceColumn = findColumnByContactId(activeId);
    
    // Determinar coluna de destino
    let targetColumn = overId;
    
    // Se over é um contato, encontrar sua coluna
    const overContact = findContact(overId);
    if (overContact) {
      targetColumn = findColumnByContactId(overId) || overId;
    }

    // Se a coluna mudou, mover o contato
    if (sourceColumn && targetColumn && sourceColumn !== targetColumn) {
      await onMoveContact(activeId, targetColumn);
    }
  };

  const handleOpenChat = (contact: Contact) => {
    setChatContact(contact);
  };

  const handleOpenSchedule = (contact: Contact) => {
    setScheduleContact(contact);
  };

  const handleOpenProfile = (contact: Contact) => {
    navigate(buildPath(`contatos/${contact.id}`));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 p-4 min-h-[calc(100vh-280px)]">
            {columns.map(column => {
              const urgentCount = column.contacts.filter(c => {
                const lastInteraction = c.last_interaction_at ? new Date(c.last_interaction_at) : null;
                if (!lastInteraction) return false;
                const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
                return daysSince > 7;
              }).length;

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  bgColor={column.bgColor}
                  contacts={column.contacts}
                  count={column.count}
                  totalValue={column.totalValue}
                  urgentCount={urgentCount}
                  onOpenChat={handleOpenChat}
                  onOpenSchedule={handleOpenSchedule}
                  onOpenProfile={handleOpenProfile}
                />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeContact && (
            <div className="rotate-3 opacity-90">
              <KanbanCard contact={activeContact} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Chat Panel */}
      <KanbanChatPanel 
        contact={chatContact} 
        onClose={() => setChatContact(null)} 
      />

      {/* Schedule Popover */}
      <KanbanSchedulePopover
        contact={scheduleContact}
        onClose={() => setScheduleContact(null)}
      />
    </>
  );
};
