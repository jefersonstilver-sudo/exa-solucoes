
import React, { useState, useEffect } from 'react';
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
import ResponsiveContainer from '@/components/responsive/ResponsiveContainer';
import ResponsiveTypography from '@/components/responsive/ResponsiveTypography';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

const TacohFramework: React.FC = () => {
  const { isPhone, isTablet } = useAdvancedResponsive();
  const [animatedPieces, setAnimatedPieces] = useState<number[]>([]);

  const strategyElements = [
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
  ];

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setAnimatedPieces(prev => {
        if (prev.length >= strategyElements.length) {
          return [];
        }
        return [...prev, prev.length + 1];
      });
    }, 800);

    return () => clearInterval(animationInterval);
  }, []);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-black">
      <ResponsiveContainer maxWidth="xxl">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Puzzle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-[#00FFAB] mr-3 sm:mr-4 animate-pulse" />
            <ResponsiveTypography 
              variant="h2" 
              color="white"
              align="center"
            >
              Estratégia como <span className="text-[#00FFAB]">Quebra-Cabeça</span>
            </ResponsiveTypography>
          </div>
          <ResponsiveTypography 
            variant="body" 
            color="gray" 
            align="center"
            className="max-w-4xl mx-auto"
          >
            Cada campanha é construída considerando todos os elementos estratégicos essenciais. 
            Como um quebra-cabeça, cada peça tem seu lugar e propósito para formar o resultado completo.
          </ResponsiveTypography>
        </div>

        {/* Animação Central do Quebra-Cabeça - Responsivo */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="relative">
            <div className={cn(
              "grid grid-cols-3 grid-rows-2 gap-1 sm:gap-2",
              isPhone ? "w-32 h-20" : isTablet ? "w-40 h-24" : "w-48 h-32"
            )}>
              {strategyElements.map((element, index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-gradient-to-br from-[#3C1361] to-[#00FFAB] rounded-md sm:rounded-lg border border-[#00FFAB]/50 flex items-center justify-center transition-all duration-500 transform",
                    animatedPieces.includes(element.piece) 
                      ? 'opacity-100 scale-100 rotate-0' 
                      : 'opacity-30 scale-75 rotate-12'
                  )}
                  style={{
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  {element.icon}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de Elementos da Estratégia - Totalmente Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {strategyElements.map((element, index) => (
            <Card 
              key={index} 
              className={cn(
                "bg-white/5 border-white/10 text-white hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden group",
                animatedPieces.includes(element.piece) ? 'ring-2 ring-[#00FFAB]/30' : ''
              )}
            >
              <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                <div className="flex items-center mb-3 sm:mb-4">
                  {element.icon}
                  <ResponsiveTypography 
                    variant="h5" 
                    className="ml-2 sm:ml-3 text-[#00FFAB]"
                  >
                    {element.title}
                  </ResponsiveTypography>
                </div>
                <ResponsiveTypography 
                  variant="caption" 
                  color="gray" 
                  className="flex-1 leading-relaxed"
                >
                  {element.description}
                </ResponsiveTypography>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <ResponsiveTypography 
            variant="body" 
            color="gray"
          >
            <span className="text-[#00FFAB] font-semibold">Resultado:</span> Campanhas completas que conectam, convencem e convertem.
          </ResponsiveTypography>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default TacohFramework;
