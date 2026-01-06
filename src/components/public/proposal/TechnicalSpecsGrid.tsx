import React from 'react';
import { Clock, Monitor, Users, Triangle, TrendingUp, Maximize } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

  // Get specs from hook (dynamic) with safe defaults
  const specs = isVertical ? {
    duracao: specifications?.vertical.duracaoSegundos ?? 15,
    resolucao: specifications?.vertical.resolucao ?? '1080×1920',
    proporcao: specifications?.vertical.proporcao ?? '9:16',
    maxClientes: specifications?.vertical.maxClientesPainel ?? 3,
    exibicoesMes: specifications?.exibicoes.porMes ?? 11610,
    exibicoesDia: specifications?.exibicoes.porDia ?? 387
  } : {
    duracao: specifications?.horizontal.duracaoSegundos ?? 10,
    resolucao: specifications?.horizontal.resolucao ?? '1440×1080',
    proporcao: specifications?.horizontal.proporcao ?? '4:3',
    maxClientes: specifications?.horizontal.maxClientesPainel ?? 15,
    exibicoesMes: specifications?.exibicoes.porMes ?? 11610,
    exibicoesDia: specifications?.exibicoes.porDia ?? 387
  };
  return;
};