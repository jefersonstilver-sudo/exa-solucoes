import React from 'react';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyTickerBarProps {
  className?: string;
}

export const CurrencyTickerBar: React.FC<CurrencyTickerBarProps> = ({ className }) => {
  const { rates, loading } = useCurrencyRates();

  if (loading || rates.length === 0) {
    return (
      <div className={cn(
        "bg-purple-900 h-12 md:h-16 flex items-center justify-center",
        className
      )}>
        <p className="text-white/60 text-xs md:text-sm">Carregando cotações...</p>
      </div>
    );
  }

  // Duplicar as cotações para criar efeito de loop infinito
  const duplicatedRates = [...rates, ...rates];

  return (
    <div className={cn("relative bg-purple-900 overflow-hidden", className)}>
      <div className="h-12 md:h-16 flex items-center">
        {/* Container com animação de scroll infinito */}
        <div className="flex animate-scroll-ticker whitespace-nowrap">
          {duplicatedRates.map((rate, index) => (
            <div
              key={`${rate.code}-${index}`}
              className="inline-flex items-center gap-2 px-4 md:px-6 py-2"
            >
              {/* Nome da moeda */}
              <span className="text-white font-bold text-xs md:text-sm">
                {rate.name}
              </span>

              {/* Valores */}
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <span className="text-white/80">
                  R$ {rate.buy.toFixed(rate.code === 'BTC' ? 0 : 2)}
                </span>
                
                {/* Variação com ícone e cor */}
                <div className={cn(
                  "flex items-center gap-0.5",
                  rate.variation >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {rate.variation >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-semibold">
                    {Math.abs(rate.variation).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Separador */}
              <div className="w-px h-6 bg-white/20 ml-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
