
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
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const categories = ['Todos', 'Comerciais de TV', 'Institucionais', 'Campanhas', 'Lançamentos', 'Cursos Online com Drone'];

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

  const getEvocativeDescription = (categoria: string) => {
    const descriptions = {
      'Comerciais de TV': 'Imagine sua marca ganhando vida na televisão com narrativas que cativam e convencem.',
      'Institucionais': 'Sinta o orgulho de apresentar sua empresa com vídeos que transmitem credibilidade e valores.',
      'Campanhas': 'Veja sua campanha se tornar viral, conectando emocionalmente com seu público-alvo.',
      'Lançamentos': 'Desperte a curiosidade e o desejo com lançamentos que marcam e transformam mercados.',
      'Cursos Online com Drone': 'Imagine seu curso online ganhando vida com captações que inspiram alunos a transformar suas vidas.'
    };
    return descriptions[categoria as keyof typeof descriptions] || 'Experiências visuais que transformam sua mensagem em impacto real.';
  };

  return (
    <section 
      id="portfolio-section"
      ref={sectionRef}
      className="h-[80vh] bg-gradient-to-br from-gray-100 to-white flex flex-col"
    >
      <div className="max-w-7xl mx-auto px-4 flex-1 flex flex-col">
        <div className={`transform transition-all duration-1000 flex-1 flex flex-col ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-indexa-purple mb-4">
              Portfólio Cinematográfico
            </h2>
            <p className="font-montserrat text-xl text-gray-600">
              Cada categoria uma história, cada vídeo uma transformação
            </p>
          </div>

          {/* Botões de Filtro */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-6 py-3 rounded-full font-montserrat font-medium transition-all duration-300 ${
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
              <div className="text-center py-12">
                <p className="font-montserrat text-gray-600 text-lg">
                  Nenhum vídeo encontrado para esta categoria.
                </p>
                <p className="font-montserrat text-indexa-mint text-sm mt-2">
                  {getEvocativeDescription(selectedCategory)}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredItems.map((item, index) => (
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
                  <div className="p-4">
                    <h3 className="font-playfair text-lg font-bold text-indexa-purple mb-2">{item.titulo}</h3>
                    <p className="font-montserrat text-gray-600 text-sm leading-relaxed line-clamp-2">{item.descricao}</p>
                    <p className="font-montserrat text-indexa-mint text-xs mt-2 italic">
                      {getEvocativeDescription(item.categoria)}
                    </p>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA final */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-2xl">
              <div className="bg-white px-6 py-3 rounded-xl">
                <p className="font-playfair text-lg font-bold text-indexa-purple">
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
