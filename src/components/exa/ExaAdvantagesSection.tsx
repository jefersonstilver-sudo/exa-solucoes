import React from 'react';
import { MapPin, Calendar, QrCode } from 'lucide-react';

const ExaAdvantagesSection: React.FC = () => {
  const comparison = [
    {
      feature: "Qualidade de imagem",
      traditional: "Baixa resolução, desbotamento",
      exa: "4K ultra HD, cores vibrantes",
      advantage: true
    },
    {
      feature: "Flexibilidade de conteúdo",
      traditional: "Impressão fixa por semanas",
      exa: "Atualização instantânea",
      advantage: true
    },
    {
      feature: "Custo de troca",
      traditional: "Alto (nova impressão)",
      exa: "Zero (digital)",
      advantage: true
    },
    {
      feature: "Mensuração de resultados",
      traditional: "Estimativas imprecisas",
      exa: "Analytics detalhados",
      advantage: true
    },
    {
      feature: "Segmentação de público",
      traditional: "Impossível",
      exa: "Horários e perfis específicos",
      advantage: true
    },
    {
      feature: "Impacto ambiental",
      traditional: "Papel, tintas, descarte",
      exa: "100% digital, sustentável",
      advantage: true
    }
  ];

  return (
    <section className="min-h-screen py-12 sm:py-16 lg:py-20 bg-slate-900 text-white flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8 leading-tight">
            Benefícios <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">Sensoriais EXA</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Experimente a diferença que a publicidade direcionada faz para todos os portes de negócio.
          </p>
        </div>

        <div className="flex items-center mb-12 sm:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-800/30 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-green-500/30 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:shadow-2xl group-hover:shadow-green-500/25">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-green-300">Anuncie em Locais Estratégicos</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                <strong className="text-green-200">Sinta o impacto imediato</strong> de seus anúncios em prédios residenciais e comerciais com alto fluxo de pessoas.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-800/30 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-blue-500/30 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:shadow-2xl group-hover:shadow-blue-500/25">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-300">Programação Flexível por Dias</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                <strong className="text-blue-200">Programe conteúdos por dias</strong> para segmentos variados: lanches na segunda, serviços na terça, lazer no fim de semana.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-800/30 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-purple-500/30 text-center group hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:shadow-2xl group-hover:shadow-purple-500/25">
                <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-purple-300">Mensuração Real com QR Codes</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                <strong className="text-purple-200">Acompanhe cada scan</strong> e veja como seus anúncios geram ação real, não apenas impressões.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-blue-500/20">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">85%</div>
            <div className="text-sm sm:text-base text-gray-300">Mais eficaz que outdoors tradicionais</div>
          </div>
          <div className="text-center bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-green-500/20">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">60%</div>
            <div className="text-sm sm:text-base text-gray-300">Redução no custo por impressão</div>
          </div>
          <div className="text-center bg-slate-800/30 p-4 sm:p-6 rounded-xl border border-purple-500/20">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-sm sm:text-base text-gray-300">Controle sobre sua campanha</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;