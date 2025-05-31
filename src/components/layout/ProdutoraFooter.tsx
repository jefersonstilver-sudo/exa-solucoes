
import React from 'react';
import { Instagram, Youtube, MessageSquare, MapPin } from 'lucide-react';

const ProdutoraFooter = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      icon: Instagram,
      href: 'https://instagram.com/indexaoficial',
      label: 'Instagram'
    },
    {
      icon: Youtube,
      href: 'https://youtube.com/@indexaoficial',
      label: 'YouTube'
    },
    {
      icon: MessageSquare,
      href: 'https://wa.me/5545991250093',
      label: 'WhatsApp'
    },
    {
      icon: MapPin,
      href: 'https://maps.google.com/?q=Indexa+Foz+do+Iguaçu',
      label: 'Localização'
    }
  ];

  return (
    <footer className="bg-gradient-to-r from-indexa-purple-dark to-indexa-purple py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indexa-mint to-white rounded-lg flex items-center justify-center">
                <span className="text-indexa-purple font-bold text-xl">I</span>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">INDEXA</h3>
                <p className="text-indexa-mint text-sm">Produtora</p>
              </div>
            </div>
          </div>

          {/* Links sociais */}
          <div className="flex justify-center space-x-6 mb-8">
            {socialLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                  aria-label={link.label}
                >
                  <IconComponent className="w-5 h-5" />
                </a>
              );
            })}
          </div>

          {/* Informações de contato */}
          <div className="text-white/80 text-sm mb-6 space-y-2">
            <p>Foz do Iguaçu - PR</p>
            <p>WhatsApp: (45) 99125-0093</p>
          </div>

          {/* Direitos autorais */}
          <div className="border-t border-white/20 pt-6">
            <p className="text-white/60 text-sm">
              © {currentYear} Indexa Produtora. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ProdutoraFooter;
