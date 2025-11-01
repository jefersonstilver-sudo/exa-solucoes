import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import portalCidadeLogo from '@/assets/partners/portal-cidade.png';
import secoviLogo from '@/assets/partners/secovi.png';
import dePaulaLogo from '@/assets/partners/de-paula.png';

const CredibilidadeSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const parceiros = [{
    name: 'Portal da Cidade Foz do Iguaçu',
    logo: portalCidadeLogo
  }, {
    name: 'Secovi Paraná',
    logo: secoviLogo
  }, {
    name: 'De Paula',
    logo: dePaulaLogo
  }];
  return (
    <ExaSection background="transparent" className="py-16">
      <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="font-montserrat font-bold text-2xl md:text-3xl lg:text-4xl text-center mb-12 text-white">
          Credibilidade e Confiança
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center justify-items-center max-w-4xl mx-auto">
          {parceiros.map((parceiro, index) => (
            <div key={index} className="flex items-center justify-center p-8 bg-white/5 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300 w-full min-h-[120px]">
              <img 
                src={parceiro.logo} 
                alt={parceiro.name} 
                className="max-h-20 max-w-[180px] w-auto h-auto object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};
export default CredibilidadeSection;