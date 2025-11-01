import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import portalCidadeLogo from '@/assets/partners/portal-cidade.png';
import secoviLogo from '@/assets/partners/secovi.png';
import dePaulaLogo from '@/assets/partners/de-paula.png';

const partners = [
  {
    logo: portalCidadeLogo,
    name: 'Portal da Cidade Foz do Iguaçu',
  },
  {
    logo: secoviLogo,
    name: 'Secovi Paraná',
  },
  {
    logo: dePaulaLogo,
    name: 'De Paula',
  },
];

const ParceriasSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="light" id="parcerias">
      <div 
        ref={ref}
        className={`space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-4">
          <h2 className="font-montserrat font-extrabold text-4xl lg:text-5xl text-exa-purple">
            Um Ecossistema que Cresce Junto
          </h2>
          <p className="font-poppins text-xl text-gray-600 max-w-3xl mx-auto">
            A EXA nasce de uma rede de parceiros que compartilham o mesmo propósito: profissionalizar e valorizar a comunicação urbana.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {partners.map((partner, index) => (
            <div key={index} className="bg-gradient-to-br from-exa-purple to-exa-blue rounded-xl p-10 flex items-center justify-center hover:scale-105 transition-transform duration-300 min-h-[140px]">
              <img 
                src={partner.logo} 
                alt={partner.name}
                className="max-h-24 max-w-[220px] w-auto h-auto object-contain filter brightness-0 invert"
              />
            </div>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default ParceriasSection;
