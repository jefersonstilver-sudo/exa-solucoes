import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Building2, FileText, MapPin, Globe, Instagram, MessageCircle, Mail } from 'lucide-react';

const dadosEmpresa = [
  {
    icon: Building2,
    label: 'Razão Social',
    value: 'EXA Soluções Digitais LTDA',
    link: null
  },
  {
    icon: FileText,
    label: 'CNPJ',
    value: '52.499.450/0001-60',
    link: null
  },
  {
    icon: MapPin,
    label: 'Endereço',
    value: 'Avenida Paraná, 974 – Sala 301, Centro, Foz do Iguaçu – PR, CEP 85852-000',
    link: null
  },
  {
    icon: Globe,
    label: 'Site',
    value: 'www.examidia.com.br',
    link: 'https://www.examidia.com.br'
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: '@exa.publicidade',
    link: 'https://www.instagram.com/exa.publicidade'
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '(45) 9 9141-5856',
    link: 'https://wa.me/554591415856'
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'contato@examidia.com.br',
    link: 'mailto:contato@examidia.com.br'
  }
];

const DadosInstitucionaisSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="transparent" className="py-16 md:py-24">
      <div 
        ref={ref}
        className={`max-w-4xl mx-auto transition-all duration-1000 delay-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-12 text-center font-montserrat">
          Informações Corporativas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dadosEmpresa.map((dado, index) => {
            const Icon = dado.icon;
            const content = (
              <div className="flex items-start gap-4 p-6 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-all duration-300 group">
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#C8102E]/10 group-hover:bg-[#C8102E]/20 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-[#C8102E]" strokeWidth={1.5} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111] mb-1 font-montserrat">
                    {dado.label}
                  </p>
                  <p className={`text-base font-inter ${dado.link ? 'text-[#C8102E] group-hover:underline' : 'text-[#555555]'}`}>
                    {dado.value}
                  </p>
                </div>
              </div>
            );

            if (dado.link) {
              return (
                <a
                  key={index}
                  href={dado.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {content}
                </a>
              );
            }

            return (
              <div key={index}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </ExaSection>
  );
};

export default DadosInstitucionaisSection;
