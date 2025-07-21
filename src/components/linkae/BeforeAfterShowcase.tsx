
import React, { useState } from 'react';
import { TrendingUp, Users, Heart, MessageCircle, Share2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const BeforeAfterShowcase: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const comparisons = [
    {
      id: 1,
      niche: 'Clínica Odontológica',
      before: {
        image: '🦷',
        title: 'Resultado final sem contexto',
        description: 'Apenas foto do sorriso pronto',
        metrics: { likes: 23, comments: 2, shares: 0, views: 156 },
        problems: ['Sem confiança', 'Parece caro', 'Não entendem o processo']
      },
      after: {
        image: '🦷',
        title: 'Processo completo (TÉCNICO)',
        description: 'Passo a passo do tratamento',
        metrics: { likes: 234, comments: 48, shares: 12, views: 2890 },
        benefits: ['Transparência total', 'Valor percebido', 'Confiança técnica']
      },
      improvement: '+340%'
    },
    {
      id: 2,
      niche: 'Personal Trainer',
      before: {
        image: '💪',
        title: 'Treino genérico',
        description: 'Exercícios sem explicação',
        metrics: { likes: 45, comments: 3, shares: 1, views: 234 },
        problems: ['Falta credibilidade', 'Não diferencia', 'Pouco engajamento']
      },
      after: {
        image: '💪',
        title: 'Autoridade + Educação',
        description: 'Certificações + transformações',
        metrics: { likes: 567, comments: 89, shares: 23, views: 4567 },
        benefits: ['Autoridade reconhecida', 'Ensino de qualidade', 'Prova social']
      },
      improvement: '+520%'
    },
    {
      id: 3,
      niche: 'Restaurante',
      before: {
        image: '🍝',
        title: 'Foto do prato',
        description: 'Apenas imagem da comida',
        metrics: { likes: 67, comments: 5, shares: 2, views: 345 },
        problems: ['Sem diferencial', 'Não gera conexão', 'Esquecível']
      },
      after: {
        image: '🍝',
        title: 'História familiar (CONEXÃO)',
        description: 'Receita da nonna + processo',
        metrics: { likes: 456, comments: 78, shares: 34, views: 3456 },
        benefits: ['Storytelling emocional', 'Receita exclusiva', 'Conexão familiar']
      },
      improvement: '+280%'
    },
    {
      id: 4,
      niche: 'E-commerce',
      before: {
        image: '🛍️',
        title: 'Produto isolado',
        description: 'Foto do produto sem contexto',
        metrics: { likes: 34, comments: 1, shares: 0, views: 189 },
        problems: ['Sem contexto de uso', 'Não resolve dúvidas', 'Baixa conversão']
      },
      after: {
        image: '🛍️',
        title: 'Resolvendo objeções',
        description: 'FAQ + demonstração de uso',
        metrics: { likes: 289, comments: 45, shares: 18, views: 2890 },
        benefits: ['Dúvidas antecipadas', 'Uso demonstrado', 'Conversão facilitada']
      },
      improvement: '+190%'
    }
  ];

  const currentComparison = comparisons[activeSlide];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % comparisons.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + comparisons.length) % comparisons.length);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Antes vs <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Depois</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Veja a transformação real de posts quando aplicamos a metodologia T.A.C.C.O.H.
          </p>
        </div>

        {/* Carousel Controls */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-gray-600 hover:text-blue-600"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="flex gap-2">
            {comparisons.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeSlide ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-gray-600 hover:text-blue-600"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Comparison Display */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-linkae-dark-blue to-linkae-royal-blue p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">{currentComparison.niche}</h3>
            <p className="text-linkae-cyan-light">Transformação com T.A.C.C.O.H.</p>
          </div>

          {/* Before/After Grid */}
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* ANTES */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold mb-4">
                  <span className="text-2xl">❌</span>
                  ANTES
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-4">{currentComparison.before.image}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {currentComparison.before.title}
                  </h4>
                  <p className="text-gray-600">{currentComparison.before.description}</p>
                </div>

                {/* Métricas Baixas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Heart className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{currentComparison.before.metrics.likes}</span>
                    </div>
                    <div className="text-xs text-gray-400">Curtidas</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{currentComparison.before.metrics.comments}</span>
                    </div>
                    <div className="text-xs text-gray-400">Comentários</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Share2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{currentComparison.before.metrics.shares}</span>
                    </div>
                    <div className="text-xs text-gray-400">Compartilhamentos</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{currentComparison.before.metrics.views}</span>
                    </div>
                    <div className="text-xs text-gray-400">Visualizações</div>
                  </div>
                </div>

                {/* Problemas */}
                <div className="space-y-2">
                  <h5 className="font-semibold text-red-600 text-sm">Problemas:</h5>
                  {currentComparison.before.problems.map((problem, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <span className="text-red-400">•</span>
                      {problem}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DEPOIS */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold mb-4">
                  <span className="text-2xl">✅</span>
                  DEPOIS
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-4">{currentComparison.after.image}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {currentComparison.after.title}
                  </h4>
                  <p className="text-gray-600">{currentComparison.after.description}</p>
                </div>

                {/* Métricas Altas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Heart className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-700">{currentComparison.after.metrics.likes}</span>
                    </div>
                    <div className="text-xs text-gray-500">Curtidas</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MessageCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-700">{currentComparison.after.metrics.comments}</span>
                    </div>
                    <div className="text-xs text-gray-500">Comentários</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Share2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-700">{currentComparison.after.metrics.shares}</span>
                    </div>
                    <div className="text-xs text-gray-500">Compartilhamentos</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-700">{currentComparison.after.metrics.views}</span>
                    </div>
                    <div className="text-xs text-gray-500">Visualizações</div>
                  </div>
                </div>

                {/* Benefícios */}
                <div className="space-y-2">
                  <h5 className="font-semibold text-green-600 text-sm">Benefícios:</h5>
                  {currentComparison.after.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-green-600">
                      <span className="text-green-400">•</span>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light p-8 text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white">
              <TrendingUp className="h-6 w-6" />
              <span className="text-lg font-semibold">Melhoria de</span>
              <span className="text-2xl font-bold">{currentComparison.improvement}</span>
              <span className="text-lg font-semibold">no engajamento</span>
            </div>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Cada post é uma oportunidade de <strong className="text-blue-600">conectar, educar e converter</strong>. 
            Com T.A.C.C.O.H., transformamos conteúdo comum em resultados extraordinários.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterShowcase;
