import React from 'react';
import { Clock, Monitor, Users, Triangle, TrendingUp, Maximize, Timer, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVideoSpecifications } from '@/hooks/useVideoSpecifications';

interface TechnicalSpecsGridProps {
  tipo: 'horizontal' | 'vertical_premium';
}
interface SpecItemProps {
  icon: React.ElementType;
  text: string;
}
const SpecItem = ({
  icon: Icon,
  text
}: SpecItemProps) => <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#9C1E1E] shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-sm text-gray-600">{text}</span>
  </div>;

export const TechnicalSpecsGrid: React.FC<TechnicalSpecsGridProps> = ({
  tipo
}) => {
  const {
    specifications
  } = useVideoSpecifications();
  const isVertical = tipo === 'vertical_premium';

  // Get specs from hook (dynamic) with safe defaults — números OFICIAIS 2026 por tipo
  const specs = isVertical ? {
    duracao: specifications?.vertical.duracaoSegundos ?? 15,
    resolucao: specifications?.vertical.resolucao ?? '1080×1920',
    proporcao: specifications?.vertical.proporcao ?? '9:16',
    maxClientes: specifications?.vertical.maxClientesPainel ?? 3,
    exibicoesMes: specifications?.vertical.exibicoesPorMes ?? 5010,
    exibicoesDia: specifications?.vertical.exibicoesPorDia ?? 167,
    presencaMin: specifications?.vertical.presencaMinutosDia ?? 42,
    badgeLabel: 'Tela Cheia · Memória Absoluta',
    presencaLabel: 'tela 100% sua/dia',
    marcasLabel: 'apenas',
  } : {
    duracao: specifications?.horizontal.duracaoSegundos ?? 10,
    resolucao: specifications?.horizontal.resolucao ?? '1440×1080',
    proporcao: specifications?.horizontal.proporcao ?? '4:3',
    maxClientes: specifications?.horizontal.maxClientesPainel ?? 15,
    exibicoesMes: specifications?.horizontal.exibicoesPorMes ?? 15060,
    exibicoesDia: specifications?.horizontal.exibicoesPorDia ?? 502,
    presencaMin: specifications?.horizontal.presencaMinutosDia ?? 83,
    badgeLabel: 'Volume + Frequência',
    presencaLabel: 'min de presença/dia',
    marcasLabel: 'até',
  };

  return (
    <Card className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {isVertical ? 'Vertical Premium' : 'Horizontal'}
        </span>
        <Badge className="bg-[#9C1E1E]/10 text-[#9C1E1E] border-0 text-[10px] font-semibold">
          <Sparkles className="w-3 h-3 mr-1" />
          {specs.badgeLabel}
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SpecItem icon={Clock} text={`${specs.duracao}s de duração`} />
        <SpecItem icon={Monitor} text={specs.resolucao} />
        <SpecItem icon={Users} text={`${specs.marcasLabel} ${specs.maxClientes} ${isVertical ? 'marcas' : 'empresas'}`} />
        <SpecItem icon={Triangle} text={`Proporção ${specs.proporcao}`} />
        <SpecItem icon={TrendingUp} text={`${specs.exibicoesMes.toLocaleString('pt-BR')} exib./mês`} />
        <SpecItem icon={Maximize} text={`${specs.exibicoesDia.toLocaleString('pt-BR')}x/dia`} />
        <SpecItem icon={Timer} text={`${specs.presencaMin} ${specs.presencaLabel}`} />
      </div>
    </Card>
  );
};
