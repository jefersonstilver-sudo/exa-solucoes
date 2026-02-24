import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, Clock, Send, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ReadReceipt {
  id: string;
  task_id: string;
  contact_phone: string;
  contact_name: string | null;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  status: string;
}

interface TaskNotificationStatusProps {
  taskId: string;
}

export const TaskNotificationStatus: React.FC<TaskNotificationStatusProps> = ({ taskId }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['task-read-receipts', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_read_receipts')
        .select('*')
        .eq('task_id', taskId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReadReceipt[];
    },
    enabled: !!taskId,
  });

  if (isLoading || receipts.length === 0) return null;

  const confirmed = receipts.filter(r => r.status === 'read').length;
  const total = receipts.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <Check className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (receipt: ReadReceipt) => {
    if (receipt.status === 'read' && receipt.read_at) {
      return `Confirmou às ${format(new Date(receipt.read_at), "HH:mm 'de' dd/MM", { locale: ptBR })}`;
    }
    if (receipt.status === 'delivered') {
      return 'Entregue';
    }
    return 'Enviado';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Notificações</span>
          <span className="text-xs text-muted-foreground">
            {confirmed} de {total} confirmaram
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-1">
        {receipts.map((receipt) => (
          <div
            key={receipt.id}
            className="flex items-center justify-between px-3 py-2 rounded-md bg-background border"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(receipt.status)}
              <span className="text-sm">{receipt.contact_name || receipt.contact_phone}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {getStatusLabel(receipt)}
            </span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TaskNotificationStatus;
