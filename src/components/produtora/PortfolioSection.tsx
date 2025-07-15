
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play } from 'lucide-react';

interface PortfolioItem {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  url_video: string;
  created_at: string;
}

const PortfolioSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  const fetchPortfolioItems = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_produtora')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar portfólio:', error);
      } else {
        setPortfolioItems(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar portfólio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      id="portfolio-section"
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-100 to-white"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-indexa-purple mb-6">
              Portfólio Cinematográfico
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-indexa-mint font-light mt-2">
                Showroom Exclusivo
              </span>
            </h2>
          </div>

          {/* Grid de vídeos do portfólio */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indexa-mint"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {portfolioItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 hover:scale-105 transform ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {/* Container do vídeo */}
                  <div className="relative aspect-[9/16] overflow-hidden">
                    <video
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      <source src={item.url_video} type="video/mp4" />
                    </video>
                    
                    {/* Overlay com play button */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                    
                    {/* Badge da categoria */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-indexa-purple text-white px-3 py-1 rounded-full text-sm font-medium">
                        {item.categoria}
                      </span>
                    </div>
                  </div>

                  {/* Informações do vídeo */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-indexa-purple mb-2">{item.titulo}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA final */}
          <div className="text-center mt-12 lg:mt-16">
            <div className="inline-flex items-center bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-2xl">
              <div className="bg-white px-8 py-4 rounded-xl">
                <p className="text-lg font-bold text-indexa-purple">
                  Cada projeto uma <span className="text-indexa-mint">obra cinematográfica</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
