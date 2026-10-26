import React, { useEffect, useState } from 'react';
import ReplicaPainel from '@/components/pedido-v2/ReplicaPainel';
import { Clock, Users, Triangle, Monitor, BarChart3, TrendingUp, Smartphone, RectangleHorizontal } from 'lucide-react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { Card } from '@/components/ui/card';
import { useVideoSpecifications } from '@/hooks/useVideoSpecifications';

// Import mockup images
import mockupVertical from '@/assets/mockups/mockup-vertical.png';

interface ProductShowcaseCardProps {
  tipo: 'horizontal' | 'vertical_premium';
  totalPanels?: number;
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

// Amostra: anúncio real de um cliente da rede, tocando no player do layout atual (1080×890)
const SAMPLE_VIDEO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/videos/de96cfa9-9dbe-4ead-be94-3647e345d2de/1793020345896_DELFUEGO_V1-fermentacao_10s_horizontal.mp4';

export const ProductShowcaseCard: React.FC<ProductShowcaseCardProps> = ({ tipo, totalPanels = 1 }) => {
  const { specifications, isLoading } = useVideoSpecifications();
  const { weatherData } = useWeatherData();
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setAgora(new Date()), 1000); return () => clearInterval(i); }, []);
  
  const isVertical = tipo === 'vertical_premium';
  
  // Get specs from hook (dynamic) com defaults oficiais 2026 por tipo
  const specs = isVertical 
    ? {
        duracao: specifications?.vertical.duracaoSegundos ?? 15,
        resolucao: specifications?.vertical.resolucao ?? '1080×1920',
        proporcao: specifications?.vertical.proporcao ?? '9:16',
        maxClientes: specifications?.vertical.maxClientesPainel ?? 3,
        exibicoesMes: specifications?.vertical.exibicoesPorMes ?? 5010,
        exibicoesDia: specifications?.vertical.exibicoesPorDia ?? 167,
        presencaMin: specifications?.vertical.presencaMinutosDia ?? 42,
        marcasLabel: 'apenas',
        unidadeMarcas: 'marcas',
        presencaLabel: 'min de tela 100% sua por dia',
        badge: 'Tela Cheia · Memória Absoluta',
      }
    : {
        duracao: specifications?.horizontal.duracaoSegundos ?? 10,
        // Layout atual da tela (desde 23/10/2026): área do anúncio 1080×890, quase quadrada
        resolucao: '1080×890',
        proporcao: '≈ 6:5 (quase quadrado)',
        maxClientes: specifications?.horizontal.maxClientesPainel ?? 15,
        exibicoesMes: specifications?.horizontal.exibicoesPorMes ?? 15060,
        exibicoesDia: specifications?.horizontal.exibicoesPorDia ?? 502,
        presencaMin: specifications?.horizontal.presencaMinutosDia ?? 83,
        marcasLabel: 'Até',
        unidadeMarcas: 'empresas por prédio',
        presencaLabel: 'min de presença por dia',
        badge: 'Volume + Frequência',
      };

  const productTitle = isVertical ? 'VERTICAL PREMIUM' : 'HORIZONTAL';
  const mockupImage = mockupVertical;
  const ProductIcon = isVertical ? Smartphone : RectangleHorizontal;

  return (
    <>
    <Card className="p-5 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-start">
        
        {/* Left: Mockup Image */}
        <div className={`relative shrink-0 ${isVertical ? 'w-full max-w-[200px]' : 'w-full max-w-[220px]'}`}>
          {isVertical ? (
            <img 
              src={mockupImage} 
              alt={`Painel ${productTitle}`}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          ) : (
            // Tela real do elevador (layout atual 1080×1920): o anúncio horizontal toca no player do topo
            <ReplicaPainel
              predioNome="Seu prédio"
              now={agora}
              slot={{ id: 'amostra', url: SAMPLE_VIDEO_URL } as any}
              clima={weatherData}
              preencher
            />
          )}
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

          <div className="mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#9C1E1E]/10 text-[#9C1E1E] text-[10px] font-semibold uppercase tracking-wider">
              {specs.badge}
            </span>
          </div>

          <div className="flex flex-col gap-4 md:gap-5">
            <FeatureItem 
              icon={Clock} 
              text="" 
              boldText={`${specs.duracao} segundos`} 
            />
            <FeatureItem 
              icon={Users} 
              text={specs.marcasLabel} 
              boldText={`${specs.maxClientes} ${specs.unidadeMarcas}`} 
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
              boldText={`${specs.exibicoesMes.toLocaleString('pt-BR')} exibições por mês em cada painel.`} 
            />
            <FeatureItem 
              icon={TrendingUp} 
              text="" 
              boldText={`${(specs.exibicoesDia * totalPanels).toLocaleString('pt-BR')} vezes por dia`} 
            />
            <FeatureItem 
              icon={BarChart3} 
              text="" 
              boldText={`${specs.presencaMin} ${specs.presencaLabel}`} 
            />
          </div>

          {/* Minimalist audience indicator */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-muted-foreground italic flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Em média, moradores utilizam o elevador 40× por semana
            </p>
          </div>
        </div>
      </div>
    </Card>

    </>
  );
};
