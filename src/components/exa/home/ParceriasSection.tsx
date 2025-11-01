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
    description: 'Conteúdo local e visibilidade cruzada',
  },
  {
    logo: secoviLogo,
    name: 'Secovi Paraná',
    description: 'Apoio institucional no setor condominial',
  },
  {
    logo: dePaulaLogo,
    name: 'De Paula',
    description: 'Parceiro estratégico no mercado imobiliário',
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
            <ExaCard key={index} variant="light" className="text-center p-8">
              <div className="flex items-center justify-center mb-6 min-h-[100px]">
                <img 
                  src={partner.logo} 
                  alt={partner.name}
                  className="max-h-20 max-w-[200px] w-auto h-auto object-contain"
                />
              </div>
              <h3 className="font-montserrat font-semibold text-lg text-exa-black mb-2">
                {partner.name}
              </h3>
              <p className="font-poppins text-gray-600 text-sm">
                {partner.description}
              </p>
            </ExaCard>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default ParceriasSection;
