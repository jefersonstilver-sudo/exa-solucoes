
import React from 'react';
import { Calendar, BarChart3, CheckCircle } from 'lucide-react';

const LinkaeAdvantagesGrid: React.FC = () => {
  const planningFeatures = [
    'Calendário editorial mensal completo',
    'Conteúdos específicos para seu nicho',
    'Posts que conectam com sua audiência',
    'Estratégia semanal pré-definida'
  ];

  const analyticsFeatures = [
    'Taxa de conversão de seguidores em clientes',
    'Análise de engajamento qualitativo',
    'ROI mensal detalhado',
    'Insights acionáveis para crescimento'
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-linkae-dark-blue/5 to-linkae-royal-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-linkae-dark-blue">
            Nossos <span className="text-linkae-bright-blue">Diferenciais</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Solucionamos as duas maiores dores dos empreendedores nas redes sociais
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Planejamento Card */}
          <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden hover:transform hover:scale-[1.02] flex flex-col">
            {/* Header com gradiente azul */}
            <div className="bg-gradient-to-r from-linkae-bright-blue to-linkae-royal-blue p-4 md:p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">Nunca mais fique sem saber o que postar</h3>
                <p className="text-sm opacity-90">Planejamento personalizado que resolve a dor nº1 dos empreendedores</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              <div className="space-y-3 md:space-y-4 flex-1">
                {planningFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 rounded-xl">
                <p className="text-blue-700 font-semibold text-sm text-center">
                  30 posts prontos por mês • Nunca mais bloquear criativo
                </p>
              </div>
            </div>
          </div>

          {/* Relatórios Card */}
          <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden hover:transform hover:scale-[1.02] flex flex-col">
            {/* Header com gradiente verde */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 md:p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">Meça conexões reais, não apenas números</h3>
                <p className="text-sm opacity-90">Relatórios analíticos que mostram o impacto das suas conexões</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 flex-1 flex flex-col">
              <div className="space-y-3 md:space-y-4 flex-1">
                {analyticsFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-green-50 rounded-xl">
                <p className="text-green-700 font-semibold text-sm text-center">
                  ROI tracking completo • Decisões baseadas em dados
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 max-w-2xl mx-auto">
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              Quer ver como funciona na prática?
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 md:px-4 py-2 rounded-full text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Calendário de exemplo</span>
              </div>
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 md:px-4 py-2 rounded-full text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="font-semibold">Relatório modelo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeAdvantagesGrid;
