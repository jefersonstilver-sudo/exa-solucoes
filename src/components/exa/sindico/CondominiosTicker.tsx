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
    <div className={cn('relative overflow-hidden bg-white/5 backdrop-blur-sm py-4', className)}>
      <div className="flex animate-scroll-left whitespace-nowrap">
        {duplicatedCondominios.map((condominio, index) => (
          <div
            key={index}
            className="inline-flex items-center mx-8 font-poppins text-white/80 text-sm"
          >
            <span className="text-exa-yellow mr-2">●</span>
            {condominio}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CondominiosTicker;
