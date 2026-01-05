import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageCircle, Phone, Calendar, MoreHorizontal, Pin, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Contact } from '@/types/contatos';

interface KanbanCardProps {
  contact: Contact;
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

const getTemperaturaColor = (temp?: string) => {
  switch (temp) {
    case 'quente': return 'border-l-red-500';
    case 'morno': return 'border-l-orange-400';
    case 'frio': return 'border-l-blue-400';
    default: return 'border-l-gray-300';
  }
};

const getTemperaturaBadge = (temp?: string) => {
  switch (temp) {
    case 'quente': return { label: '🔥', className: 'bg-red-100 text-red-700' };
    case 'morno': return { label: '🌡️', className: 'bg-orange-100 text-orange-700' };
    case 'frio': return { label: '❄️', className: 'bg-blue-100 text-blue-700' };
    default: return null;
  }
};

export const KanbanCard = memo(({ 
  contact, 
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

  const lastInteraction = contact.last_interaction_at 
    ? formatDistanceToNow(new Date(contact.last_interaction_at), { 
        addSuffix: true, 
        locale: ptBR 
      })
    : null;

  const daysSinceContact = contact.last_interaction_at 
    ? Math.floor((Date.now() - new Date(contact.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysSinceContact !== null && daysSinceContact > 7;
  const tempBadge = getTemperaturaBadge(contact.temperatura);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group bg-white/90 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm",
        "hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-grab active:cursor-grabbing",
        "border-l-4",
        getTemperaturaColor(contact.temperatura),
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg scale-105 rotate-2",
        isUrgent && "ring-2 ring-amber-300 ring-offset-1"
      )}
    >
      <div className="p-3 space-y-2">
        {/* Header: Avatar + Nome + Temperatura */}
        <div className="flex items-start gap-2">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-xs font-medium">
              {getInitials(contact.nome || 'NC')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="font-medium text-sm text-foreground truncate">
                {contact.nome || 'Sem nome'}
              </h4>
              {tempBadge && (
                <span className={cn("text-xs px-1 rounded", tempBadge.className)}>
                  {tempBadge.label}
                </span>
              )}
            </div>
            {contact.empresa && (
              <p className="text-xs text-muted-foreground truncate">
                {contact.empresa}
              </p>
            )}
          </div>

          {/* Pin / Horário */}
          <div className="flex items-center gap-1 shrink-0">
            {isUrgent && (
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sem contato há {daysSinceContact} dias</p>
                </TooltipContent>
              </Tooltip>
            )}
            {lastInteraction && (
              <span className="text-[10px] text-muted-foreground">
                {lastInteraction}
              </span>
            )}
          </div>
        </div>

        {/* Preview da última mensagem (simulado) */}
        {contact.observacoes_estrategicas && (
          <p className="text-xs text-muted-foreground line-clamp-1 italic">
            "{contact.observacoes_estrategicas.slice(0, 50)}..."
          </p>
        )}

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {contact.tags.slice(0, 2).map(tag => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {tag}
              </Badge>
            ))}
            {contact.tags.length > 2 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                +{contact.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Quick Actions - aparecem no hover */}
        <div className="flex items-center justify-between pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChat?.(contact);
                  }}
                >
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>WhatsApp</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contact.telefone) {
                      window.open(`tel:${contact.telefone}`, '_blank');
                    }
                  }}
                >
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ligar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSchedule?.(contact);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agendar</TooltipContent>
            </Tooltip>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile?.(contact);
            }}
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
});

KanbanCard.displayName = 'KanbanCard';
