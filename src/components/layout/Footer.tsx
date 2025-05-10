
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-indexa-purple-dark text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo e Descrição */}
          <div className="col-span-1">
            <div className="mb-4">
              <p className="text-base text-white/80 mt-5 pr-8">
                Transformando ideias em resultados através do marketing digital, produção audiovisual e publicidade inovadora.
              </p>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-white/80 text-base hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/servicos" className="text-white/80 text-base hover:text-white transition-colors">Serviços</Link></li>
              <li><Link to="/portfolio" className="text-white/80 text-base hover:text-white transition-colors">Portfolio</Link></li>
              <li><Link to="/blog" className="text-white/80 text-base hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/sobre-nos" className="text-white/80 text-base hover:text-white transition-colors">Sobre Nós</Link></li>
              <li><Link to="/contato" className="text-white/80 text-base hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-white/80" />
                <span className="text-base text-white/80">(45) 99125-0093</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-white/80" />
                <span className="text-base text-white/80">contato@indexamidia.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 text-white/80" />
                <span className="text-base text-white/80">
                  Av. Paraná, 974 - Sala 301, And. 3 - Centro, Foz do Iguaçu - PR, 85852-000
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-base text-white/80 mb-4">
              Receba novidades e atualizações direto no seu e-mail.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="w-full px-4 py-2 bg-transparent border border-gray-600 rounded-full text-white text-base placeholder-gray-400 focus:outline-none focus:border-indexa-mint"
              />
              <Button className="w-full rounded-full bg-indexa-mint text-indexa-purple-dark hover:bg-opacity-90 text-base font-medium">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700 text-center text-base text-white/80">
          © 2025 Indexa Mídia. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
