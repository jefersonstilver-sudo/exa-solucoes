import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CategoriaContato, CATEGORIAS_CONFIG } from '@/types/contatos';

interface CategoriaProtocoloCardProps {
  categoria: CategoriaContato;
  ativo: boolean;
  onToggle: (ativo: boolean) => void;
}

const CategoriaProtocoloCard: React.FC<CategoriaProtocoloCardProps> = ({ 
  categoria, 
  ativo,
  onToggle 
}) => {
  const config = CATEGORIAS_CONFIG[categoria];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xl">{config.emoji}</span>
              <span className="font-medium text-sm text-foreground">{config.label}</span>
            </div>
            <Switch 
              checked={ativo} 
              onCheckedChange={onToggle}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[280px] p-3 bg-popover/95 backdrop-blur-sm"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.emoji}</span>
              <span className="font-semibold text-sm">{config.label}</span>
              {config.hasPontuacao && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Pontuação
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {config.definicao}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CategoriaProtocoloCard;
