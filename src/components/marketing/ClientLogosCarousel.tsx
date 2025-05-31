
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientLogo {
  id: string;
  name: string;
  logo_url: string;
  link?: string;
  is_active: boolean;
  order_position: number;
}

const ClientLogosCarousel: React.FC = () => {
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const { data, error } = await supabase
          .from('client_logos')
          .select('*')
          .eq('is_active', true)
          .order('order_position', { ascending: true });

        if (error) {
          console.error('Erro ao carregar logos:', error);
          return;
        }

        setLogos(data || []);
      } catch (error) {
        console.error('Erro ao buscar logos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogos();
  }, []);

  if (isLoading || logos.length === 0) {
    return null;
  }

  // Duplicar logos para criar efeito infinito
  const duplicatedLogos = [...logos, ...logos, ...logos];

  const handleLogoClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-black to-[#3C1361]/20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <span className="text-[#00FFAB]">Confiam</span> na nossa estratégia:
          </h2>
        </div>

        {/* Carrossel infinito */}
        <div className="relative">
          <div className="flex animate-scroll-infinite space-x-12 md:space-x-16">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.id}-${index}`}
                className={`flex-shrink-0 flex items-center justify-center h-16 md:h-20 w-32 md:w-40 ${
                  logo.link ? 'cursor-pointer' : ''
                }`}
                onClick={() => handleLogoClick(logo.link)}
                title={logo.link ? `Visitar ${logo.name}` : logo.name}
              >
                <img
                  src={logo.logo_url}
                  alt={logo.name}
                  className={`max-h-full max-w-full object-contain filter brightness-0 invert opacity-70 transition-opacity duration-300 ${
                    logo.link ? 'hover:opacity-100 hover:scale-105' : 'hover:opacity-100'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll-infinite {
          animation: scroll-infinite 30s linear infinite;
        }
        
        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default ClientLogosCarousel;
