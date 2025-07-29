import React, { useState, useEffect, useRef } from 'react';
import { Film, Camera, Users } from 'lucide-react';

const DiferenciaisSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const studioVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo";

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

  const handleStudioBooking = () => {
    const whatsappNumber = "5545999846771"; // Número da Gabi
    const message = "Olá! Gostaria de reservar o estúdio da Indexa Produtora. Podem me enviar mais informações sobre disponibilidade e valores?";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const diferenciais = [
    {
      icon: Film,
      title: 'Vídeos Cinematográficos',
      description: 'Técnicas premium que constroem profundidade emocional, elevando sua marca acima do comum com narrativas que realmente conectam.',
      features: ['Color grading profissional', 'Trilha sonora original', 'Direção de arte exclusiva']
    },
    {
      icon: Camera,
      title: 'Estúdio Avançado',
      description: 'Infraestrutura completa com chroma key infinito, teleprompter e iluminação profissional.',
      features: ['Chroma key 360°', 'Sistema teleprompter', 'Iluminação touch'],
      isStudio: true
    },
    {
      icon: Users,
      title: 'Abordagem Integrada',
      description: 'Narrativas que conectam marca e público, transformando espectadores em clientes através de storytelling estratégico.',
      features: ['Estratégia de conteúdo', 'Roteiro especializado', 'Análise de resultados']
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="h-[60vh] bg-gradient-to-br from-white to-gray-100 px-4 flex items-center"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-indexa-purple mb-6">
              Nossos Diferenciais
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-indexa-mint font-light mt-2">
                Cinema que Vende
              </span>
            </h2>
          </div>

          {/* Grid de 3 cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {diferenciais.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 transform border border-gray-100 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${item.isStudio ? 'ring-2 ring-indexa-mint/20' : ''}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {/* Ícone */}
                  <div className="w-12 h-12 bg-indexa-mint/10 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-indexa-mint" />
                  </div>
                  
                  {/* Título */}
                  <h3 className="text-xl font-bold text-indexa-purple mb-3">{item.title}</h3>
                  
                  {/* Descrição */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{item.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {item.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-xs text-gray-500 flex items-center">
                        <div className="w-1.5 h-1.5 bg-indexa-mint rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Vídeo do estúdio e botão especial para o card do estúdio */}
                  {item.isStudio && (
                    <div className="space-y-4">
                      {/* Vídeo vertical do estúdio */}
                      <div className="aspect-[9/16] max-w-32 mx-auto rounded-lg overflow-hidden shadow-lg">
                        <video
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        >
                          <source src={studioVideoSrc} type="video/mp4" />
                        </video>
                      </div>
                      
                      {/* Botão de reserva */}
                      <button
                        onClick={handleStudioBooking}
                        className="w-full bg-indexa-mint text-indexa-purple-dark font-bold py-3 px-4 rounded-lg hover:bg-indexa-mint/90 transition-all duration-300 hover:scale-105"
                      >
                        Reserve o Estúdio Agora
                      </button>
                      
                      {/* Preço */}
                      <p className="text-center text-xs text-gray-500">
                        A partir de <span className="font-semibold text-indexa-purple">R$ 200/hora</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiferenciaisSection;