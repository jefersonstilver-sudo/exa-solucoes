/**
 * TaskEmptyState - Estado vazio para páginas de tarefas
 * CTA claro para criar primeira tarefa
 */

import React from 'react';
import { Plus, CheckCircle2, ListTodo, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type EmptyStateVariant = 'no-tasks' | 'all-done' | 'no-results';

interface TaskEmptyStateProps {
  variant: EmptyStateVariant;
  onCreateTask: () => void;
  filterActive?: boolean;
}

const variants: Record<EmptyStateVariant, {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  showCTA: boolean;
}> = {
  'no-tasks': {
    icon: <ListTodo className="h-8 w-8" />,
    title: 'Nenhuma tarefa ainda',
    description: 'Crie sua primeira tarefa para começar a organizar seu dia.',
    bgColor: 'from-blue-50 to-indigo-50 border-blue-200/50',
    iconColor: 'bg-blue-100 text-blue-600',
    showCTA: true
  },
  'all-done': {
    icon: <CheckCircle2 className="h-8 w-8" />,
    title: 'Parabéns! Tudo concluído.',
    description: 'Todas as tarefas foram finalizadas. Aproveite seu dia ou crie novas tarefas.',
    bgColor: 'from-emerald-50 to-teal-50 border-emerald-200/50',
    iconColor: 'bg-emerald-100 text-emerald-600',
    showCTA: true
  },
  'no-results': {
    icon: <AlertCircle className="h-8 w-8" />,
    title: 'Nenhuma tarefa encontrada',
    description: 'Tente ajustar os filtros ou crie uma nova tarefa.',
    bgColor: 'from-gray-50 to-slate-50 border-gray-200/50',
    iconColor: 'bg-gray-100 text-gray-600',
    showCTA: true
  }
};

export const TaskEmptyState: React.FC<TaskEmptyStateProps> = ({
  variant,
  onCreateTask,
  filterActive = false
}) => {
  const config = variants[variant];

  return (
    <Card className={cn("bg-gradient-to-br shadow-sm border", config.bgColor)}>
      <CardContent className="p-8 md:p-12 text-center">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
          config.iconColor
        )}>
          {config.icon}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {config.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
          {config.description}
        </p>
        
        {config.showCTA && (
          <Button
            onClick={onCreateTask}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            Criar Nova Tarefa
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskEmptyState;
