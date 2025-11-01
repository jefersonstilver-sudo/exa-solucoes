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
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          {/* Coluna Esquerda: Título */}
          <div className="md:col-span-4">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111] font-montserrat">
              Informações Corporativas
            </h2>
          </div>

          {/* Coluna Direita: Dados */}
          <div className="md:col-span-8 space-y-4 text-base md:text-lg font-inter leading-[1.8]">
            {dadosEmpresa.map((dado, index) => (
              <div key={index} className="flex flex-col md:flex-row md:gap-3">
                <span className="text-[#111111] font-semibold min-w-[140px]">
                  {dado.label}:
                </span>
                {dado.link ? (
                  <a 
                    href={dado.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C8102E] underline hover:no-underline transition-all"
                  >
                    {dado.value}
                  </a>
                ) : (
                  <span className="text-[#555555]">
                    {dado.value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default DadosInstitucionaisSection;
