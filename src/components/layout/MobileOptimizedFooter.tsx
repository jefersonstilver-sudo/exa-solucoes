
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

const MobileOptimizedFooter = () => {
  return (
    <footer className="bg-indexa-purple-dark text-white">
      <div className="container mx-auto px-4 lg:px-6">
        
        {/* Desktop Layout - 3 colunas apenas */}
        <div className="hidden md:block py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo e Descrição */}
            <div className="col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img 
                    src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                    alt="Indexa Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-lg font-bold">INDEXA</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                Transformando ideias em resultados através do marketing digital, produção audiovisual e publicidade inovadora.
              </p>
            </div>

            {/* Links Rápidos */}
            <div className="col-span-1">
              <h3 className="text-base font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-white/80 text-sm hover:text-indexa-mint transition-colors">Home</Link></li>
                <li><Link to="/marketing" className="text-white/80 text-sm hover:text-indexa-mint transition-colors">Marketing</Link></li>
                <li><Link to="/produtora" className="text-white/80 text-sm hover:text-indexa-mint transition-colors">Produtora</Link></li>
                <li><Link to="/paineis-publicitarios" className="text-white/80 text-sm hover:text-indexa-mint transition-colors">Painéis Digitais</Link></li>
                <li><Link to="/sou-sindico" className="text-white/80 text-sm hover:text-indexa-mint transition-colors">Sou Síndico</Link></li>
                <li><Link to="/paineis-digitais/loja" className="text-white/80 text-sm hover:text-indexa-mint transition-colors">Loja Online</Link></li>
              </ul>
            </div>

            {/* Contato */}
            <div className="col-span-1">
              <h3 className="text-base font-semibold mb-4">Contato</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-indexa-mint" />
                  <span className="text-sm text-white/80">(45) 99125-0093</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-indexa-mint" />
                  <span className="text-sm text-white/80">contato@indexamidia.com</span>
                </li>
                <li className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 text-indexa-mint" />
                  <span className="text-sm text-white/80">
                    Foz do Iguaçu - PR
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Simplificado */}
        <div className="md:hidden py-6">
          {/* Mobile Logo Section */}
          <div className="text-center mb-6 pb-4 border-b border-white/20">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Indexa%20-%20Logo%201%20copiar%20(1).png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0luZGV4YSAtIExvZ28gMSBjb3BpYXIgKDEpLnBuZyIsImlhdCI6MTc0ODE4MzEwMCwiZXhwIjoxNzc5NzE5MTAwfQ.4zNgnq7JOM1S9kwOx3jhOBRIk0RNwP2hPT4eUfQrUA4"
                  alt="Indexa Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold">INDEXA</span>
            </div>
            <p className="text-white/80 text-xs leading-relaxed px-4">
              Marketing digital, produção audiovisual e publicidade inovadora.
            </p>
          </div>

          {/* Mobile Links */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 text-indexa-mint">Navegação</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="block text-white/80 text-xs hover:text-indexa-mint transition-colors">Home</Link></li>
                <li><Link to="/marketing" className="block text-white/80 text-xs hover:text-indexa-mint transition-colors">Marketing</Link></li>
                <li><Link to="/produtora" className="block text-white/80 text-xs hover:text-indexa-mint transition-colors">Produtora</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-indexa-mint">Serviços</h4>
              <ul className="space-y-2">
                <li><Link to="/paineis-publicitarios" className="block text-white/80 text-xs hover:text-indexa-mint transition-colors">Painéis Digitais</Link></li>
                <li><Link to="/sou-sindico" className="block text-white/80 text-xs hover:text-indexa-mint transition-colors">Sou Síndico</Link></li>
                <li><Link to="/paineis-digitais/loja" className="block text-white/80 text-xs hover:text-indexa-mint transition-colors">Loja Online</Link></li>
              </ul>
            </div>
          </div>

          {/* Mobile Contact */}
          <div className="text-center space-y-2">
            <a 
              href="tel:+5545991250093"
              className="flex items-center justify-center space-x-2 text-white/90 text-sm"
            >
              <Phone className="h-4 w-4 text-indexa-mint" />
              <span>(45) 99125-0093</span>
            </a>
            <a 
              href="mailto:contato@indexamidia.com"
              className="flex items-center justify-center space-x-2 text-white/90 text-xs"
            >
              <Mail className="h-4 w-4 text-indexa-mint" />
              <span>contato@indexamidia.com</span>
            </a>
          </div>
        </div>

        {/* Copyright - Reduzido */}
        <div className="border-t border-white/20 pt-4 pb-4">
          <div className="text-center text-white/80">
            <p className="text-xs">
              © 2025 Indexa Mídia. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MobileOptimizedFooter;
