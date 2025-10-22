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
    <ExaSection background="transparent" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-12">
          <h2 className="font-montserrat font-bold text-4xl lg:text-5xl text-exa-purple">
            Confiança e credibilidade
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-center">
            {parceiros.map((parceiro, index) => (
              <div key={index} className="flex items-center justify-center p-6">
                <img 
                  src={parceiro.logo} 
                  alt={parceiro.name}
                  className="max-h-16 w-auto opacity-60 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ExaSection>
  );
};
export default CredibilidadeSection;