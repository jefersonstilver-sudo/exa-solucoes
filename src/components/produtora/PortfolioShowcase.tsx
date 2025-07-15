import React, { useState, useRef, useEffect } from 'react';
import { Play, ExternalLink, Award, TrendingUp, Users, Building } from 'lucide-react';

const PortfolioShowcase = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('todos');
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const categories = [
    { id: 'todos', label: 'Todos os Projetos', icon: Award },
    { id: 'corporativo', label: 'Vídeos Corporativos', icon: Building },
    { id: 'eventos', label: 'Eventos', icon: Users },
    { id: 'institucional', label: 'Institucional', icon: TrendingUp }
  ];

  const portfolioItems = [
    {
      id: 1,
      title: "Transformação Digital - TechCorp",
      category: "corporativo",
      client: "TechCorp Solutions",
      description: "Vídeo institucional que resultou em 40% mais leads qualificados",
      thumbnail: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
      duration: "3:24",
      views: "250K",
      engagement: "+340%",
      results: ["40% mais leads", "R$ 2.3M em vendas", "95% aprovação"]
    },
    {
      id: 2,
      title: "Lançamento Produto Innovation",
      category: "eventos",
      client: "Innovation Labs",
      description: "Cobertura completa do evento de lançamento com transmissão ao vivo",
      thumbnail: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop",
      duration: "8:15",
      views: "180K",
      engagement: "+280%",
      results: ["500+ participantes", "R$ 1.8M arrecadados", "Mídia espontânea"]
    },
    {
      id: 3,
      title: "Sustentabilidade EcoGroup",
      category: "institucional",
      client: "EcoGroup Brasil",
      description: "Produção com drones mostrando projetos sustentáveis da empresa",
      thumbnail: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?w=600&h=400&fit=crop",
      duration: "4:32",
      views: "320K",
      engagement: "+420%",
      results: ["ESG fortalecido", "Prêmio sustentabilidade", "Parceiros atraídos"]
    },
    {
      id: 4,
      title: "Convenção Anual MedTech",
      category: "eventos",
      client: "MedTech Conference",
      description: "Documentário completo da maior convenção médica do país",
      thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop",
      duration: "12:18",
      views: "95K",
      engagement: "+190%",
      results: ["2000+ médicos", "50 palestras", "Cobertura nacional"]
    },
    {
      id: 5,
      title: "Cultura Organizacional GlobalCorp",
      category: "corporativo",
      client: "GlobalCorp",
      description: "Série de vídeos internos para engajamento de colaboradores",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
      duration: "5:47",
      views: "85K",
      engagement: "+230%",
      results: ["85% engajamento", "Turnover reduzido", "Clima melhorado"]
    },
    {
      id: 6,
      title: "Relatório Anual FutureTech",
      category: "institucional",
      client: "FutureTech Industries",
      description: "Transformação de dados em narrativa visual impactante",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
      duration: "6:33",
      views: "140K",
      engagement: "+310%",
      results: ["Investidores atraídos", "Transparência reconhecida", "Confiança aumentada"]
    }
  ];

  const filteredItems = activeCategory === 'todos' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      id="portfolio-section"
      ref={sectionRef}
      className="py-24 bg-white"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indexa-mint/10 text-indexa-purple px-6 py-3 rounded-full text-sm font-bold mb-6">
            <Award className="w-5 h-5" />
            Portfólio de Impacto
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Projetos Que
            <span className="block bg-gradient-to-r from-indexa-purple to-indexa-mint bg-clip-text text-transparent">
              Transformaram Negócios
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cada vídeo conta uma história única. Veja como ajudamos empresas a alcançar resultados extraordinários através do poder da comunicação audiovisual.
          </p>
        </div>

        {/* Category Filter */}
        <div className={`flex flex-wrap justify-center gap-4 mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-indexa-purple text-white shadow-enhanced'
                  : 'bg-gray-100 text-gray-600 hover:bg-indexa-purple/10 hover:text-indexa-purple'
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.label}
            </button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-enhanced border border-gray-100 transition-all duration-500 transform hover:scale-105 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-indexa-mint/90 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-8 h-8 text-indexa-purple" />
                  </div>
                </div>

                {/* Duration */}
                <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-sm font-medium">
                  {item.duration}
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-indexa-purple/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                  {categories.find(cat => cat.id === item.category)?.label}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-indexa-purple transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-indexa-purple font-medium mb-2">
                  {item.client}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{item.views} visualizações</span>
                  <span className="text-indexa-mint font-medium">{item.engagement} engajamento</span>
                </div>

                {/* Results Preview */}
                {hoveredItem === item.id && (
                  <div className="space-y-2 transition-all duration-300">
                    <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wide">Resultados:</h4>
                    {item.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indexa-mint rounded-full"></div>
                        <span className="text-xs text-gray-700">{result}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <button className="w-full mt-4 bg-gray-50 hover:bg-indexa-purple/10 text-indexa-purple py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  Ver Case Completo
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Results Summary */}
        <div className={`bg-gradient-to-r from-indexa-purple to-indexa-purple-dark rounded-2xl p-8 text-white text-center transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-2xl font-bold mb-6">Impacto Real em Números</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-indexa-mint mb-2">R$ 15M+</div>
              <div className="text-white/90 text-sm">Em vendas geradas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indexa-mint mb-2">2.5M+</div>
              <div className="text-white/90 text-sm">Visualizações totais</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indexa-mint mb-2">+285%</div>
              <div className="text-white/90 text-sm">Engajamento médio</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indexa-mint mb-2">100%</div>
              <div className="text-white/90 text-sm">Clientes renovaram</div>
            </div>
          </div>
          
          <div className="mt-8">
            <button 
              onClick={scrollToContact}
              className="bg-indexa-mint text-indexa-purple px-8 py-4 rounded-xl font-bold hover:bg-indexa-mint-light transform hover:scale-105 transition-all duration-300"
            >
              Quero Esses Resultados Para Minha Empresa
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PortfolioShowcase;