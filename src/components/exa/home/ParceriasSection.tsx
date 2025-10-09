import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Code, Building, Newspaper, Home } from 'lucide-react';

const partners = [
  {
    icon: Code,
    name: 'Indexa Mídia',
    description: 'Desenvolvimento tecnológico e integração digital',
  },
  {
    icon: Building,
    name: 'Secovi Paraná',
    description: 'Apoio institucional no setor condominial',
  },
  {
    icon: Newspaper,
    name: 'Portal da Cidade',
    description: 'Conteúdo local e visibilidade cruzada',
  },
  {
    icon: Home,
    name: 'Condomínios Parceiros',
    description: 'Base estrutural e legitimidade',
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {partners.map((partner, index) => (
            <ExaCard key={index} variant="light" className="text-center">
              <partner.icon className="w-12 h-12 text-exa-purple mx-auto mb-4" />
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
