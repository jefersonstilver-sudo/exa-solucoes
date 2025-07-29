import React from 'react';
import { Zap, BarChart3, MapPin } from 'lucide-react';

const ExaFinalCTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Pronto para a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Revolução</span>?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12">
            Transforme sua publicidade com a tecnologia mais avançada do mercado. Resultados mensuráveis, impacto garantido.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Setup Rápido</h3>
            <p className="text-gray-300">Sua campanha no ar em 24h</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">ROI Garantido</h3>
            <p className="text-gray-300">Resultados 3x superiores</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Localização Premium</h3>
            <p className="text-gray-300">Pontos estratégicos da cidade</p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-600 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">
              Agende uma <span className="text-yellow-400">Reunião Gratuita</span>
            </h3>
            <p className="text-lg text-gray-300 mb-8">
              <strong>Para empresários de todos os portes:</strong> de pequenos lanches a grandes empresas. 
              Descubra a oportunidade imediata da publicidade direcionada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold px-8 py-4 rounded-full text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                🚀 Agendar Reunião Gratuita
              </button>
              <button className="border-2 border-yellow-400 text-yellow-400 font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-400 hover:text-black transition-all duration-300">
                📍 Ver Localizações Disponíveis
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
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