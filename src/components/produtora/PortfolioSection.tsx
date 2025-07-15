import React, { useState, useEffect, useRef } from 'react';

const PortfolioSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const portfolioItems = [
    {
      thumbnail: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Empoderando a História de uma Clínica em Foz",
      description: "Transformamos seus serviços cotidianos em uma narrativa cinematográfica que conectou com pacientes, gerando interesse e lealdade.",
      videoUrl: "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/portfolio-1.mp4"
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Capturando um Lançamento na Fronteira",
      description: "Usando nosso estúdio avançado e tecnologia de drone, criamos footage que tornou o evento épico, gerando buzz e parcerias.",
      videoUrl: "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/portfolio-2.mp4"
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Transformação Corporativa em Cascavel",
      description: "Um vídeo que resolveu dores de branding, criando laços emocionais que impulsionaram o engajamento.",
      videoUrl: "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/portfolio-3.mp4"
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Documentário Empresarial Inovador",
      description: "Uma narrativa que capturou a essência de uma empresa local, criando conexão emocional e aumentando a credibilidade.",
      videoUrl: "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/portfolio-4.mp4"
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Campanha Publicitária Regional",
      description: "Storytelling que conectou com a identidade regional, criando impacto emocional e resultados mensuráveis.",
      videoUrl: "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/portfolio-5.mp4"
    },
    {
      thumbnail: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?q=80&w=600&h=400&auto=format&fit=crop",
      title: "Produção Institucional de Alto Impacto",
      description: "Vídeo que transformou a percepção da marca, elevando o posicionamento e gerando novos negócios.",
      videoUrl: "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/portfolio-6.mp4"
    }
  ];

  const closeModal = () => {
    setSelectedVideo(null);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-white py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-800 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="font-playfair text-3xl lg:text-4xl xl:text-5xl text-purple-900 mb-6 leading-tight">
            Portfólios que Inspiram Ação
          </h2>
          <p className="font-montserrat text-lg lg:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Veja como nosso toque cinematográfico transformou negócios reais – de histórias locais em Foz 
            a projetos impactantes na fronteira. Esses exemplos mostram o desejo que criamos por mais.
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioItems.map((item, index) => (
            <div
              key={index}
              className={`group cursor-pointer transition-all duration-800 ease-out ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onClick={() => setSelectedVideo(index)}
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                {/* Video Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    style={{ filter: 'brightness(0.9) contrast(1.1)' }}
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-orange-500 rounded-full p-4 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-montserrat font-bold text-xl text-gray-800 mb-3 group-hover:text-purple-700 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="font-montserrat text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo !== null && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 text-white hover:text-orange-400 transition-colors duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                className="w-full h-full"
                controls
                autoPlay
                src={portfolioItems[selectedVideo].videoUrl}
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PortfolioSection;