import React from 'react';
import { Building, Users, Zap, CheckCircle, Shield, Wifi } from 'lucide-react';

interface OptimizedChecklistSectionProps {
  isVisible: boolean;
}

// Static data for better performance
const requirements = [
  {
    icon: Building,
    title: "Prédio residencial",
    desc: "Condomínio com pelo menos 20 unidades"
  },
  {
    icon: Users,
    title: "Elevador social",
    desc: "Elevador de uso comum dos moradores"
  },
  {
    icon: Zap,
    title: "Energia elétrica",
    desc: "Tomada 110V ou 220V próxima ao elevador"
  },
  {
    icon: Wifi,
    title: "Internet estável",
    desc: "WiFi com sinal no elevador"
  },
  {
    icon: Shield,
    title: "Autorização",
    desc: "Aprovação em assembleia ou administração"
  }
];

const OptimizedChecklistSection: React.FC<OptimizedChecklistSectionProps> = ({ isVisible }) => {
  return (
    <section className={`py-16 px-4 bg-gray-800/20 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Seu Prédio se Encaixa?
          </span>
        </h2>
        
        <p className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto">
          Verificque se seu condomínio atende aos requisitos para instalação gratuita
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {requirements.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                className="bg-gray-700/40 p-6 rounded-xl border border-purple-400/20 hover:border-purple-400/40 transition-colors group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Final message card */}
          <div className="md:col-span-2 lg:col-span-3">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-8 rounded-xl border border-purple-400/30">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Prédio Qualificado?</h3>
              <p className="text-gray-300">
                Preencha o formulário abaixo e nossa equipe fará a avaliação técnica gratuita
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OptimizedChecklistSection;