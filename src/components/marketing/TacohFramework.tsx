
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
      icon: <BarChart3 className="h-6 w-6 text-[#00FFAB]" />,
      piece: 1
    },
    {
      title: "Autoridade",
      description: "Reconhecimentos e posicionamento como referência no mercado",
      icon: <Trophy className="h-6 w-6 text-[#00FFAB]" />,
      piece: 2
    },
    {
      title: "Crescimento",
      description: "Cases reais de evolução e resultados comprovados",
      icon: <TrendingUp className="h-6 w-6 text-[#00FFAB]" />,
      piece: 3
    },
    {
      title: "Conexão",
      description: "Narrativas com emoção que criam vínculos verdadeiros",
      icon: <Heart className="h-6 w-6 text-[#00FFAB]" />,
      piece: 4
    },
    {
      title: "Objeção",
      description: "Antecipação de dúvidas e eliminação de barreiras",
      icon: <Shield className="h-6 w-6 text-[#00FFAB]" />,
      piece: 5
    },
    {
      title: "Relevância",
      description: "Elementos modernos que mantêm sua marca sempre atual",
      icon: <Zap className="h-6 w-6 text-[#00FFAB]" />,
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
    <section className="py-20 bg-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Puzzle className="h-12 w-12 text-[#00FFAB] mr-4 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold">
              Estratégia como <span className="text-[#00FFAB]">Quebra-Cabeça</span>
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Cada campanha é construída considerando todos os elementos estratégicos essenciais. 
            Como um quebra-cabeça, cada peça tem seu lugar e propósito para formar o resultado completo.
          </p>
        </div>

        {/* Animação Central do Quebra-Cabeça */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="grid grid-cols-3 grid-rows-2 gap-2 w-48 h-32">
              {strategyElements.map((element, index) => (
                <div
                  key={index}
                  className={`
                    bg-gradient-to-br from-[#3C1361] to-[#00FFAB] 
                    rounded-lg border-2 border-[#00FFAB]/50
                    flex items-center justify-center
                    transition-all duration-500 transform
                    ${animatedPieces.includes(element.piece) 
                      ? 'opacity-100 scale-100 rotate-0' 
                      : 'opacity-30 scale-75 rotate-12'
                    }
                  `}
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

        {/* Grid de Elementos da Estratégia */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategyElements.map((element, index) => (
            <Card 
              key={index} 
              className={`
                bg-white/5 border-white/10 text-white hover:scale-105 
                transition-all duration-300 cursor-pointer overflow-hidden group
                ${animatedPieces.includes(element.piece) ? 'ring-2 ring-[#00FFAB]/30' : ''}
              `}
            >
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center mb-4">
                  {element.icon}
                  <h3 className="text-xl font-bold ml-3 text-[#00FFAB]">{element.title}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed flex-1">{element.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-gray-300">
            <span className="text-[#00FFAB] font-semibold">Resultado:</span> Campanhas completas que conectam, convencem e convertem.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TacohFramework;
