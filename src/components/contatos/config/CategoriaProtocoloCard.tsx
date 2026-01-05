import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CategoriaContato, CATEGORIAS_CONFIG } from '@/types/contatos';

interface CategoriaProtocoloCardProps {
  categoria: CategoriaContato;
  ativo: boolean;
  pontuacaoMinima: number;
  onToggle: (ativo: boolean) => void;
  onPontuacaoChange: (value: number) => void;
}

const CategoriaProtocoloCard: React.FC<CategoriaProtocoloCardProps> = ({ 
  categoria, 
  ativo,
  pontuacaoMinima,
  onToggle,
  onPontuacaoChange
}) => {
  const config = CATEGORIAS_CONFIG[categoria];
  const hasPontuacao = config?.hasPontuacao ?? false;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex flex-col gap-3 p-4 bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{config.emoji}</span>
                <span className="font-medium text-sm text-foreground">{config.label}</span>
              </div>
              <Switch 
                checked={ativo} 
                onCheckedChange={onToggle}
              />
            </div>
            
            {hasPontuacao && ativo && (
              <div className="flex items-center gap-3 pt-2 border-t border-white/20 dark:border-white/10">
                <Slider
                  value={[pontuacaoMinima]}
                  onValueChange={([v]) => onPontuacaoChange(v)}
                  max={100}
                  min={10}
                  step={5}
                  className="flex-1"
                />
                <div className="relative">
                  <Input
                    type="number"
                    value={pontuacaoMinima}
                    onChange={(e) => onPontuacaoChange(parseInt(e.target.value) || 0)}
                    className="w-14 pr-5 text-center text-sm h-7"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
                    pts
                  </span>
                </div>
              </div>
            )}
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
              {hasPontuacao && (
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
