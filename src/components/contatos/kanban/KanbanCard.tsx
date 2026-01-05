import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MessageCircle, 
  FileText, 
  Calendar, 
  Folder,
  Building2,
  Mic,
  DollarSign,
  Link,
  Megaphone,
  BadgeCheck,
  Lock,
  Pencil,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/contatos';

interface KanbanCardProps {
  contact: Contact;
  categoryColor?: string;
  onOpenChat?: (contact: Contact) => void;
  onOpenSchedule?: (contact: Contact) => void;
  onOpenProfile?: (contact: Contact) => void;
  isDragging?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Determina ícone contextual baseado no conteúdo
const getContextualIcon = (contact: Contact) => {
  if (contact.empresa) return Building2;
  if (contact.email) return MessageCircle;
  if (contact.observacoes_estrategicas?.toLowerCase().includes('audio')) return Mic;
  if (contact.ticket_estimado && contact.ticket_estimado > 0) return DollarSign;
  if (contact.observacoes_estrategicas?.toLowerCase().includes('link')) return Link;
  if (contact.observacoes_estrategicas?.toLowerCase().includes('marketing')) return Megaphone;
  if (contact.status === 'ativo') return BadgeCheck;
  if (contact.categoria === 'equipe_exa') return Lock;
  return Pencil;
};

// Determina texto do subtítulo
const getSubtitle = (contact: Contact) => {
  if (contact.empresa) return contact.empresa;
  if (contact.email) return contact.email;
  if (contact.observacoes_estrategicas) return contact.observacoes_estrategicas.slice(0, 30) + '...';
  if (contact.telefone) return contact.telefone;
  return 'Sem observação';
};

export const KanbanCard = memo(({ 
  contact, 
  categoryColor = '#facc15',
  onOpenChat, 
  onOpenSchedule,
  onOpenProfile,
  isDragging 
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ContextIcon = getContextualIcon(contact);
  const subtitle = getSubtitle(contact);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-white p-2.5 rounded-lg border border-gray-100 cursor-grab active:cursor-grabbing relative",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        "transition-shadow duration-200",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg scale-105 rotate-2"
      )}
      onClick={() => onOpenProfile?.(contact)}
    >
      {/* Barra vertical colorida - LADO DIREITO */}
      <div 
        className="absolute right-0 top-3 h-5 w-1 rounded-l-md"
        style={{ backgroundColor: categoryColor }}
      />
      
      {/* Avatar + Info */}
      <div className="flex items-start gap-2.5 mb-1.5">
        {/* Avatar com grayscale */}
        <div 
          className="w-8 h-8 rounded-full bg-gray-200 border border-gray-100 shadow-sm shrink-0 grayscale group-hover:grayscale-0 transition-all duration-300 flex items-center justify-center text-xs font-bold text-gray-600"
        >
          {getInitials(contact.nome || 'NC')}
        </div>
        
        <div className="flex flex-col overflow-hidden w-full">
          <h4 className="font-bold text-gray-800 text-xs truncate leading-tight">
            {contact.nome || 'Sem nome'}
          </h4>
          <p className="text-[10px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
            <ContextIcon className="h-2.5 w-2.5 text-gray-400 shrink-0" />
            <span className="truncate">{subtitle}</span>
          </p>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-0.5 pl-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <MessageCircle 
          className="h-3.5 w-3.5 text-gray-400 hover:text-green-600 cursor-pointer transition-colors" 
          onClick={(e) => {
            e.stopPropagation();
            onOpenChat?.(contact);
          }}
        />
        <FileText 
          className="h-3.5 w-3.5 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile?.(contact);
          }}
        />
        <Calendar 
          className="h-3.5 w-3.5 text-gray-400 hover:text-purple-600 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSchedule?.(contact);
          }}
        />
        <Folder 
          className="h-3.5 w-3.5 text-gray-400 hover:text-orange-600 cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile?.(contact);
          }}
        />
      </div>
    </div>
  );
});

KanbanCard.displayName = 'KanbanCard';
