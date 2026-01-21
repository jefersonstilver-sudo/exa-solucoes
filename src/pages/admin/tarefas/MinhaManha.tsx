/**
 * Minha Manhã - Página de Tarefas do Dia (Migrada)
 * Fonte de dados: tabela `tasks` (canônica)
 * Inclui: CTA para criar tarefa, FAB mobile, filtros rápidos
 */

import React, { useState } from 'react';
import { 
  Sunrise, 
  Check, 
  Zap,
  Target,
  Coffee,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMinhaManha } from '@/hooks/tarefas/useMinhaManha';
import { useTaskDetail } from '@/hooks/tarefas/useTaskDetail';
import { TaskCard } from './components/TaskCard';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { TaskPageHeader, QuickFilter } from './components/TaskPageHeader';
import { TaskEmptyState } from './components/TaskEmptyState';
import { TaskFAB } from './components/TaskFAB';
import CreateTaskModal from '@/components/admin/agenda/CreateTaskModal';
import type { TaskWithDetails, TaskCategory, TaskStatusCanonical } from '@/types/tarefas';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Seção de tarefas
interface SecaoTarefasProps {
  titulo: string;
  icone: React.ReactNode;
  tarefas: TaskWithDetails[];
  tipo: TaskCategory;
  onConcluir: (id: string) => void;
  onClick: (task: TaskWithDetails) => void;
  isConcluindo: boolean;
  corHeader: string;
  maxItens?: number;
}

const SecaoTarefas = ({ 
  titulo, 
  icone, 
  tarefas, 
  tipo, 
  onConcluir,
  onClick,
  isConcluindo,
  corHeader,
  maxItens = 5
}: SecaoTarefasProps) => {
  const [expandido, setExpandido] = useState(false);
  const tarefasVisiveis = expandido ? tarefas : tarefas.slice(0, maxItens);
  const temMais = tarefas.length > maxItens;

  if (tarefas.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      <CardHeader className={cn("py-2.5 px-4", corHeader)}>
        <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
          <div className="flex items-center gap-2">
            {icone}
            {titulo}
          </div>
          <Badge variant="secondary" className="bg-background/90 text-foreground/70 text-[10px] font-medium">
            {tarefas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2.5 space-y-2 bg-card">
        {tarefasVisiveis.map(tarefa => (
          <TaskCard 
            key={tarefa.id}
            task={tarefa}
            tipo={tipo}
            onConcluir={onConcluir}
            onClick={onClick}
            isConcluindo={isConcluindo}
          />
        ))}
        {temMais && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? 'Ver menos' : `+${tarefas.length - maxItens} tarefas`}
            <ChevronRight className={cn(
              "h-3.5 w-3.5 ml-1 transition-transform",
              expandido && "rotate-90"
            )} />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Página principal
const MinhaManha = () => {
  const { 
    dados, 
    isLoading, 
    refetch,
    concluirTarefa, 
    isConcluindo,
  } = useMinhaManha();

  const isMobile = useIsMobile();

  // Estado do drawer e modal
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('hoje');

  // Hook para operações de detalhe
  const {
    task: taskDetail,
    updateStatus,
    isUpdatingStatus,
    updateChecklistItem,
    isUpdatingChecklist
  } = useTaskDetail({ 
    taskId: selectedTask?.id || null, 
    enabled: drawerOpen 
  });

  const { estatisticas } = dados;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatusCanonical, motivo?: string) => {
    await updateStatus({ status: newStatus, motivo });
  };

  const handleChecklistToggle = async (itemId: string, concluido: boolean) => {
    await updateChecklistItem({ itemId, concluido });
  };

  const handleCreateTask = () => {
    setCreateModalOpen(true);
  };

  // Determinar estado vazio
  const isEmpty = estatisticas.total === 0;
  const emptyVariant = isEmpty ? 'all-done' : 'no-tasks';

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen pb-24 md:pb-6">
      {/* Header com CTA e ícone de calendário */}
      <TaskPageHeader
        titulo="Minha Manhã"
        icone={<Sunrise className="h-6 w-6 text-primary-foreground" />}
        onNovaTarefa={handleCreateTask}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        quickFilter={quickFilter}
        onQuickFilterChange={setQuickFilter}
        atrasadasCount={0} // TODO: calcular atrasadas
        showCreateButtonDesktop={true}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-destructive/10 border-destructive/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <Zap className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {estatisticas.urgentes}
                </div>
                <div className="text-xs text-destructive/80">Urgentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/10 border-amber-500/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700">
                  {estatisticas.importantes}
                </div>
                <div className="text-xs text-amber-600">Importantes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Coffee className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">
                  {estatisticas.rotina}
                </div>
                <div className="text-xs text-emerald-600">Rotina</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.total}
                </div>
                <div className="text-xs text-primary/80">Total Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        /* Estado vazio com CTA */
        <TaskEmptyState 
          variant={emptyVariant} 
          onCreateTask={handleCreateTask} 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Urgentes */}
          <SecaoTarefas
            titulo="🔴 URGENTE"
            icone={<Zap className="h-4 w-4 text-destructive" />}
            tarefas={dados.urgentes}
            tipo="urgente"
            onConcluir={concluirTarefa}
            onClick={handleTaskClick}
            isConcluindo={isConcluindo}
            corHeader="bg-destructive/10 text-destructive"
          />

          {/* Importantes */}
          <SecaoTarefas
            titulo="🟡 IMPORTANTE"
            icone={<Target className="h-4 w-4 text-amber-600" />}
            tarefas={dados.importantes}
            tipo="importante"
            onConcluir={concluirTarefa}
            onClick={handleTaskClick}
            isConcluindo={isConcluindo}
            corHeader="bg-amber-500/10 text-amber-900"
          />

          {/* Rotina */}
          <SecaoTarefas
            titulo="🟢 ROTINA"
            icone={<Coffee className="h-4 w-4 text-emerald-600" />}
            tarefas={dados.rotina}
            tipo="rotina"
            onConcluir={concluirTarefa}
            onClick={handleTaskClick}
            isConcluindo={isConcluindo}
            corHeader="bg-emerald-500/10 text-emerald-900"
          />
        </div>
      )}

      {/* FAB para mobile */}
      {isMobile && (
        <TaskFAB onClick={handleCreateTask} />
      )}

      {/* Modal de criação */}
      <CreateTaskModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={taskDetail || selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onChecklistItemToggle={handleChecklistToggle}
        isUpdating={isUpdatingStatus || isUpdatingChecklist}
      />
    </div>
  );
};

export default MinhaManha;
