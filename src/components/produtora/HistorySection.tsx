import React, { useState, useEffect, useRef } from 'react';

const HistorySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const images = [
    {
      src: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc?q=80&w=1200&h=800&auto=format&fit=crop",
      alt: "Início artesanal com drone em Foz do Iguaçu",
      filter: "grayscale(100%) brightness(0.8)"
    },
    {
      src: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1200&h=800&auto=format&fit=crop",
      alt: "Equipe no estúdio avançado da INDEXA",
      filter: "brightness(0.9) contrast(1.1)"
    },
    {
      src: "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1200&h=800&auto=format&fit=crop",
      alt: "Paisagem de Iguaçu representando nossa origem",
      filter: "brightness(0.8) saturate(0.7)"
    }
  ];

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section 
      id="historia-section"
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className={`transition-all duration-800 ease-out ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
          }`}>
            <div className="bg-purple-100 bg-opacity-30 backdrop-blur-sm rounded-2xl p-8 lg:p-10">
              <h2 className="font-playfair text-3xl lg:text-4xl xl:text-5xl text-purple-900 mb-6 leading-tight">
                Da Visão Artesanal à Maestria Cinematográfica
              </h2>
              
              <div className="space-y-6">
                <p className="font-montserrat text-lg lg:text-xl text-gray-800 leading-relaxed">
                  Tudo começou em Foz do Iguaçu, onde a paixão por comunicação autêntica viu a dor de 
                  negócios locais lutando para se expressar com impacto. Da produção artesanal inicial, 
                  a INDEXA Produtora evoluiu para um ecossistema sofisticado, integrando criatividade 
                  cinematográfica com estratégia sutil.
                </p>
                
                <p className="font-montserrat text-lg lg:text-xl text-gray-800 leading-relaxed">
                  Hoje, ajudamos empreendedores da fronteira a resolverem desafios como a transição digital, 
                  criando vídeos que não só mostram, mas fazem sentir – gerando 
                  <span className="text-purple-700 font-medium"> conexões que duram e transformam resultados</span>.
                </p>
                
                <p className="font-montserrat text-base lg:text-lg text-orange-600 italic font-medium">
                  "Descubra como podemos transformar sua história."
                </p>
              </div>
            </div>
          </div>

          {/* Image Carousel */}
          <div className={`transition-all duration-800 ease-out delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
          }`}>
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImage ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    style={{ filter: image.filter }}
                  />
                </div>
              ))}
              
              {/* Navigation Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImage 
                        ? 'bg-orange-500 scale-125' 
                        : 'bg-white bg-opacity-50 hover:bg-orange-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorySection;