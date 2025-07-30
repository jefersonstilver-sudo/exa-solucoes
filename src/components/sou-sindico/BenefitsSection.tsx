
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
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index}
                className="group bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:transform hover:scale-105"
              >
                <IconComponent className="w-8 h-8 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-300 text-sm">{benefit.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
