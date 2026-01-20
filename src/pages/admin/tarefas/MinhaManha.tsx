/**
 * Minha Manhã - Página de Tarefas do Dia (Migrada)
 * Fonte de dados: tabela `tasks` (canônica)
 * Sem dependência do Notion
 */

import React, { useState } from 'react';
import { 
  Sunrise, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Loader2,
  ChevronRight,
  Zap,
  Target,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMinhaManha } from '@/hooks/tarefas/useMinhaManha';
import { TaskCard } from './components/TaskCard';
import type { TaskWithDetails, TaskCategory } from '@/types/tarefas';
import { cn } from '@/lib/utils';

// Seção de tarefas
interface SecaoTarefasProps {
  titulo: string;
  icone: React.ReactNode;
  tarefas: TaskWithDetails[];
  tipo: TaskCategory;
  onConcluir: (id: string) => void;
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
  isConcluindo,
  corHeader,
  maxItens = 5
}: SecaoTarefasProps) => {
  const [expandido, setExpandido] = useState(false);
  const tarefasVisiveis = expandido ? tarefas : tarefas.slice(0, maxItens);
  const temMais = tarefas.length > maxItens;

  if (tarefas.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white">
      <CardHeader className={cn("py-2.5 px-4", corHeader)}>
        <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
          <div className="flex items-center gap-2">
            {icone}
            {titulo}
          </div>
          <Badge variant="secondary" className="bg-white/90 text-gray-600 text-[10px] font-medium">
            {tarefas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2.5 space-y-2 bg-white">
        {tarefasVisiveis.map(tarefa => (
          <TaskCard 
            key={tarefa.id}
            task={tarefa}
            tipo={tipo}
            onConcluir={onConcluir}
            isConcluindo={isConcluindo}
          />
        ))}
        {temMais && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
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

  const { estatisticas } = dados;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Sunrise className="h-6 w-6 text-white" />
            </div>
            Minha Manhã
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-14">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-red-50 border-red-200/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700">
                  {estatisticas.urgentes}
                </div>
                <div className="text-xs text-red-600">Urgentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
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

        <Card className="bg-emerald-50 border-emerald-200/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
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

        <Card className="bg-blue-50 border-blue-200/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {estatisticas.total}
                </div>
                <div className="text-xs text-blue-600">Total Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Urgentes */}
          <SecaoTarefas
            titulo="🔴 URGENTE"
            icone={<Zap className="h-4 w-4 text-red-600" />}
            tarefas={dados.urgentes}
            tipo="urgente"
            onConcluir={concluirTarefa}
            isConcluindo={isConcluindo}
            corHeader="bg-red-50 text-red-900"
          />

          {/* Importantes */}
          <SecaoTarefas
            titulo="🟡 IMPORTANTE"
            icone={<Target className="h-4 w-4 text-amber-600" />}
            tarefas={dados.importantes}
            tipo="importante"
            onConcluir={concluirTarefa}
            isConcluindo={isConcluindo}
            corHeader="bg-amber-50 text-amber-900"
          />

          {/* Rotina */}
          <SecaoTarefas
            titulo="🟢 ROTINA"
            icone={<Coffee className="h-4 w-4 text-emerald-600" />}
            tarefas={dados.rotina}
            tipo="rotina"
            onConcluir={concluirTarefa}
            isConcluindo={isConcluindo}
            corHeader="bg-emerald-50 text-emerald-900"
          />
        </div>
      )}

      {/* Mensagem quando não há tarefas */}
      {!isLoading && estatisticas.total === 0 && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">
              Parabéns! Nenhuma tarefa pendente.
            </h3>
            <p className="text-sm text-emerald-600">
              Todas as tarefas foram concluídas. Aproveite seu dia!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinhaManha;
