
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Heart, 
  Shield, 
  Zap,
  Puzzle
} from 'lucide-react';
import useOptimizedResponsive from '@/hooks/useOptimizedResponsive';

const TacohFramework: React.FC = () => {
  const [animatedPieces, setAnimatedPieces] = useState<number[]>([]);
  const { shouldUseReducedAnimations, getResponsiveValue } = useOptimizedResponsive();

  // Memoizar elementos da estratégia para evitar recriações
  const strategyElements = useMemo(() => [
    {
      title: "Técnico",
      description: "Dados, métricas e estudos de caso que demonstram resultados reais",
      icon: <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-[#00FFAB]" />,
      piece: 1
    },
    {
      title: "Autoridade",
      description: "Reconhecimentos e posicionamento como referência no mercado",
      icon: <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#00FFAB]" />,
      piece: 2
    },
    {
      title: "Crescimento",
      description: "Cases reais de evolução e resultados comprovados",
      icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-[#00FFAB]" />,
      piece: 3
    },
    {
      title: "Conexão",
      description: "Narrativas com emoção que criam vínculos verdadeiros",
      icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-[#00FFAB]" />,
      piece: 4
    },
    {
      title: "Objeção",
      description: "Antecipação de dúvidas e eliminação de barreiras",
      icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-[#00FFAB]" />,
      piece: 5
    },
    {
      title: "Relevância",
      description: "Elementos modernos que mantêm sua marca sempre atual",
      icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-[#00FFAB]" />,
      piece: 6
    }
  ], []);

  // Animação otimizada com controle de performance
  useEffect(() => {
    if (shouldUseReducedAnimations) {
      // Mostrar todas as peças imediatamente se animações reduzidas
      setAnimatedPieces(strategyElements.map(el => el.piece));
      return;
    }

    const animationInterval = setInterval(() => {
      setAnimatedPieces(prev => {
        if (prev.length >= strategyElements.length) {
          return [];
        }
        return [...prev, prev.length + 1];
      });
    }, 800);

    return () => clearInterval(animationInterval);
  }, [strategyElements.length, shouldUseReducedAnimations]);

  // Callback otimizado para animação
  const getAnimationDelay = useCallback((index: number) => {
    return shouldUseReducedAnimations ? 0 : `${index * 200}ms`;
  }, [shouldUseReducedAnimations]);

  // Valores responsivos otimizados
  const titleSize = getResponsiveValue({
    mobile: 'text-xl',
    tablet: 'text-3xl',
    desktop: 'text-4xl',
    xl: 'text-6xl',
    default: 'text-2xl'
  });

  const subtitleSize = getResponsiveValue({
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg',
    xl: 'text-xl',
    default: 'text-base'
  });

  const cardTitleSize = getResponsiveValue({
    mobile: 'text-base',
    tablet: 'text-lg',
    desktop: 'text-xl',
    xl: 'text-2xl',
    default: 'text-lg'
  });

  const cardDescSize = getResponsiveValue({
    mobile: 'text-xs',
    tablet: 'text-sm',
    desktop: 'text-base',
    xl: 'text-lg',
    default: 'text-sm'
  });

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Puzzle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-[#00FFAB] mr-3 sm:mr-4 animate-pulse" />
            <h2 className={`${titleSize} font-bold leading-tight text-center text-white`}>
              Estratégia como <span className="text-[#00FFAB]">Quebra-Cabeça</span>
            </h2>
          </div>
          <p className={`${subtitleSize} leading-relaxed text-center text-gray-400 max-w-4xl mx-auto`}>
            Cada campanha é construída considerando todos os elementos estratégicos essenciais. 
            Como um quebra-cabeça, cada peça tem seu lugar e propósito para formar o resultado completo.
          </p>
        </div>

        {/* Animação Central do Quebra-Cabeça - Otimizada */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="relative">
            <div className="grid grid-cols-3 grid-rows-2 gap-1 sm:gap-2 w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-32">
              {strategyElements.map((element, index) => (
                <div
                  key={element.piece}
                  className={`bg-gradient-to-br from-[#3C1361] to-[#00FFAB] rounded-md sm:rounded-lg border border-[#00FFAB]/50 flex items-center justify-center transition-all duration-500 transform ${
                    animatedPieces.includes(element.piece) 
                      ? 'opacity-100 scale-100 rotate-0' 
                      : 'opacity-30 scale-75 rotate-12'
                  }`}
                  style={{
                    animationDelay: getAnimationDelay(index)
                  }}
                >
                  {element.icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Elementos - Totalmente Responsivo e Otimizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {strategyElements.map((element, index) => (
            <Card 
              key={element.piece}
              className={`bg-white/5 border-white/10 text-white hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group ${
                animatedPieces.includes(element.piece) ? 'ring-2 ring-[#00FFAB]/30' : ''
              }`}
            >
              <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                <div className="flex items-center mb-3 sm:mb-4">
                  {element.icon}
                  <h5 className={`ml-2 sm:ml-3 text-[#00FFAB] ${cardTitleSize} font-medium leading-normal`}>
                    {element.title}
                  </h5>
                </div>
                <p className={`flex-1 leading-relaxed ${cardDescSize} text-gray-400`}>
                  {element.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <p className={`${subtitleSize} leading-relaxed text-gray-400`}>
            <span className="text-[#00FFAB] font-semibold">Resultado:</span> Campanhas completas que conectam, convencem e convertem.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TacohFramework;
