import React, { useState, useEffect } from 'react';
import { Puzzle, Sparkles, TrendingUp, Users, Heart, Zap } from 'lucide-react';

const TaccohPuzzleHero: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false);
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);

  const puzzlePieces = [
    { 
      id: 'T', 
      letter: 'T', 
      title: 'Técnico', 
      color: 'from-blue-500 to-indigo-600',
      icon: Puzzle,
      position: 'top-left',
      description: 'Mostre o processo, gere confiança'
    },
    { 
      id: 'A', 
      letter: 'A', 
      title: 'Autoridade', 
      color: 'from-yellow-400 to-orange-500',
      icon: TrendingUp,
      position: 'top-right',
      description: 'Conquistas, credibilidade, cases'
    },
    { 
      id: 'C1', 
      letter: 'C', 
      title: 'Crescimento', 
      color: 'from-green-400 to-emerald-600',
      icon: Sparkles,
      position: 'middle-left',
      description: 'Inspire, ensine, viralize'
    },
    { 
      id: 'C2', 
      letter: 'C', 
      title: 'Conexão', 
      color: 'from-pink-400 to-rose-500',
      icon: Heart,
      position: 'middle-right',
      description: 'Histórias reais, emoção, humanidade'
    },
    { 
      id: 'O', 
      letter: 'O', 
      title: 'Objeção', 
      color: 'from-red-500 to-pink-600',
      icon: Users,
      position: 'bottom-left',
      description: 'Antecipe e quebra barreiras'
    },
    { 
      id: 'H', 
      letter: 'H', 
      title: 'Hype', 
      color: 'from-orange-400 to-yellow-500',
      icon: Zap,
      position: 'bottom-right',
      description: 'Trends, memes, viral'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const getPositionClasses = (position: string) => {
    const baseClasses = "absolute w-28 h-28 md:w-36 md:h-36";
    switch (position) {
      case 'top-left': return `${baseClasses} top-0 left-0`;
      case 'top-right': return `${baseClasses} top-0 right-0`;
      case 'middle-left': return `${baseClasses} top-1/2 left-0 -translate-y-1/2`;
      case 'middle-right': return `${baseClasses} top-1/2 right-0 -translate-y-1/2`;
      case 'bottom-left': return `${baseClasses} bottom-0 left-0`;
      case 'bottom-right': return `${baseClasses} bottom-0 right-0`;
      default: return baseClasses;
    }
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-blue-100/30 to-indigo-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-green-100/20 to-emerald-200/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Não sabe o que postar?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubra o <strong>T.A.C.C.O.H.</strong> — o método estratégico que grandes marcas usam para criar conteúdo que realmente converte.
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-6 py-3 rounded-full border border-yellow-200">
            <Sparkles className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-orange-700">Cada peça resolve um problema específico</span>
          </div>
        </div>

        {/* Interactive Puzzle */}
        <div className="relative max-w-4xl mx-auto">
          <div className="relative h-80 md:h-96 mx-auto" style={{ width: 'min(600px, 90vw)' }}>
            {puzzlePieces.map((piece, index) => {
              const IconComponent = piece.icon;
              return (
                <div
                  key={piece.id}
                  className={`${getPositionClasses(piece.position)} cursor-pointer group transition-all duration-500 ${
                    animateIn ? 'animate-fade-in' : 'opacity-0'
                  }`}
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    transform: hoveredPiece === piece.id ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseEnter={() => setHoveredPiece(piece.id)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
                  <div className={`w-full h-full bg-gradient-to-br ${piece.color} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/20 backdrop-blur-sm`}>
                    <div className="flex flex-col items-center justify-center h-full p-4 text-white">
                      <IconComponent className="h-6 w-6 md:h-8 md:w-8 mb-2" />
                      <span className="text-2xl md:text-3xl font-bold mb-1">{piece.letter}</span>
                      <span className="text-xs md:text-sm font-medium text-center">{piece.title}</span>
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  {hoveredPiece === piece.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-20 animate-fade-in">
                      {piece.description}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Central connecting element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
              <Puzzle className="h-8 w-8 md:h-10 md:w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <p className="text-lg md:text-xl text-gray-700 mb-6 font-medium">
            Cada <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">T.A.C.C.O.H.</span> é uma peça estratégica que resolve um problema específico do seu conteúdo.
          </p>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Com essa metodologia exclusiva, transformamos marcas que "não sabem o que postar" em autoridades que geram engajamento e vendas consistentes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TaccohPuzzleHero;