import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
const CredibilidadeSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const parceiros = [{
    name: 'Indexa Mídia',
    logo: '/placeholder.svg'
  }, {
    name: 'Secovi Paraná',
    logo: '/placeholder.svg'
  }, {
    name: 'Portal da Cidade',
    logo: '/placeholder.svg'
  }, {
    name: 'Condomínios Parceiros',
    logo: '/placeholder.svg'
  }];
  return (
    <ExaSection background="transparent" className="py-16">
      <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="font-montserrat font-bold text-3xl lg:text-4xl text-center mb-12 text-white">
          Credibilidade e Confiança
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
          {parceiros.map((parceiro, index) => (
            <div key={index} className="flex items-center justify-center p-6 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all">
              <span className="text-white/80 font-poppins text-sm">{parceiro.name}</span>
            </div>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};
export default CredibilidadeSection;