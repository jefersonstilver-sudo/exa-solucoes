
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play } from 'lucide-react';
import PortfolioVideoModal from './PortfolioVideoModal';

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
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<PortfolioItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const [categories, setCategories] = useState<string[]>(['Todos']);

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
        setFilteredItems(data || []);
        
        // Extrair categorias únicas dos dados
        const uniqueCategories = Array.from(new Set(data?.map(item => item.categoria) || []));
        setCategories(['Todos', ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Erro ao buscar portfólio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Todos') {
      setFilteredItems(portfolioItems);
    } else {
      setFilteredItems(portfolioItems.filter(item => item.categoria === category));
    }
  };

  const handleVideoClick = (item: PortfolioItem) => {
    setSelectedVideo(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };


  return (
    <section 
      id="portfolio-section"
      ref={sectionRef}
      className="min-h-[85vh] sm:min-h-[80vh] md:min-h-[75vh] bg-gradient-to-br from-gray-100 to-white flex flex-col py-20 sm:py-24 md:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <div className={`transform transition-all duration-1000 flex-1 flex flex-col ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="font-playfair text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-indexa-purple mb-3 sm:mb-4">
              Portfólio Cinematográfico
            </h2>
            <p className="font-montserrat text-base sm:text-lg md:text-xl text-gray-600 px-4">
              Cada categoria uma história, cada vídeo uma transformação
            </p>
          </div>

          {/* Botões de Filtro */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 mb-8 sm:mb-10 lg:mb-12 px-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full font-montserrat font-medium transition-all duration-300 text-xs sm:text-sm lg:text-base ${
                  selectedCategory === category
                    ? 'bg-indexa-purple text-white shadow-lg'
                    : 'bg-white text-indexa-purple border border-indexa-purple hover:bg-indexa-purple hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid de vídeos do portfólio */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indexa-mint"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="font-montserrat text-gray-600 text-base sm:text-lg">
                  Nenhum vídeo encontrado para esta categoria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleVideoClick(item)}
                  className={`group relative bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 hover:scale-105 transform cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {/* Container do vídeo */}
                  <div className="relative aspect-[9/16] overflow-hidden bg-gray-200">
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      <source src={item.url_video} type="video/mp4" />
                    </video>
                    
                    {/* Overlay com play button */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                      </div>
                    </div>
                    
                    {/* Badge da categoria */}
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <span className="bg-indexa-purple text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        {item.categoria}
                      </span>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA final */}
          <div className="text-center mt-6 sm:mt-8 px-4">
            <div className="inline-flex items-center bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-xl sm:rounded-2xl">
              <div className="bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl">
                <p className="font-playfair text-sm sm:text-base lg:text-lg font-bold text-indexa-purple">
                  Cada projeto uma <span className="text-indexa-mint">obra cinematográfica</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de vídeo */}
      {selectedVideo && (
        <PortfolioVideoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          videoSrc={selectedVideo.url_video}
          titulo={selectedVideo.titulo}
          categoria={selectedVideo.categoria}
        />
      )}
    </section>
  );
};

export default PortfolioSection;
