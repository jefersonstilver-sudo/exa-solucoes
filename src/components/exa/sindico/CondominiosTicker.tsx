import React from 'react';
import { cn } from '@/lib/utils';

interface CondominiösTickerProps {
  condominios: string[];
  className?: string;
}

const CondominiosTicker: React.FC<CondominiösTickerProps> = ({ condominios, className }) => {
  // Duplicar array para ticker infinito
  const duplicatedCondominios = [...condominios, ...condominios];

  return (
    <div className={cn('relative overflow-hidden bg-exa-purple/20 backdrop-blur-md py-6 border-t border-exa-purple/30', className)}>
      <div className="flex animate-scroll-left whitespace-nowrap">
        {duplicatedCondominios.map((condominio, index) => (
          <div
            key={index}
            className="inline-flex items-center mx-12 font-poppins text-white font-medium text-base"
          >
            <span className="text-exa-yellow mr-3 text-lg">●</span>
            {condominio}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CondominiosTicker;
