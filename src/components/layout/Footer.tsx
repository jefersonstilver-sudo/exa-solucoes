
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-indexa-purple-dark text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo e Descrição */}
          <div className="col-span-1">
            <div className="mb-4">
              <img 
                src="/lovable-uploads/262f3b00-af56-4493-b8f9-8214eb19bd6f.png" 
                alt="Indexa Logo" 
                className="h-12 mb-4"
              />
              <p className="text-sm text-gray-300 mt-5 pr-8">
                Transformando ideias em resultados através do marketing digital, produção audiovisual e publicidade inovadora.
              </p>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="col-span-1">
            <h3 className="text-lg font-medium mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 text-sm hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/servicos" className="text-gray-300 text-sm hover:text-white transition-colors">Serviços</Link></li>
              <li><Link to="/portfolio" className="text-gray-300 text-sm hover:text-white transition-colors">Portfolio</Link></li>
              <li><Link to="/blog" className="text-gray-300 text-sm hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/sobre-nos" className="text-gray-300 text-sm hover:text-white transition-colors">Sobre Nós</Link></li>
              <li><Link to="/contato" className="text-gray-300 text-sm hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div className="col-span-1">
            <h3 className="text-lg font-medium mb-4">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">(45) 99125-0093</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm">contato@indexamidia.com</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                <span className="text-sm">
                  Av. Paraná, 974 - Sala 301, And. 3 - Centro, Foz do Iguaçu - PR, 85852-000
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-lg font-medium mb-4">Newsletter</h3>
            <p className="text-sm text-gray-300 mb-4">
              Receba novidades e atualizações direto no seu e-mail.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="w-full px-4 py-2 bg-transparent border border-gray-600 rounded-full text-white text-sm placeholder-gray-400 focus:outline-none focus:border-indexa-mint"
              />
              <Button className="w-full rounded-full bg-indexa-mint text-indexa-purple-dark hover:bg-opacity-90">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          © 2025 Indexa Mídia. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
