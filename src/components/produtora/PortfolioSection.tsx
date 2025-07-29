
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
  const [selectedCategory, setSelectedCategory] = useState('Todos');
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

  const categories = ['Todos', 'Comerciais de TV', 'Institucionais', 'Campanhas', 'Lançamentos', 'Cursos Online'];

  const filteredItems = selectedCategory === 'Todos' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.categoria === selectedCategory);

  const getEvocativeDescription = (categoria: string, titulo: string) => {
    const descriptions = {
      'Comerciais de TV': 'Imagine sua marca conquistando corações através da tela, com narrativas que fazem o público parar e sentir.',
      'Institucionais': 'Veja sua empresa ganhando credibilidade e confiança através de vídeos que transmitem seus valores com autenticidade.',
      'Campanhas': 'Sinta o poder de campanhas que não apenas informam, mas transformam espectadores em defensores da sua marca.',
      'Lançamentos': 'Desperte a curiosidade e o desejo do seu público com lançamentos que criam expectativa e geram resultados.',
      'Cursos Online': 'Imagine seu curso online ganhando vida com captações que inspiram alunos e elevam a experiência de aprendizado.'
    };
    return descriptions[categoria as keyof typeof descriptions] || 'Descubra como transformamos ideias em experiências visuais impactantes.';
  };

  return (
    <section 
      id="portfolio-section"
      ref={sectionRef}
      className="h-[80vh] bg-gradient-to-br from-gray-900 to-indexa-purple-dark px-4 flex flex-col"
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        <div className={`transform transition-all duration-1000 flex-1 flex flex-col ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Portfólio Cinematográfico
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-indexa-mint font-light mt-2">
                Narrativas que Impactam
              </span>
            </h2>
          </div>

          {/* Botões de categoria */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-indexa-mint text-indexa-purple-dark'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-mint"></div>
            </div>
          )}

          {/* Grid de vídeos do portfólio */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
              {filteredItems.slice(0, 6).map((item, index) => (
                <div
                  key={item.id}
                  className={`group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-500 hover:scale-105 transform ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Thumbnail do vídeo */}
                  <div className="relative aspect-video">
                    <video
                      className="w-full h-full object-cover"
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    >
                      <source src={item.url_video} type="video/mp4" />
                    </video>
                    
                    {/* Overlay com informações */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="text-white">
                        <span className="inline-block bg-indexa-mint text-indexa-purple-dark text-xs font-semibold px-2 py-1 rounded-full mb-2">
                          {item.categoria}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações do projeto */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indexa-mint transition-colors duration-300">
                      {item.titulo}
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {getEvocativeDescription(item.categoria, item.titulo)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mensagem quando não há itens */}
          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/60">Nenhum item encontrado nesta categoria.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
