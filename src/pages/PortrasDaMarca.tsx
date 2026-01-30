import React from 'react';
import { Helmet } from 'react-helmet-async';

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
      
      <div className="fixed inset-0 w-full h-full bg-black">
        <iframe 
          src="https://gamma.app/embed/vs86hqoh5vgn32d" 
          className="w-full h-full border-0"
          allow="fullscreen" 
          title="Por Trás da Marca - EXA Mídia"
        />
      </div>
    </>
  );
};

export default PortrasDaMarca;
