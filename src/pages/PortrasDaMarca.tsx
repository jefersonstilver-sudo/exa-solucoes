import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import UnifiedLogo from '@/components/layout/UnifiedLogo';

/**
 * Página "Por Trás da Marca" - Embed da apresentação Gamma
 * Rota: /portrasdamarca
 */
const PortrasDaMarca: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Por Trás da Marca | EXA Mídia</title>
        <meta name="description" content="Conheça a história e os valores por trás da marca EXA Mídia." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-black">
        {/* Header minimalista com logo */}
        <header className="flex-shrink-0 bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] px-6 py-4">
          <div className="container mx-auto flex items-center justify-between">
            <UnifiedLogo 
              size="custom" 
              linkTo="/" 
              variant="light"
              className="w-28 h-auto"
            />
            <Link 
              to="/" 
              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              ← Voltar ao site
            </Link>
          </div>
        </header>
        
        {/* Iframe com apresentação */}
        <div className="flex-1 w-full">
          <iframe 
            src="https://gamma.app/embed/vs86hqoh5vgn32d" 
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 72px)' }}
            allow="fullscreen" 
            title="Por Trás da Marca - EXA Mídia"
          />
        </div>
      </div>
    </>
  );
};

export default PortrasDaMarca;
