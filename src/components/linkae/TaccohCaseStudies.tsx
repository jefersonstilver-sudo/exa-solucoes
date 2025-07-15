import React, { useState } from 'react';
import { Play, TrendingUp, Users, Heart, ShoppingCart, Star, ArrowRight } from 'lucide-react';

const TaccohCaseStudies: React.FC = () => {
  const [activeCase, setActiveCase] = useState(0);

  const caseStudies = [
    {
      id: 0,
      business: 'Clínica Odontológica',
      taccohUsed: ['T', 'A'],
      challenge: 'Pacientes não confiavam em tratamentos caros',
      solution: 'Técnico: Mostrou cada etapa dos procedimentos\nAutoridade: Destacou casos de sucesso e certificações',
      results: {
        engagement: '+340%',
        leads: '+180%',
        conversion: '+95%'
      },
      quote: '"Antes ninguém entendia o valor do tratamento. Agora eles chegam já convencidos."',
      author: 'Dr. Carlos Mendes',
      image: '🦷',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 1,
      business: 'Personal Trainer',
      taccohUsed: ['C', 'O'],
      challenge: 'Clientes achavam que academia era suficiente',
      solution: 'Crescimento: Dicas de treino que viralizaram\nObjeção: Explicou por que treino sozinho não funciona',
      results: {
        engagement: '+520%',
        leads: '+250%',
        conversion: '+150%'
      },
      quote: '"Minhas dicas no Instagram trouxeram mais clientes do que anos de panfletagem."',
      author: 'Marina Silva',
      image: '💪',
      color: 'from-green-400 to-emerald-600'
    },
    {
      id: 2,
      business: 'Restaurante Familiar',
      taccohUsed: ['C', 'H'],
      challenge: 'Concorria com franquias grandes',
      solution: 'Conexão: História da família e receitas tradicionais\nHype: Trends gastronômicas adaptadas ao cardápio',
      results: {
        engagement: '+280%',
        leads: '+190%',
        conversion: '+120%'
      },
      quote: '"Nossa história familiar conquistou mais clientes que qualquer promoção."',
      author: 'João Oliveira',
      image: '🍝',
      color: 'from-pink-400 to-rose-500'
    },
    {
      id: 3,
      business: 'Arquiteta',
      taccohUsed: ['T', 'A', 'O'],
      challenge: 'Clientes achavam arquitetura um luxo desnecessário',
      solution: 'Técnico: Processo de criação dos projetos\nAutoridade: Cases de valorização imobiliária\nObjeção: Por que não contratar é mais caro',
      results: {
        engagement: '+380%',
        leads: '+220%',
        conversion: '+160%'
      },
      quote: '"Mostrar o processo mudou completamente como me veem no mercado."',
      author: 'Ana Beatriz',
      image: '🏗️',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const currentCase = caseStudies[activeCase];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-linkae-dark-blue/5 to-linkae-royal-blue/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-linkae-dark-blue">
            Cases reais de <span className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent">T.A.C.C.O.H.</span>
          </h2>
          <p className="text-lg md:text-xl text-linkae-dark-blue/70 max-w-3xl mx-auto">
            Veja como negócios de diferentes nichos aplicaram nossa metodologia e transformaram suas redes sociais em máquinas de vendas.
          </p>
        </div>

        {/* Case Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {caseStudies.map((study, index) => (
            <button
              key={study.id}
              onClick={() => setActiveCase(index)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border-2 ${
                activeCase === index
                  ? `bg-gradient-to-r ${study.color} text-white border-transparent shadow-lg scale-105`
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <span className="text-2xl">{study.image}</span>
              <span className="font-semibold text-sm md:text-base">{study.business}</span>
            </button>
          ))}
        </div>

        {/* Active Case Study */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className={`bg-gradient-to-r ${currentCase.color} p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{currentCase.image}</span>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold">{currentCase.business}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm opacity-90">T.A.C.C.O.H. aplicado:</span>
                  {currentCase.taccohUsed.map((letter, index) => (
                    <span key={index} className="bg-white/20 px-2 py-1 rounded text-sm font-bold">
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                    🚫 Desafio inicial
                  </h4>
                  <p className="text-gray-700 bg-red-50 p-4 rounded-xl border border-red-100">
                    {currentCase.challenge}
                  </p>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                    ✅ Solução T.A.C.C.O.H.
                  </h4>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    {currentCase.solution.split('\n').map((line, index) => (
                      <p key={index} className="text-gray-700 mb-2 last:mb-0">
                        <strong>{line.split(':')[0]}:</strong> {line.split(':')[1]}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Play className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Depoimento do cliente</span>
                  </div>
                  <blockquote className="text-gray-700 italic mb-3">
                    {currentCase.quote}
                  </blockquote>
                  <cite className="text-sm text-gray-600 font-medium">— {currentCase.author}</cite>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  📊 Resultados em 90 dias
                </h4>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-800 font-medium">Engajamento</span>
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-900">{currentCase.results.engagement}</div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-800 font-medium">Novos Leads</span>
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-3xl font-bold text-green-900">{currentCase.results.leads}</div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-800 font-medium">Conversão em Vendas</span>
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-3xl font-bold text-purple-900">{currentCase.results.conversion}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Fator de sucesso</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    A combinação estratégica dos pilares T.A.C.C.O.H. permitiu atacar múltiplos pontos de dor do cliente, criando uma estratégia de conteúdo consistente e eficaz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-linkae-dark-blue to-linkae-royal-blue p-8 md:p-12 rounded-3xl text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Seu negócio pode ser o próximo case de sucesso
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">
              Cada negócio tem sua combinação ideal de T.A.C.C.O.H. Nossa equipe especializada identifica exatamente quais pilares sua marca precisa para gerar resultados similares.
            </p>
            <button className="bg-linkae-cyan-light text-linkae-dark-blue px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:bg-linkae-bright-blue hover:text-white transition-all inline-flex items-center gap-3 group">
              <span>Descobrir minha estratégia T.A.C.C.O.H.</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohCaseStudies;