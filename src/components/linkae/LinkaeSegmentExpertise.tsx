
import React from 'react';
import { Store, Dumbbell, ShoppingCart, Stethoscope, UtensilsCrossed, Calendar, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const LinkaeSegmentExpertise = () => {
  const segments = [
    {
      icon: Store,
      title: 'Lojas Físicas',
      problem: 'Posts repetitivos que não atraem clientes',
      solution: 'Variedade criativa que gera desejo de compra',
      taccoLetters: ['T', 'H'],
      example: 'Looks do dia + trends do momento',
      color: 'from-blue-500 to-purple-500'
    },
    {
      icon: Dumbbell,
      title: 'Academias',
      problem: 'Baixo engajamento e motivação dos seguidores',
      solution: 'Posts interativos que inspiram transformação',
      taccoLetters: ['C', 'C'],
      example: 'Antes/depois + histórias reais',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: ShoppingCart,
      title: 'Lojas Online',
      problem: 'Não sei como mostrar produtos digitalmente',
      solution: 'Narrativas visuais que convertem',
      taccoLetters: ['T', 'O'],
      example: 'Unboxing + social proof',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Stethoscope,
      title: 'Clínicas/Saúde',
      problem: 'Comunicação formal que não conecta',
      solution: 'Conteúdo educativo e humanizado',
      taccoLetters: ['A', 'C'],
      example: 'Dicas de saúde + histórias pessoais',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: UtensilsCrossed,
      title: 'Restaurantes',
      problem: 'Pouco alcance e engajamento',
      solution: 'Campanhas visuais apetitosas e interativas',
      taccoLetters: ['H', 'T'],
      example: 'Processo de preparo + trends gastronômicos',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Calendar,
      title: 'Eventos',
      problem: 'Dificuldade em criar expectativa',
      solution: 'Narrativas que geram urgência e desejo',
      taccoLetters: ['A', 'H'],
      example: 'Bastidores + countdown interativo',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const taccoColors = {
    T: 'bg-linkae-bright-blue text-white',
    A: 'bg-linkae-cyan-light text-white',
    C: 'bg-gradient-to-r from-linkae-dark-blue to-linkae-royal-blue text-white',
    O: 'bg-pink-500 text-white',
    H: 'bg-orange-500 text-white'
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-linkae-bright-blue rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-28 h-28 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="block">Linkae: Especialistas em</span>
            <span className="bg-gradient-to-r from-linkae-dark-blue via-linkae-bright-blue to-pink-500 bg-clip-text text-transparent">
              Marketing que Transforma
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Não somos apenas social media. Somos estratégia, planejamento e resultados aplicados ao seu segmento específico.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {segments.map((segment, index) => (
            <div
              key={segment.title}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon & Title */}
              <div className="flex items-center mb-6">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${segment.color} group-hover:scale-110 transition-transform duration-300`}>
                  <segment.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 ml-4">{segment.title}</h3>
              </div>

              {/* Problem */}
              <div className="mb-4">
                <div className="flex items-start space-x-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 font-medium">Dor comum:</p>
                </div>
                <p className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                  "{segment.problem}"
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-linkae-bright-blue animate-bounce" />
              </div>

              {/* Solution */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 font-medium">Nossa solução:</p>
                </div>
                <p className="text-green-600 bg-green-50 p-3 rounded-lg text-sm font-medium">
                  {segment.solution}
                </p>
              </div>

              {/* T.A.C.C.O.H. Method */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Método T.A.C.C.O.H. aplicado:</p>
                <div className="flex space-x-2">
                  {segment.taccoLetters.map((letter, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${taccoColors[letter]} animate-pulse-soft`}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              </div>

              {/* Example */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-1">Exemplo prático:</p>
                <p className="text-sm text-gray-700 italic">"{segment.example}"</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reinforcement Message */}
        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-linkae-dark-blue via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Cada segmento, uma estratégia única com resultado real.
            </span>
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            O método T.A.C.C.O.H. se adapta às necessidades específicas do seu negócio, 
            criando uma abordagem personalizada que realmente funciona.
          </p>
          <button className="bg-gradient-to-r from-linkae-bright-blue to-pink-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center mx-auto space-x-2">
            <span>Descobrir Minha Estratégia</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default LinkaeSegmentExpertise;
