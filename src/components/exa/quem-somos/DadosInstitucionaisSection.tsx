import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Building2, FileText, MapPin, Globe, Instagram, MessageCircle, Mail, Loader2 } from 'lucide-react';

const DadosInstitucionaisSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);
  const { settings, loading } = useCompanySettings();

  // Dados dinâmicos da empresa vindos do banco de dados
  const dadosEmpresa = [
    {
      icon: Building2,
      label: 'Razão Social',
      value: settings.razao_social,
      link: null
    },
    {
      icon: FileText,
      label: 'CNPJ',
      value: settings.cnpj,
      link: null
    },
    {
      icon: MapPin,
      label: 'Endereço',
      value: settings.endereco_completo,
      link: null
    },
    {
      icon: Globe,
      label: 'Site',
      value: settings.website?.replace('https://', '').replace('http://', '') || 'www.examidia.com.br',
      link: settings.website || 'https://www.examidia.com.br'
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: settings.instagram || '@exa.publicidade',
      link: `https://www.instagram.com/${(settings.instagram || '@exa.publicidade').replace('@', '')}`
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: settings.whatsapp_comercial || settings.telefone_principal || '(45) 9 9141-5856',
      link: `https://wa.me/55${(settings.whatsapp_comercial || settings.telefone_principal || '').replace(/\D/g, '')}`
    },
    {
      icon: Mail,
      label: 'E-mail',
      value: settings.email_institucional || 'contato@examidia.com.br',
      link: `mailto:${settings.email_institucional || 'contato@examidia.com.br'}`
    }
  ];

  const iconColors: { [key: string]: string } = {
    'Razão Social': 'text-[#C8102E]',
    'CNPJ': 'text-gray-600',
    'Endereço': 'text-[#C8102E]',
    'Site': 'text-blue-600',
    'Instagram': 'text-pink-500',
    'WhatsApp': 'text-green-500',
    'E-mail': 'text-blue-500'
  };

  if (loading) {
    return (
      <ExaSection background="light" className="py-10 md:py-16 lg:py-24">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C8102E]" />
        </div>
      </ExaSection>
    );
  }

  return (
    <ExaSection background="light" className="py-10 md:py-16 lg:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 px-4 md:px-6 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-[#111111] font-montserrat mb-6 md:mb-12">
          Informações Corporativas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {dadosEmpresa.map((dado, index) => {
            const IconComponent = dado.icon;

            return (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex items-start gap-4"
              >
                <div className="flex-shrink-0">
                  <IconComponent className={`w-6 h-6 ${iconColors[dado.label]}`} />
                </div>
                <div className="flex-1">
                  <span className="text-[#111111] font-semibold block mb-1 font-montserrat">
                    {dado.label}
                  </span>
                  {dado.link ? (
                    <a 
                      href={dado.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C8102E] hover:underline transition-all font-inter"
                    >
                      {dado.value}
                    </a>
                  ) : (
                    <span className="text-[#555555] font-inter">
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
