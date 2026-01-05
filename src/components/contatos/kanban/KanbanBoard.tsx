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
import { Plus } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { KanbanChatPanel } from './KanbanChatPanel';
import { KanbanSchedulePopover } from './KanbanSchedulePopover';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
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

    const sourceColumn = findColumnByContactId(activeId);
    
    let targetColumn = overId;
    
    const overContact = findContact(overId);
    if (overContact) {
      targetColumn = findColumnByContactId(overId) || overId;
    }

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

  const handleAddContact = () => {
    navigate(buildPath('contatos/novo'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
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
        <div className="flex gap-3 p-4 overflow-x-auto h-full">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              contacts={column.contacts}
              count={column.count}
              onOpenChat={handleOpenChat}
              onOpenSchedule={handleOpenSchedule}
              onOpenProfile={handleOpenProfile}
            />
          ))}
        </div>

        <DragOverlay>
          {activeContact && (
            <div className="rotate-3 opacity-90">
              <KanbanCard contact={activeContact} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* FAB - Botão Flutuante */}
      <div className="absolute bottom-6 right-6 z-30">
        <button 
          onClick={handleAddContact}
          className="w-14 h-14 bg-gradient-to-tr from-purple-700 to-purple-500 text-white rounded-full shadow-[0_8px_30px_rgba(147,51,234,0.4)] hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center border-2 border-white/20"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

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
