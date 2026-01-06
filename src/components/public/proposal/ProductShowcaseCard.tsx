import React from 'react';
import { Clock, Users, Triangle, Monitor, BarChart3, TrendingUp, Smartphone, RectangleHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useVideoSpecifications } from '@/hooks/useVideoSpecifications';

// Import mockup images
import mockupHorizontal from '@/assets/mockups/mockup-horizontal.png';
import mockupVertical from '@/assets/mockups/mockup-vertical.png';

interface ProductShowcaseCardProps {
  tipo: 'horizontal' | 'vertical_premium';
}

interface FeatureItemProps {
  icon: React.ElementType;
  text: string;
  boldText?: string;
}

const FeatureItem = ({ icon: Icon, text, boldText }: FeatureItemProps) => (
  <div className="flex items-center gap-3 md:gap-4">
    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-[#9C1E1E] shrink-0">
      <Icon className="w-4 h-4 md:w-5 md:h-5" />
    </div>
    <span className="text-gray-600 text-sm md:text-base">
      {text} {boldText && <span className="font-semibold text-gray-900">{boldText}</span>}
    </span>
  </div>
);

export const ProductShowcaseCard: React.FC<ProductShowcaseCardProps> = ({ tipo }) => {
  const { specifications, isLoading } = useVideoSpecifications();
  
  const isVertical = tipo === 'vertical_premium';
  
  // Get specs from hook (dynamic) with safe defaults
  const specs = isVertical 
    ? {
        duracao: specifications?.vertical.duracaoSegundos ?? 15,
        resolucao: specifications?.vertical.resolucao ?? '1080×1920',
        proporcao: specifications?.vertical.proporcao ?? '9:16',
        maxClientes: specifications?.vertical.maxClientesPainel ?? 3,
        exibicoesMes: specifications?.exibicoes.porMes ?? 11610,
        exibicoesDia: specifications?.exibicoes.porDia ?? 387,
      }
    : {
        duracao: specifications?.horizontal.duracaoSegundos ?? 10,
        resolucao: specifications?.horizontal.resolucao ?? '1440×1080',
        proporcao: specifications?.horizontal.proporcao ?? '4:3',
        maxClientes: specifications?.horizontal.maxClientesPainel ?? 15,
        exibicoesMes: specifications?.exibicoes.porMes ?? 11610,
        exibicoesDia: specifications?.exibicoes.porDia ?? 387,
      };

  const productTitle = isVertical ? 'VERTICAL PREMIUM' : 'HORIZONTAL';
  const mockupImage = isVertical ? mockupVertical : mockupHorizontal;
  const ProductIcon = isVertical ? Smartphone : RectangleHorizontal;

  return (
    <Card className="p-5 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-start">
        
        {/* Left: Mockup Image */}
        <div className={`relative shrink-0 ${isVertical ? 'w-full max-w-[200px]' : 'w-full max-w-[280px]'}`}>
          <img 
            src={mockupImage} 
            alt={`Painel ${productTitle}`}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Right: Features List */}
        <div className="flex-1 w-full">
          <div className="mb-5 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ProductIcon className="w-5 h-5 md:w-6 md:h-6 text-[#9C1E1E]" />
              {productTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Seu produto escolhido para esta campanha
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-5">
            <FeatureItem 
              icon={Clock} 
              text="" 
              boldText={`${specs.duracao} segundos`} 
            />
            <FeatureItem 
              icon={Users} 
              text="Até" 
              boldText={`${specs.maxClientes} empresas por prédio`} 
            />
            <FeatureItem 
              icon={Triangle} 
              text="Proporção" 
              boldText={specs.proporcao} 
            />
            <FeatureItem 
              icon={Monitor} 
              text="" 
              boldText={specs.resolucao} 
            />
            <FeatureItem 
              icon={BarChart3} 
              text="" 
              boldText={`${specs.exibicoesMes.toLocaleString('pt-BR')} exibições por mês`} 
            />
            <FeatureItem 
              icon={TrendingUp} 
              text="" 
              boldText={`${specs.exibicoesDia.toLocaleString('pt-BR')} vezes por dia`} 
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
