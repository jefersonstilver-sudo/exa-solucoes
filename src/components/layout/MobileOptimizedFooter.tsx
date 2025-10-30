import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedLogo from '@/components/layout/UnifiedLogo';
interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  children,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return <div className="border-b border-white/20 last:border-b-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-white/5 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <motion.div animate={{
        rotate: isOpen ? 180 : 0
      }} transition={{
        duration: 0.2
      }}>
          <ChevronDown className="h-5 w-5 text-white/80" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: "auto",
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.3,
        ease: "easeInOut"
      }} className="overflow-hidden">
            <div className="pb-4 px-1">
              {children}
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
};
const MobileOptimizedFooter = () => {
  const location = useLocation();
  const isExaPage = location.pathname === '/exa';
  const logoUrl = isExaPage ? 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1MzkyNDY3NywiZXhwIjoxNzg1NDYwNjc3fQ.Obullg6SYYcT2j1mmJgZ4MIL-_9lqNDHmImhft_ZbmM' : undefined;
  const brandText = isExaPage ? 'EXA' : 'INDEXA';
  console.log('🦶 Footer: Renderizando MobileOptimizedFooter ÚNICO - PREVENINDO DUPLICAÇÃO');
  return <footer id="unique-indexa-footer" className="bg-exa-purple-dark text-white w-full relative" data-footer-debug="single-footer">
      <div className="container mx-auto px-4 lg:px-6">
        
        {/* Desktop Layout - 3 columns */}
        <div className="hidden md:block py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
                
                
                <li><Link to="/exa" className="text-white/80 text-base hover:text-white transition-colors">EXA</Link></li>
                <li><Link to="/sou-sindico" className="text-white/80 text-base hover:text-white transition-colors">Sou Síndico</Link></li>
              </ul>
            </div>

            {/* Contato */}
            <div className="col-span-1">
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-white/80" />
                  <a href="https://wa.me/554591071566?text=Ol%C3%A1%20quero%20informa%C3%A7%C3%B5es%20sobre%20um%20projeto%20de%20v%C3%ADdeo" target="_blank" rel="noopener noreferrer" className="text-base text-white/80 hover:text-white transition-colors">
                    +55 45 9107-1566
                  </a>
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-white/80" />
                  <span className="text-base text-white/80">comercial@indexamidia.com.br</span>
                </li>
                <li className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-white/80" />
                  <span className="text-base text-white/80">
                    Av. Paraná, 974 - Sala 301, And. 3 - Centro, Foz do Iguaçu - PR, 85852-000
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Accordion Style */}
        <div className="md:hidden py-8">
          {/* Mobile Logo Section */}
          <div className="text-center mb-8 pb-6 border-b border-white/20">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <UnifiedLogo size="custom" linkTo="/" variant="light" className="w-10 h-10" logoUrl={logoUrl} />
              
            </div>
            <p className="text-white/80 text-sm leading-relaxed px-4">
              Transformando ideias em resultados através do marketing digital, produção audiovisual e publicidade inovadora.
            </p>
          </div>

          {/* Mobile Accordion Sections */}
          <div className="space-y-0">
            <AccordionSection title="Links Rápidos" defaultOpen={true}>
              <ul className="space-y-3">
                <li><Link to="/" className="block text-white/80 hover:text-exa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Home</Link></li>
                <li><Link to="/linkae" className="block text-white/80 hover:text-exa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">LINKAÊ</Link></li>
                <li><Link to="/produtora" className="block text-white/80 hover:text-exa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Produtora</Link></li>
                <li><Link to="/exa" className="block text-white/80 hover:text-exa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">EXA</Link></li>
                <li><Link to="/sou-sindico" className="block text-white/80 hover:text-exa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Sou Síndico</Link></li>
              </ul>
            </AccordionSection>

            <AccordionSection title="Contato">
              <div className="space-y-4">
                <a href="https://wa.me/554591071566?text=Ol%C3%A1%20quero%20informa%C3%A7%C3%B5es%20sobre%20um%20projeto%20de%20v%C3%ADdeo" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 bg-exa-mint/20 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-exa-mint" />
                  </div>
                  <span className="text-white/90">(45) 9107-1566</span>
                </a>
                
                <a href="mailto:comercial@indexamidia.com.br" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 bg-exa-mint/20 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-exa-mint" />
                  </div>
                  <span className="text-white/90 text-sm">comercial@indexamidia.com.br</span>
                </a>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg">
                  <div className="w-8 h-8 bg-exa-mint/20 rounded-full flex items-center justify-center mt-0.5">
                    <MapPin className="h-4 w-4 text-exa-mint" />
                  </div>
                  <span className="text-white/90 text-sm leading-relaxed">
                    Av. Paraná, 974 - Sala 301, And. 3 - Centro, Foz do Iguaçu - PR, 85852-000
                  </span>
                </div>
              </div>
            </AccordionSection>
          </div>
        </div>

        {/* Copyright - Same for both desktop and mobile */}
        <div className="border-t border-white/20 pt-6 pb-6">
          <div className="text-center text-white/80">
            <p className="text-sm">
              © 2025 Indexa Mídia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>;
};
export default MobileOptimizedFooter;