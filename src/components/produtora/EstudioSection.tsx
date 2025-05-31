
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Monitor, Palette, Film, Lightbulb, Plane, Users } from 'lucide-react';

const EstudioSection = () => {
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

  const equipment = [
    {
      icon: Camera,
      title: 'Estúdio 360° Chroma Key',
      description: 'Cenário infinito para produções de alta qualidade'
    },
    {
      icon: Monitor,
      title: 'Teleprompter + Tela Retorno',
      description: 'Sistema profissional para apresentações fluidas'
    },
    {
      icon: Lightbulb,
      title: 'Iluminação Touch + Cenas',
      description: 'Painel touch com cenas pré-programadas'
    },
    {
      icon: Film,
      title: 'Câmeras Blackmagic 6K',
      description: 'Qualidade cinematográfica em cada frame'
    },
    {
      icon: Mic,
      title: 'Áudio Profissional',
      description: 'Captação cristalina com equipamentos de ponta'
    },
    {
      icon: Palette,
      title: 'Edição Final Cut + DaVinci',
      description: 'Sala de edição com softwares profissionais'
    },
    {
      icon: Plane,
      title: 'Drones FPV',
      description: 'Imagens aéreas cinematográficas únicas'
    },
    {
      icon: Users,
      title: 'Camarim + Maquiagem',
      description: 'Área completa para preparação dos talentos'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-white to-gray-100"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-indexa-purple mb-6">
              Nosso Estúdio
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-indexa-mint font-light mt-2">
                Estrutura Completa
              </span>
            </h2>
          </div>

          {/* Vídeo do estúdio + Grid de equipamentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
            {/* Vídeo do estúdio */}
            <div className="relative">
              <div className="aspect-[9/16] max-w-sm mx-auto lg:max-w-full rounded-2xl overflow-hidden shadow-2xl">
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
              <div className="absolute inset-0 bg-gradient-to-t from-indexa-purple/20 via-transparent to-transparent rounded-2xl" />
            </div>

            {/* Grid de equipamentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {equipment.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 transform border border-gray-100 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="w-12 h-12 bg-indexa-mint/10 rounded-full flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6 text-indexa-mint" />
                    </div>
                    <h3 className="text-lg font-bold text-indexa-purple mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Destaque final */}
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-2xl">
              <div className="bg-white px-8 py-4 rounded-xl">
                <p className="text-lg font-bold text-indexa-purple">
                  Onde ideias viram vídeos que <span className="text-indexa-mint">vendem</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EstudioSection;
