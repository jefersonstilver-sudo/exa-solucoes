
import React, { useState } from 'react';
import { Store, Stethoscope, Calendar, UtensilsCrossed, Dumbbell, ShoppingCart, ArrowRight, TrendingUp, Users, Heart } from 'lucide-react';

const SegmentExamples: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const segments = [
    {
      id: 'loja-roupas',
      icon: Store,
      title: 'Loja de Roupas',
      pain: 'Posts repetitivos sem personalidade',
      solution: 'Variedade criativa que atrai e vende',
      beforeMetric: '12 curtidas',
      afterMetric: '247 curtidas',
      example: 'De fotos de produto básicas para lifestyle storytelling que mostra a peça sendo usada em momentos reais',
      color: 'from-pink-500 to-rose-600',
      accentColor: 'linkae-accent-pink'
    },
    {
      id: 'clinica',
      icon: Stethoscope,
      title: 'Clínica Médica',
      pain: 'Conteúdo técnico sem conexão',
      solution: 'Posts educativos que humanizam',
      beforeMetric: '8 engajamentos',
      afterMetric: '156 engajamentos',
      example: 'De posts informativos frios para depoimentos reais + conteúdo educativo que gera confiança',
      color: 'from-blue-500 to-cyan-600',
      accentColor: 'linkae-bright-blue'
    },
    {
      id: 'eventos',
      icon: Calendar,
      title: 'Eventos & Festas',
      pain: 'Convites chatos que não geram urgência',
      solution: 'Experiências inesquecíveis que vendem',
      beforeMetric: '23 visualizações',
      afterMetric: '1.2k visualizações',
      example: 'De flyers simples para vídeos imersivos com behind the scenes que criam expectativa',
      color: 'from-purple-500 to-violet-600',
      accentColor: 'linkae-royal-blue'
    },
    {
      id: 'restaurante',
      icon: UtensilsCrossed,
      title: 'Restaurante',
      pain: 'Fotos de pratos sem contexto',
      solution: 'Histórias que alimentam a alma',
      beforeMetric: '15 comentários',
      afterMetric: '89 comentários',
      example: 'De cardápio digital para processo culinário + histórias familiares que conectam emocionalmente',
      color: 'from-orange-500 to-red-600',
      accentColor: 'linkae-accent-orange'
    },
    {
      id: 'academia',
      icon: Dumbbell,
      title: 'Academia',
      pain: 'Posts de equipamentos sem motivação',
      solution: 'Transformações que inspiram ação',
      beforeMetric: '31 likes',
      afterMetric: '284 likes',
      example: 'De fotos de equipamentos para transformações reais + dicas motivacionais que engajam',
      color: 'from-green-500 to-emerald-600',
      accentColor: 'linkae-cyan-light'
    },
    {
      id: 'loja-online',
      icon: ShoppingCart,
      title: 'Loja Online',
      pain: 'Catálogo frio sem personalidade',
      solution: 'Comunidade engajada que compra',
      beforeMetric: '5 compartilhamentos',
      afterMetric: '67 compartilhamentos',
      example: 'De catálogo básico para unboxing experiences + social proof que gera desejo de compra',
      color: 'from-indigo-500 to-blue-600',
      accentColor: 'linkae-dark-blue'
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-linkae-accent-pink/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-linkae-accent-orange/10 to-transparent rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-linkae-accent-pink/10 to-linkae-accent-orange/10 text-linkae-dark-blue px-6 py-3 rounded-full text-sm font-medium mb-6 border border-linkae-accent-pink/20">
            <TrendingUp className="h-4 w-4" />
            <span>Transformações Reais por Segmento</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            Da <span className="text-gray-400">Dor</span> à{' '}
            <span className="bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange bg-clip-text text-transparent">
              Solução
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8">
            Veja como transformamos desafios específicos de cada tipo de negócio em estratégias que realmente funcionam
          </p>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-linkae-dark-blue/5 to-linkae-bright-blue/5 px-6 py-3 rounded-full border border-linkae-bright-blue/20">
            <Users className="h-5 w-5 text-linkae-bright-blue" />
            <span className="text-linkae-dark-blue font-medium">
              Cada negócio tem sua estratégia personalizada
            </span>
          </div>
        </div>

        {/* Grid de Exemplos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {segments.map((segment) => {
            const IconComponent = segment.icon;
            const isHovered = hoveredCard === segment.id;
            
            return (
              <div
                key={segment.id}
                className={`relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl ${
                  isHovered ? 'shadow-linkae-glow scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredCard(segment.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Header com Ícone */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${segment.color} flex items-center justify-center transform transition-transform duration-300 ${
                    isHovered ? 'scale-110 rotate-3' : ''
                  }`}>
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{segment.title}</h3>
                </div>

                {/* Problema → Solução */}
                <div className="space-y-6 mb-8">
                  <div className="relative">
                    <div className="text-sm text-red-600 font-medium mb-2 flex items-center gap-2">
                      😰 <span>Dor Comum:</span>
                    </div>
                    <p className="text-gray-700 font-medium bg-red-50 p-4 rounded-xl border border-red-100">
                      {segment.pain}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className={`h-6 w-6 text-${segment.accentColor} transition-transform duration-300 ${
                      isHovered ? 'scale-125' : ''
                    }`} />
                  </div>
                  
                  <div>
                    <div className="text-sm text-green-600 font-medium mb-2 flex items-center gap-2">
                      ✨ <span>Nossa Solução:</span>
                    </div>
                    <p className="text-gray-700 font-medium bg-green-50 p-4 rounded-xl border border-green-100">
                      {segment.solution}
                    </p>
                  </div>
                </div>

                {/* Métricas Antes/Depois */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Antes</div>
                    <div className="text-lg font-bold text-gray-600">{segment.beforeMetric}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-xs text-green-600 mb-1">Depois</div>
                    <div className="text-lg font-bold text-green-700">{segment.afterMetric}</div>
                  </div>
                </div>

                {/* Exemplo Prático */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-linkae-accent-pink" />
                    <span className="text-sm font-semibold text-gray-700">Exemplo Real:</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {segment.example}
                  </p>
                </div>

                {/* Hover Effect Overlay */}
                {isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-br from-linkae-accent-pink/5 to-linkae-accent-orange/5 rounded-3xl pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-linkae-dark-blue to-linkae-royal-blue p-12 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-linkae-accent-pink/20 to-linkae-accent-orange/20 animate-gradient-shift"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Qual é a <span className="text-linkae-accent-pink">Dor</span> do Seu Negócio?
              </h3>
              <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
                Cada segmento tem desafios únicos. Descobrimos qual é o seu e criamos a estratégia perfeita para transformar essa dor em oportunidade de crescimento.
              </p>
              
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all cursor-pointer hover:scale-105">
                <span>Descobrir Minha Estratégia Personalizada</span>
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SegmentExamples;
