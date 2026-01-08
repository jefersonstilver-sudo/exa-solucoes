import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Building2, GripVertical } from 'lucide-react';
import { ClientCRM, FunilColumn, FunilStatus } from '@/types/crm';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanTabProps {
  clients: ClientCRM[];
  funilColumns: FunilColumn[];
  loading: boolean;
  onUpdateStatus: (clientId: string, newStatus: FunilStatus) => void;
}

const KanbanTab: React.FC<KanbanTabProps> = ({
  clients,
  funilColumns,
  loading,
  onUpdateStatus
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const clientId = active.id as string;
    const newStatus = over.id as FunilStatus;

    const client = clients.find(c => c.id === clientId);
    if (client && client.funil_status !== newStatus) {
      onUpdateStatus(clientId, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1">
            <Skeleton className="h-8 w-full mb-3 rounded-lg" />
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {funilColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            clients={clients.filter(c => c.funil_status === column.id)}
          />
        ))}
      </div>
    </DndContext>
  );
};

// Coluna do Kanban
interface KanbanColumnProps {
  column: FunilColumn;
  clients: ClientCRM[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, clients }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-w-[280px] md:min-w-[300px] flex-1 
        rounded-xl border-2 border-dashed transition-all
        ${isOver ? 'border-gray-400 bg-gray-50' : 'border-transparent'}
      `}
    >
      {/* Header da coluna */}
      <div 
        className="flex items-center justify-between p-3 rounded-t-xl"
        style={{ backgroundColor: `${column.color}15` }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color }}
          />
          <span className="font-semibold text-gray-800">{column.title}</span>
        </div>
        <span 
          className="text-sm font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${column.color}20`, color: column.color }}
        >
          {clients.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px]">
        <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2">
            {clients.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Solte aqui
              </div>
            ) : (
              clients.map((client) => (
                <KanbanCard key={client.id} client={client} />
              ))
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
};

// Card draggable
interface KanbanCardProps {
  client: ClientCRM;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ client }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = () => {
    navigate(buildPath(`contatos/${client.id}`));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg border border-gray-100 p-3 
        hover:shadow-md hover:border-gray-200 transition-all
        cursor-pointer group
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={handleClick}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center text-white text-sm font-medium shrink-0">
              {client.nome?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm">
                {client.nome} {client.sobrenome}
              </p>
              {client.empresa && (
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {client.empresa}
                </p>
              )}
            </div>
          </div>

          {client.telefone && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Phone className="w-3 h-3" />
              {client.telefone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanTab;
