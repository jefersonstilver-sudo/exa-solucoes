import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePageOptimization } from '@/hooks/usePageOptimization';
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
  const { shouldReduceMotion, animationDuration } = usePageOptimization();
  const { ref, isVisible } = useScrollReveal({ 
    threshold: 0.2, 
    reducedMotion: shouldReduceMotion 
  });

  return (
    <ExaSection background="light" paddingSize="md" lazyLoad>
      <div 
        ref={ref}
        className="max-w-[1200px] mx-auto"
        style={{
          transition: `all ${animationDuration}ms ease-out`,
          opacity: isVisible ? 1 : 0
        }}
      >
        <h2 className="text-responsive-h2 text-[#111111] font-montserrat mb-8 md:mb-12 text-tracking-tight">
          Informações Corporativas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {dadosEmpresa.map((dado, index) => {
            const IconComponent = dado.icon;
            const iconColors: { [key: string]: string } = {
              'Razão Social': 'text-[#C8102E]',
              'CNPJ': 'text-gray-600',
              'Endereço': 'text-[#C8102E]',
              'Site': 'text-blue-600',
              'Instagram': 'text-pink-500',
              'WhatsApp': 'text-green-500',
              'E-mail': 'text-blue-500'
            };

            return (
              <div 
                key={index} 
                className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start gap-3 md:gap-4 min-h-[80px] md:min-h-[100px]"
              >
                <div className="flex-shrink-0 pt-1">
                  <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${iconColors[dado.label]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-responsive-sm text-[#111111] font-semibold block mb-1 font-montserrat">
                    {dado.label}
                  </span>
                  {dado.link ? (
                    <a 
                      href={dado.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-responsive-body text-[#C8102E] hover:underline transition-all font-inter break-words"
                    >
                      {dado.value}
                    </a>
                  ) : (
                    <span className="text-responsive-body text-[#555555] font-inter break-words">
                      {dado.value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ExaSection>
  );
};

export default DadosInstitucionaisSection;
