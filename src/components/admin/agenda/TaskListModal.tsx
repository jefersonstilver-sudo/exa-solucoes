import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Clock, 
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import TaskCard, { type AgendaTask } from './TaskCard';

type FilterType = 'pending' | 'overdue' | 'completed' | 'today';

interface TaskListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: FilterType;
  tasks: AgendaTask[];
  onTaskComplete?: (taskId: string) => void;
}

const FILTER_CONFIG: Record<FilterType, { title: string; icon: React.ReactNode; bgColor: string; textColor: string }> = {
  pending: {
    title: 'Tarefas Pendentes',
    icon: <Clock className="h-5 w-5 text-amber-600" />,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700'
  },
  overdue: {
    title: 'Tarefas Atrasadas',
    icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700'
  },
  completed: {
    title: 'Tarefas Concluídas',
    icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700'
  },
  today: {
    title: 'Tarefas de Hoje',
    icon: <Calendar className="h-5 w-5 text-blue-600" />,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  }
};

const TaskListModal = ({ open, onOpenChange, filterType, tasks, onTaskComplete }: TaskListModalProps) => {
  const config = FILTER_CONFIG[filterType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${config.bgColor}`}>
              {config.icon}
            </div>
            <span>{config.title}</span>
            <Badge className={`${config.bgColor} ${config.textColor} border-none`}>
              {tasks.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckCircle className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {tasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  showCompleteButton={filterType !== 'completed'}
                  onComplete={onTaskComplete}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskListModal;