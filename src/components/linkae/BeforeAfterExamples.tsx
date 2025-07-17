
import React from 'react';
import { ArrowRight, TrendingUp, Heart, Users } from 'lucide-react';

interface ExampleData {
  id: string;
  business: string;
  tagline: string;
  before: {
    description: string;
    metrics: string;
  };
  after: {
    description: string;
    metrics: string;
  };
  improvement: string;
}

const examples: ExampleData[] = [
  {
    id: 'loja-roupas',
    business: 'Loja de Roupas',
    tagline: 'De vitrine online para experiência de marca',
    before: {
      description: 'Fotos básicas de produtos',
      metrics: '50 likes/post'
    },
    after: {
      description: 'Lifestyle + storytelling',
      metrics: '500+ likes/post'
    },
    improvement: '+900% engajamento'
  },
  {
    id: 'clinica-medica',
    business: 'Clínica Médica',
    tagline: 'De posts informativos para conexões que curam',
    before: {
      description: 'Texto formal e técnico',
      metrics: '10 comentários'
    },
    after: {
      description: 'Depoimentos + educativo',
      metrics: '150+ comentários'
    },
    improvement: '+1400% interação'
  },
  {
    id: 'evento',
    business: 'Evento/Festa',
    tagline: 'De convites chatos para experiências inesquecíveis',
    before: {
      description: 'Flyer simples tradicional',
      metrics: '20 compartilhamentos'
    },
    after: {
      description: 'Vídeo imersivo + urgência',
      metrics: '800+ compartilhamentos'
    },
    improvement: '+4000% alcance'
  },
  {
    id: 'restaurante',
    business: 'Restaurante',
    tagline: 'De cardápio digital para histórias que alimentam',
    before: {
      description: 'Fotos simples do prato',
      metrics: '80 likes/post'
    },
    after: {
      description: 'Processo + experiência',
      metrics: '1.2k+ likes/post'
    },
    improvement: '+1400% engajamento'
  },
  {
    id: 'academia',
    business: 'Academia',
    tagline: 'De equipamentos para transformações reais',
    before: {
      description: 'Fotos de equipamentos',
      metrics: '30 likes/post'
    },
    after: {
      description: 'Transformações + motivação',
      metrics: '600+ likes/post'
    },
    improvement: '+1900% engajamento'
  },
  {
    id: 'loja-online',
    business: 'Loja Online',
    tagline: 'De catálogo frio para comunidade engajada',
    before: {
      description: 'Catálogo básico',
      metrics: '100 vendas/mês'
    },
    after: {
      description: 'Unboxing + social proof',
      metrics: '800+ vendas/mês'
    },
    improvement: '+700% vendas'
  }
];

const BeforeAfterExamples: React.FC = () => {
  return (
    <section className="h-[60vh] bg-gradient-to-br from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue py-8 px-4 overflow-y-auto">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Veja a Transformação em Cada Nicho
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Mesmos negócios, estratégias diferentes, resultados extraordinários
          </p>
        </div>

        {/* Grid de Exemplos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
          {examples.map((example) => (
            <div
              key={example.id}
              className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              {/* Título do Negócio */}
              <div className="text-center mb-3">
                <h3 className="font-bold text-linkae-dark-blue text-sm">
                  {example.business}
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-tight">
                  {example.tagline}
                </p>
              </div>

              {/* Antes/Depois */}
              <div className="flex items-center justify-between mb-3 text-xs">
                {/* Antes */}
                <div className="flex-1 text-center">
                  <div className="bg-gray-100 rounded-lg p-2 mb-2 min-h-[60px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-500 font-medium">ANTES</div>
                      <div className="text-gray-600 text-xs mt-1">
                        {example.before.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {example.before.metrics}
                  </div>
                </div>

                {/* Seta */}
                <div className="mx-2 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-linkae-bright-blue" />
                </div>

                {/* Depois */}
                <div className="flex-1 text-center">
                  <div className="bg-gradient-to-br from-linkae-cyan-light to-linkae-bright-blue rounded-lg p-2 mb-2 min-h-[60px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-white font-medium">DEPOIS</div>
                      <div className="text-white/90 text-xs mt-1">
                        {example.after.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-linkae-bright-blue font-medium text-xs">
                    {example.after.metrics}
                  </div>
                </div>
              </div>

              {/* Melhoria */}
              <div className="text-center">
                <div className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {example.improvement}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <p className="text-white/90 mb-4 text-sm">
            Qual será a transformação do seu negócio?
          </p>
          <button className="bg-gradient-to-r from-linkae-cyan-light to-linkae-bright-blue text-white font-semibold px-6 py-3 rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center mx-auto space-x-2">
            <Heart className="w-4 h-4" />
            <span>Descobrir Meu Potencial</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterExamples;
