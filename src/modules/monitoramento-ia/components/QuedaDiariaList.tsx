import { useState } from 'react';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

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

  if (paineis.length === 0) {
    return (
      <p className="text-sm text-module-secondary text-center py-4">
        Nenhuma queda registrada no período selecionado
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {paineis.map((painel) => {
        const isExpanded = expandedPanels.has(painel.painel_id);
        const temMultiplasQuedas = painel.total_ocorrencias > 1;

        return (
          <div key={painel.painel_id} className="border border-module rounded-lg overflow-hidden">
            <div
              className={`flex items-center justify-between p-3 bg-module-secondary hover:bg-module-hover transition-colors ${
                temMultiplasQuedas ? 'cursor-pointer' : ''
              }`}
              onClick={() => temMultiplasQuedas && togglePanel(painel.painel_id)}
            >
              <div className="flex-1 flex items-center gap-2">
                {temMultiplasQuedas && (
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-module-secondary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-module-secondary" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-module-primary">{painel.painel_nome}</p>
                  <p className="text-xs text-module-tertiary">{painel.condominio_nome}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-module-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Total offline: {formatDuracao(painel.tempo_total_offline_segundos)}
                    </span>
                    {temMultiplasQuedas && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        {painel.total_ocorrencias} ocorrências
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-base font-bold text-red-600 ml-4">
                {painel.total_ocorrencias}
              </span>
            </div>

            {isExpanded && temMultiplasQuedas && (
              <div className="bg-module p-3 border-t border-module">
                <p className="text-xs font-semibold text-module-secondary mb-2 uppercase">
                  Detalhes das Ocorrências
                </p>
                <div className="space-y-2">
                  {painel.ocorrencias.map((ocorrencia, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-module-secondary rounded border border-module"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-module-primary">
                          <span className="font-medium">Ocorrência {idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-module-secondary">
                          <span>
                            Início: {format(new Date(ocorrencia.inicio), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                          {ocorrencia.fim && (
                            <>
                              <span>→</span>
                              <span>
                                Fim: {format(new Date(ocorrencia.fim), 'HH:mm:ss', { locale: ptBR })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-600 ml-4">
                        {formatDuracao(ocorrencia.duracao_segundos)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
