import React from 'react';
import { Zap, BarChart3, MapPin } from 'lucide-react';

const ExaFinalCTASection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
            <span className="block sm:inline">Pronto para a </span><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Revolução</span>?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Transforme sua publicidade com a tecnologia mais avançada do mercado. Resultados mensuráveis, impacto garantido.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Setup Rápido</h3>
            <p className="text-sm sm:text-base text-gray-300">Sua campanha no ar em 24h</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">ROI Garantido</h3>
            <p className="text-sm sm:text-base text-gray-300">Resultados 3x superiores</p>
          </div>
          
          <div className="text-center sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Localização Premium</h3>
            <p className="text-sm sm:text-base text-gray-300">Pontos estratégicos da cidade</p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-slate-600 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">
              Agende uma <span className="text-yellow-400">Reunião Gratuita</span>
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-6 sm:mb-8 leading-relaxed">
              <strong>Para empresários de todos os portes:</strong> de pequenos lanches a grandes empresas. 
              Descubra a oportunidade imediata da publicidade direcionada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg sm:max-w-none mx-auto">
              <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                🚀 Agendar Reunião Gratuita
              </button>
              <button className="border-2 border-yellow-400 text-yellow-400 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg hover:bg-yellow-400 hover:text-black transition-all duration-300">
                📍 Ver Localizações Disponíveis
              </button>
            </div>
            
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                ⚡ Consultoria gratuita • 📈 Sem compromisso • 🎯 Resultados garantidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;