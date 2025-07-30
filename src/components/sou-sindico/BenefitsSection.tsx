
import React from 'react';
import { Benefit } from './types';

interface BenefitsSectionProps {
  isVisible: boolean;
  benefits: Benefit[];
}

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ isVisible, benefits }) => {
  return (
    <section className={`min-h-[80vh] py-20 px-4 bg-gray-800/30 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Resolva a Dor de Comunicação Ineficiente
          </span>
        </h2>
        
        <p className="text-xl text-center text-gray-300 mb-16 max-w-4xl mx-auto">
          <strong>Sinta a diferença no dia a dia</strong> com uma ferramenta gratuita que engaja moradores e moderniza seu condomínio. Altere módulos ou crie avisos 3D personalizados via chat simples, transformando desafios em conexões eficientes.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            
            return (
              <div
                key={index}
                className={`group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-purple-400/50 transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-purple-400/20 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-blue-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-blue-400/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors duration-300">
                  {benefit.title}
                </h3>
                
                <p className="text-white/80 leading-relaxed group-hover:text-white transition-colors duration-300">
                  {benefit.desc}
                </p>

                <div className="mt-6 w-12 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
