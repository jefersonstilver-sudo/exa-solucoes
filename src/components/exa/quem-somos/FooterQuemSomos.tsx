import React from 'react';
import { Instagram, MessageCircle, Mail } from 'lucide-react';

const FooterQuemSomos = () => {
  const socialLinks = [
    {
      icon: Instagram,
      url: 'https://www.instagram.com/exa.publicidade',
      label: 'Instagram'
    },
    {
      icon: MessageCircle,
      url: 'https://wa.me/554591415856',
      label: 'WhatsApp'
    },
    {
      icon: Mail,
      url: 'mailto:contato@examidia.com.br',
      label: 'E-mail'
    }
  ];

  return (
    <div className="bg-[#C8102E] py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-8 lg:px-[10%] max-w-[1440px]">
        {/* Slogan */}
        <div className="text-center mb-8">
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-montserrat leading-relaxed">
            EXA — Publicidade Inteligente que conecta pessoas e informação.
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center items-center gap-6">
          {socialLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300">
                  <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FooterQuemSomos;
