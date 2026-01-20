/**
 * TaskStatusActions - Botões de ação de status
 * Exibe apenas transições válidas conforme governança
 */

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Check, 
  X, 
  Package, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getTaskStatusConfig, isTaskStatusFinal } from '@/constants/taskStatus';
import type { TaskWithDetails, TaskStatusCanonical } from '@/types/tarefas';

interface TaskStatusActionsProps {
  task: TaskWithDetails;
  onStatusChange: (taskId: string, newStatus: TaskStatusCanonical, motivo?: string) => Promise<void>;
  isUpdating: boolean;
  onClose: () => void;
}

// Tabela de transições válidas
const VALID_TRANSITIONS: Record<TaskStatusCanonical, TaskStatusCanonical[]> = {
  pendente: ['em_andamento', 'aguardando_insumo', 'cancelada'],
  em_andamento: ['aguardando_aprovacao', 'aguardando_insumo', 'concluida', 'nao_realizada', 'cancelada'],
  aguardando_aprovacao: ['em_andamento', 'concluida', 'nao_realizada'],
  aguardando_insumo: ['em_andamento', 'pendente', 'nao_realizada', 'cancelada'],
  concluida: [],
  nao_realizada: [],
  cancelada: []
};

// Configuração visual dos botões de ação
const ACTION_CONFIG: Record<TaskStatusCanonical, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  pendente: {
    label: 'Retornar a Pendente',
    icon: Pause,
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
  },
  em_andamento: {
    label: 'Iniciar',
    icon: Play,
    className: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
  },
  aguardando_aprovacao: {
    label: 'Aguardar Aprovação',
    icon: Pause,
    className: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
  },
  aguardando_insumo: {
    label: 'Aguardar Insumo',
    icon: Package,
    className: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
  },
  concluida: {
    label: 'Concluir',
    icon: Check,
    className: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
  },
  nao_realizada: {
    label: 'Não Realizada',
    icon: X,
    className: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
  },
  cancelada: {
    label: 'Cancelar',
    icon: AlertCircle,
    className: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
  }
};

export const TaskStatusActions: React.FC<TaskStatusActionsProps> = ({
  task,
  onStatusChange,
  isUpdating,
  onClose
}) => {
  const [selectedAction, setSelectedAction] = useState<TaskStatusCanonical | null>(null);
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se status final, não há ações
  if (isTaskStatusFinal(task.status)) {
    return (
      <div className="text-center py-4 text-sm text-gray-400">
        Tarefa finalizada - sem ações disponíveis
      </div>
    );
  }

  const currentStatus = task.status as TaskStatusCanonical;
  const validTransitions = VALID_TRANSITIONS[currentStatus] || [];

  // Verificar se checklist obrigatório está completo (para concluir)
  const checklistObrigatoriosPendentes = (task.checklist || []).filter(
    item => item.obrigatorio && !item.concluido
  ).length;

  const canConcluir = checklistObrigatoriosPendentes === 0;

  const handleActionClick = (newStatus: TaskStatusCanonical) => {
    // Se for "não realizada", precisa de motivo
    if (newStatus === 'nao_realizada') {
      setSelectedAction(newStatus);
      return;
    }

    // Verificar se pode concluir
    if (newStatus === 'concluida' && !canConcluir) {
      return; // Bloqueado
    }

    // Executar ação diretamente
    executeAction(newStatus);
  };

  const executeAction = async (newStatus: TaskStatusCanonical, motivoText?: string) => {
    setIsSubmitting(true);
    try {
      await onStatusChange(task.id, newStatus, motivoText);
      onClose();
    } finally {
      setIsSubmitting(false);
      setSelectedAction(null);
      setMotivo('');
    }
  };

  const handleSubmitWithMotivo = () => {
    if (!motivo.trim() || !selectedAction) return;
    executeAction(selectedAction, motivo.trim());
  };

  // Tela de input do motivo
  if (selectedAction === 'nao_realizada') {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">
          Motivo da não realização
        </h3>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Descreva o motivo pelo qual a tarefa não foi realizada..."
          className="min-h-[80px] text-sm resize-none"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedAction(null);
              setMotivo('');
            }}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitWithMotivo}
            disabled={!motivo.trim() || isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Confirmar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Ações</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {validTransitions.map((targetStatus) => {
          const config = ACTION_CONFIG[targetStatus];
          const Icon = config.icon;
          
          // Bloquear conclusão se checklist obrigatório pendente
          const isBlocked = targetStatus === 'concluida' && !canConcluir;
          
          return (
            <Button
              key={targetStatus}
              variant="outline"
              size="sm"
              onClick={() => handleActionClick(targetStatus)}
              disabled={isUpdating || isSubmitting || isBlocked}
              className={cn(
                "h-auto py-2.5 px-3 flex items-center gap-2 justify-start text-left border",
                config.className,
                isBlocked && "opacity-50 cursor-not-allowed"
              )}
              title={isBlocked ? `${checklistObrigatoriosPendentes} item(ns) obrigatório(s) pendente(s)` : undefined}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="text-xs font-medium">{config.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Aviso de bloqueio */}
      {!canConcluir && validTransitions.includes('concluida') && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
          Complete {checklistObrigatoriosPendentes} item(ns) obrigatório(s) para poder concluir
        </div>
      )}
    </div>
  );
};

export default TaskStatusActions;
