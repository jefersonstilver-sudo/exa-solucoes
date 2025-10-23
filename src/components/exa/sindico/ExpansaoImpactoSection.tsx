import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { Building, TrendingUp, MapPin } from 'lucide-react';
const ExpansaoImpactoSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const count50 = useCounterAnimation(50, 2000, isVisible);
  const count100 = useCounterAnimation(100, 2000, isVisible);
  const milestones = [{
    icon: Building,
    value: count50,
    label: 'prédios conectados',
    year: 'primeira fase de implementação sendo concluída'
  }, {
    icon: TrendingUp,
    value: count100,
    label: 'prédios conectados',
    year: '2025'
  }, {
    icon: MapPin,
    value: '∞',
    label: 'prédios comerciais',
    year: '2026'
  }];
  
  return (
    <ExaSection background="dark" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
            Nossa expansão
          </h2>
          <p className="font-poppins text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
            Crescimento planejado para transformar a comunicação em condomínios
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            return (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-exa-purple/20 rounded-full mb-6">
                  <Icon className="w-8 h-8 text-exa-purple" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {typeof milestone.value === 'number' ? milestone.value : milestone.value}
                </div>
                <div className="text-base md:text-lg text-gray-300 mb-2">
                  {milestone.label}
                </div>
                <div className="text-sm text-exa-purple font-semibold">
                  {milestone.year}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ExaSection>
  );
};
export default ExpansaoImpactoSection;