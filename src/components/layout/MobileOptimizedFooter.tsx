import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="border-b border-white/20 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-1 text-left hover:bg-white/5 transition-colors duration-200"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-white/80" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileOptimizedFooter = () => {
  console.log('🦶 Footer: Renderizando MobileOptimizedFooter ÚNICO');
  
  return (
    <footer 
      id="unique-indexa-footer" 
      className="bg-indexa-purple-dark text-white w-full"
      style={{ 
        position: 'relative',
        zIndex: 10,
        display: 'block'
      }}
      data-footer-debug="single-footer"
    >
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
                <li><Link to="/marketing" className="text-white/80 text-base hover:text-white transition-colors">Marketing</Link></li>
                <li><Link to="/produtora" className="text-white/80 text-base hover:text-white transition-colors">Produtora</Link></li>
                <li><Link to="/paineis-publicitarios" className="text-white/80 text-base hover:text-white transition-colors">Painéis Digitais</Link></li>
                <li><Link to="/sou-sindico" className="text-white/80 text-base hover:text-white transition-colors">Sou Síndico</Link></li>
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
          </div>
        </div>

        {/* Mobile Layout - Accordion Style */}
        <div className="md:hidden py-8">
          {/* Mobile Logo Section */}
          <div className="text-center mb-8 pb-6 border-b border-white/20">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                  alt="Indexa Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">INDEXA</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed px-4">
              Transformando ideias em resultados através do marketing digital, produção audiovisual e publicidade inovadora.
            </p>
          </div>

          {/* Mobile Accordion Sections */}
          <div className="space-y-0">
            <AccordionSection title="Links Rápidos" defaultOpen={true}>
              <ul className="space-y-3">
                <li><Link to="/" className="block text-white/80 hover:text-indexa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Home</Link></li>
                <li><Link to="/marketing" className="block text-white/80 hover:text-indexa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Marketing</Link></li>
                <li><Link to="/produtora" className="block text-white/80 hover:text-indexa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Produtora</Link></li>
                <li><Link to="/paineis-publicitarios" className="block text-white/80 hover:text-indexa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Painéis Digitais</Link></li>
                <li><Link to="/sou-sindico" className="block text-white/80 hover:text-indexa-mint transition-colors py-2 px-3 rounded-lg hover:bg-white/5">Sou Síndico</Link></li>
              </ul>
            </AccordionSection>

            <AccordionSection title="Contato">
              <div className="space-y-4">
                <a 
                  href="tel:+5545991250093"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 bg-indexa-mint/20 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-indexa-mint" />
                  </div>
                  <span className="text-white/90">(45) 99125-0093</span>
                </a>
                
                <a 
                  href="mailto:contato@indexamidia.com"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 bg-indexa-mint/20 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-indexa-mint" />
                  </div>
                  <span className="text-white/90 text-sm">contato@indexamidia.com</span>
                </a>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg">
                  <div className="w-8 h-8 bg-indexa-mint/20 rounded-full flex items-center justify-center mt-0.5">
                    <MapPin className="h-4 w-4 text-indexa-mint" />
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
    </footer>
  );
};

export default MobileOptimizedFooter;
