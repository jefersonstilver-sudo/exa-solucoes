
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

const TacohFramework: React.FC = () => {
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
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 relative z-10">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-indexa-mint to-indexa-purple p-3 sm:p-4 rounded-full mr-4 sm:mr-6 shadow-2xl shadow-indexa-mint/30 animate-pulse">
              <Puzzle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-center text-white">
              Estratégia como <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">Quebra-Cabeça</span>
            </h2>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 max-w-4xl mx-auto">
            <p className="text-sm xs:text-base sm:text-base md:text-lg lg:text-xl leading-relaxed text-center text-white/90">
              Cada campanha é construída considerando todos os elementos estratégicos essenciais. 
              Como um quebra-cabeça, cada peça tem seu lugar e propósito para formar o resultado completo.
            </p>
          </div>
        </div>

        {/* Animação Central do Quebra-Cabeça - Responsivo */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="relative">
            <div className="grid grid-cols-3 grid-rows-2 gap-1 sm:gap-2 w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-32">
              {strategyElements.map((element, index) => (
                 <div
                   key={index}
                   className={`bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-md sm:rounded-lg border border-indexa-mint/50 flex items-center justify-center transition-all duration-500 transform shadow-lg ${
                     animatedPieces.includes(element.piece) 
                       ? 'opacity-100 scale-100 rotate-0 shadow-indexa-mint/50' 
                       : 'opacity-30 scale-75 rotate-12'
                   }`}
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
              className={`bg-white/10 backdrop-blur-sm border-white/20 text-white hover:scale-105 hover:shadow-2xl hover:bg-white/20 transition-all duration-300 cursor-pointer overflow-hidden group ${
                animatedPieces.includes(element.piece) ? 'ring-2 ring-indexa-mint/50 shadow-2xl shadow-indexa-mint/30' : ''
              }`}
            >
              <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                <div className="flex items-center mb-3 sm:mb-4">
                  {element.icon}
                  <h5 className="ml-2 sm:ml-3 text-indexa-mint text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium leading-normal">
                     {element.title}
                   </h5>
                 </div>
                 <p className="flex-1 leading-relaxed text-xs xs:text-sm sm:text-sm md:text-base lg:text-lg leading-normal text-white/80">
                   {element.description}
                 </p>
              </CardContent>
            </Card>
          ))}
        </div>

         <div className="text-center mt-8 sm:mt-12">
           <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-xl p-6 border border-indexa-mint/30 inline-block">
             <p className="text-sm xs:text-base sm:text-base md:text-lg lg:text-xl leading-relaxed text-white">
               <span className="text-indexa-mint font-semibold">Resultado:</span> Campanhas completas que conectam, convencem e convertem.
             </p>
           </div>
         </div>
      </div>
    </section>
  );
};

export default TacohFramework;
