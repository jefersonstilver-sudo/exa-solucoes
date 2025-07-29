import React, { useState, useEffect, useRef } from 'react';
import { Camera, Monitor, Lightbulb, MessageCircle } from 'lucide-react';

const DiferenciaisSection = () => {
  console.log('🎬 DiferenciaisSection: Renderizando com MessageCircle (não WhatsApp)');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const estudioVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo";

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

  const handleWhatsAppClick = () => {
    const message = "Olá! Gostaria de reservar o estúdio da Indexa Produtora. Podem me passar mais informações sobre disponibilidade e valores?";
    const phoneNumber = "5545999859329"; // Número da Gabi
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section 
      ref={sectionRef}
      className="h-[60vh] bg-gradient-to-br from-white to-gray-100 flex items-center py-16"
    >
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-indexa-purple mb-4">
              Nossos <span className="text-indexa-mint">Diferenciais</span>
            </h2>
            <p className="font-montserrat text-xl text-gray-600 max-w-2xl mx-auto">
              Três pilares que elevam sua marca a um novo patamar cinematográfico
            </p>
          </div>

          {/* Grid de 3 Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Card 1: Vídeos Cinematográficos */}
            <div className={`transform transition-all duration-1000 delay-200 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-indexa-purple to-indexa-mint rounded-2xl flex items-center justify-center mb-6">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-playfair text-2xl font-bold text-indexa-purple mb-4">
                  Vídeos Cinematográficos
                </h3>
                <p className="font-montserrat text-gray-600 leading-relaxed">
                  Técnicas premium que constroem profundidade emocional, transformando simples gravações em experiências que capturam a essência da sua marca.
                </p>
              </div>
            </div>

            {/* Card 2: Estúdio Avançado (Destaque) */}
            <div className={`transform transition-all duration-1000 delay-400 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-indexa-purple to-indexa-purple-dark rounded-2xl shadow-2xl p-8 hover:shadow-indexa-mint/30 transition-all duration-500 hover:scale-105 relative overflow-hidden">
                
                {/* Vídeo de fundo do estúdio */}
                <div className="absolute inset-0 opacity-20">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    <source src={estudioVideoSrc} type="video/mp4" />
                  </video>
                </div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-r from-indexa-mint to-white rounded-2xl flex items-center justify-center mb-6">
                    <Monitor className="w-8 h-8 text-indexa-purple" />
                  </div>
                  <h3 className="font-playfair text-2xl font-bold text-white mb-4">
                    Estúdio Avançado
                  </h3>
                  <p className="font-montserrat text-white/90 leading-relaxed mb-6">
                    Chroma key infinito, fundos variados, teleprompter profissional. Seu conteúdo com qualidade hollywoodiana.
                  </p>
                  
                  {/* Preço e Botão WhatsApp */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="font-montserrat text-indexa-mint text-sm">A partir de</span>
                      <div className="font-playfair text-3xl font-bold text-white">
                        R$ 200<span className="text-lg font-normal">/hora</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleWhatsAppClick}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-montserrat">Reserve o Estúdio Agora</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Abordagem Integrada */}
            <div className={`transform transition-all duration-1000 delay-600 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-indexa-mint to-indexa-purple rounded-2xl flex items-center justify-center mb-6">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-playfair text-2xl font-bold text-indexa-purple mb-4">
                  Abordagem Integrada
                </h3>
                <p className="font-montserrat text-gray-600 leading-relaxed">
                  Narrativas que conectam e transformam, integrando estratégia, criatividade e execução para resultados que realmente impactam seu negócio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DiferenciaisSection;