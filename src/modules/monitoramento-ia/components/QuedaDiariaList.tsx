import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { UptimeTimelineRealTime } from './UptimeTimelineRealTime';

interface QuedaOcorrencia {
  inicio: string;
  fim: string | null;
  duracao_segundos: number;
}

interface PainelQuedas {
  painel_id: string;
  painel_nome: string;
  condominio_nome: string;
  total_ocorrencias: number;
  tempo_total_offline_segundos: number;
  ocorrencias: QuedaOcorrencia[];
}

interface QuedaDiariaListProps {
  paineis: PainelQuedas[];
}

export const QuedaDiariaList = ({ paineis }: QuedaDiariaListProps) => {
  // Iniciar com todos os painéis com múltiplas quedas expandidos
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    paineis.forEach(painel => {
      if (painel.total_ocorrencias > 1) {
        initialExpanded.add(painel.painel_id);
      }
    });
    return initialExpanded;
  });

  const togglePanel = (painelId: string) => {
    setExpandedPanels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(painelId)) {
        newSet.delete(painelId);
      } else {
        newSet.add(painelId);
      }
      return newSet;
    });
  };

  const formatDuracao = (segundos: number): string => {
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) {
      return `${dias}d ${horas % 24}h`;
    } else if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  };

  const getTimePosition = (dateString: string): number => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return (hours + minutes / 60 + seconds / 3600) / 24 * 100;
  };

  const getTimeWidth = (durationSeconds: number): number => {
    const hours = durationSeconds / 3600;
    return (hours / 24) * 100;
  };

  if (paineis.length === 0) {
    return (
      <p className="text-sm text-module-secondary text-center py-4">
        Nenhuma queda registrada no período selecionado
      </p>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {paineis.map((painel) => {
        const isExpanded = expandedPanels.has(painel.painel_id);

        return (
          <div key={painel.painel_id} className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
            {/* Header Compacto */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{painel.painel_nome}</span>
                <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium">
                  {painel.total_ocorrencias}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDuracao(painel.tempo_total_offline_segundos)} offline
              </span>
            </div>

            {/* Timeline Real-Time com Navegação Multi-Dia */}
            <UptimeTimelineRealTime 
              ocorrencias={painel.ocorrencias}
              painelId={painel.painel_id}
            />

            {/* Condomínio - apenas se diferente do nome do painel */}
            {painel.condominio_nome !== painel.painel_nome && (
              <p className="text-xs text-muted-foreground mb-2">{painel.condominio_nome}</p>
            )}

            {/* Detalhes Expandíveis Minimalistas */}
            <Collapsible open={isExpanded} onOpenChange={() => togglePanel(painel.painel_id)}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">
                  {isExpanded ? 'Ocultar' : 'Ver'} detalhes das ocorrências
                </span>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3 space-y-1.5">
                {painel.ocorrencias.map((ocorrencia, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs py-1.5">
                    <span className="w-32 font-mono text-muted-foreground">
                      {format(new Date(ocorrencia.inicio), 'HH:mm', { locale: ptBR })}
                      {ocorrencia.fim && (
                        <> → {format(new Date(ocorrencia.fim), 'HH:mm', { locale: ptBR })}</>
                      )}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                    <span className="font-semibold text-destructive">
                      {formatDuracao(ocorrencia.duracao_segundos)}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
};
