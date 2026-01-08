import React, { useState } from 'react';
import { 
  Sunrise, 
  RefreshCw, 
  Check, 
  ExternalLink, 
  AlertTriangle,
  Clock,
  CalendarDays,
  Loader2,
  ChevronRight,
  Zap,
  Target,
  Coffee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMinhaManha } from '@/hooks/tarefas/useMinhaManha';
import type { TarefaNotionExistente } from '@/types/tarefas';
import { PRIORIDADE_CONFIG } from '@/types/tarefas';
import { cn } from '@/lib/utils';

// Card de tarefa individual
interface TarefaCardProps {
  tarefa: TarefaNotionExistente;
  tipo: 'urgente' | 'importante' | 'rotina';
  onConcluir: (id: string) => void;
  isConcluindo: boolean;
}

const TarefaCard = ({ tarefa, tipo, onConcluir, isConcluindo }: TarefaCardProps) => {
  const hoje = startOfDay(new Date());
  const isAtrasada = tarefa.data && isBefore(parseISO(tarefa.data.split('T')[0]), hoje);
  
  const tipoConfig = {
    urgente: {
      border: 'border-l-red-500',
      bg: 'bg-red-50/50 hover:bg-red-50',
      badge: 'bg-red-100 text-red-700 border-red-200',
    },
    importante: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50/50 hover:bg-amber-50',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    rotina: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50/50 hover:bg-emerald-50',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
  };

  const config = tipoConfig[tipo];

  return (
    <div 
      className={cn(
        "p-4 rounded-xl border-l-4 transition-all cursor-pointer group",
        config.border,
        config.bg,
        "border border-gray-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {tarefa.prioridade && (
              <Badge className={cn("text-[10px] font-medium", config.badge)}>
                {tarefa.prioridade}
              </Badge>
            )}
            {isAtrasada && (
              <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 font-semibold">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Atrasada
              </Badge>
            )}
            {tarefa.categoria && (
              <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                {tarefa.categoria}
              </Badge>
            )}
          </div>
          
          {/* Título */}
          <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
            {tarefa.nome}
          </h4>
          
          {/* Data */}
          {tarefa.data && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isAtrasada ? "text-red-600 font-medium" : "text-gray-500"
            )}>
              <CalendarDays className="h-3 w-3" />
              {format(parseISO(tarefa.data), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          )}

          {/* Responsável */}
          {tarefa.responsavel && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <Clock className="h-3 w-3" />
              {tarefa.responsavel}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-emerald-100 hover:text-emerald-600"
            onClick={(e) => {
              e.stopPropagation();
              onConcluir(tarefa.id);
            }}
            disabled={isConcluindo}
            title="Concluir tarefa"
          >
            {isConcluindo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>
          {tarefa.notion_url && (
            <a
              href={tarefa.notion_url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100"
              onClick={(e) => e.stopPropagation()}
              title="Abrir no Notion"
            >
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Seção de tarefas
interface SecaoTarefasProps {
  titulo: string;
  icone: React.ReactNode;
  tarefas: TarefaNotionExistente[];
  tipo: 'urgente' | 'importante' | 'rotina';
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
    <Card className="overflow-hidden">
      <CardHeader className={cn("py-3 px-4", corHeader)}>
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center gap-2">
            {icone}
            {titulo}
          </div>
          <Badge variant="secondary" className="bg-white/80">
            {tarefas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {tarefasVisiveis.map(tarefa => (
          <TarefaCard 
            key={tarefa.id}
            tarefa={tarefa}
            tipo={tipo}
            onConcluir={onConcluir}
            isConcluindo={isConcluindo}
          />
        ))}
        {temMais && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-500"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? 'Ver menos' : `Ver mais ${tarefas.length - maxItens} tarefas`}
            <ChevronRight className={cn(
              "h-4 w-4 ml-1 transition-transform",
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
    concluirTarefa, 
    isConcluindo,
    sincronizar,
    isSincronizando
  } = useMinhaManha();

  const { estatisticas } = dados;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-screen">
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
            onClick={() => sincronizar()}
            disabled={isSincronizando}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isSincronizando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar Notion
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-red-50 border-red-200">
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

        <Card className="bg-amber-50 border-amber-200">
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

        <Card className="bg-emerald-50 border-emerald-200">
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

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {estatisticas.concluidas_hoje}
                </div>
                <div className="text-xs text-blue-600">Concluídas Hoje</div>
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
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
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
