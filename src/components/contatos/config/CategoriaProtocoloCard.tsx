import React from 'react';
import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { CategoriaContato, CATEGORIAS_CONFIG } from '@/types/contatos';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface CategoriaProtocoloCardProps {
  categoria: CategoriaContato;
}

const CategoriaProtocoloCard: React.FC<CategoriaProtocoloCardProps> = ({ categoria }) => {
  const config = CATEGORIAS_CONFIG[categoria];

  return (
    <HoverCard openDelay={100} closeDelay={50}>
      <HoverCardTrigger asChild>
        <div className="p-4 rounded-xl border border-border bg-card cursor-help hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
          <div className="flex items-center gap-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">{config.emoji}</span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm truncate">{config.label}</h4>
              <p className="text-xs text-muted-foreground truncate">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {config.hasPontuacao && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Usa Pontuação
              </Badge>
            )}
            {config.temperaturas && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Temperatura
              </Badge>
            )}
            {config.alerta && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Atenção
              </Badge>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-[400px] z-[200] max-h-[80vh] overflow-y-auto" 
        side="right" 
        align="start"
        sideOffset={12}
        avoidCollisions={true}
        collisionPadding={24}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <span className="text-3xl">{config.emoji}</span>
            <div>
              <h4 className="font-bold text-lg text-foreground">{config.label}</h4>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Definição */}
          <div>
            <h5 className="font-semibold text-sm text-primary mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Definição
            </h5>
            <p className="text-sm text-foreground leading-relaxed">{config.definicao}</p>
          </div>

          {/* Critérios */}
          {config.criterios && config.criterios.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm text-primary mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Critérios Obrigatórios
              </h5>
              <ul className="space-y-1">
                {config.criterios.map((criterio, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {criterio}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exemplos */}
          {config.exemplos && config.exemplos.length > 0 && (
            <div>
              <h5 className="font-semibold text-sm text-muted-foreground mb-2">Exemplos</h5>
              <div className="flex flex-wrap gap-1.5">
                {config.exemplos.map((exemplo, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs font-normal">
                    {exemplo}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Regras Operacionais */}
          <div>
            <h5 className="font-semibold text-sm text-muted-foreground mb-2">Regras Operacionais</h5>
            <ul className="space-y-1.5">
              {config.regras.map((regra, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  {regra}
                </li>
              ))}
            </ul>
          </div>

          {/* Temperaturas */}
          {config.temperaturas && (
            <div className="pt-2 border-t border-border">
              <h5 className="font-semibold text-sm text-muted-foreground mb-2">Classificação de Temperatura</h5>
              <div className="flex gap-2">
                <Badge className="bg-green-500 hover:bg-green-500 text-white">🟢 Quente</Badge>
                <Badge className="bg-yellow-400 hover:bg-yellow-400 text-black">🟡 Morno</Badge>
                <Badge className="bg-red-500 hover:bg-red-500 text-white">🔴 Frio</Badge>
              </div>
            </div>
          )}

          {/* Alerta */}
          {config.alerta && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{config.alerta}</p>
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CategoriaProtocoloCard;
