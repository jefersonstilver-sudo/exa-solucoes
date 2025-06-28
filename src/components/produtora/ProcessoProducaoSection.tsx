
import React, { useState, useEffect, useRef } from 'react';
import { FileText, Video, Palette, Sparkles, CheckCircle } from 'lucide-react';

const ProcessoProducaoSection = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const steps = [
    {
      icon: FileText,
      title: 'Briefing',
      subtitle: 'com roteirista e criativo',
      description: 'Entendemos sua marca, objetivos e público-alvo para criar o roteiro perfeito.'
    },
    {
      icon: Video,
      title: 'Gravação',
      subtitle: 'com direção',
      description: 'Filmagem profissional em nosso estúdio com toda a estrutura cinematográfica.'
    },
    {
      icon: Palette,
      title: 'Edição',
      subtitle: 'com identidade visual da marca',
      description: 'Pós-produção completa respeitando a identidade visual e objetivos da marca.'
    },
    {
      icon: Sparkles,
      title: 'Finalização',
      subtitle: 'com color grading e áudio',
      description: 'Tratamento de cor cinematográfico e mixagem de áudio profissional.'
    },
    {
      icon: CheckCircle,
      title: 'Entrega',
      subtitle: 'para todos os formatos',
      description: 'Arquivos otimizados para redes sociais, TV, web e qualquer plataforma.'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Como Funciona a Produção
              <span className="block text-2xl sm:text-3xl lg:text-4xl text-[#00B377] font-light mt-2">
                com a Indexa
              </span>
            </h2>
          </div>

          {/* Timeline horizontal em desktop, vertical em mobile */}
          <div className="relative">
            {/* Linha conectora - desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00B377] via-gray-300 to-[#00B377] transform -translate-y-1/2" />
            
            {/* Linha conectora - mobile */}
            <div className="lg:hidden absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00B377] via-gray-300 to-[#00B377] transform -translate-x-1/2" />

            {/* Cards do processo */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={index}
                    className={`relative transform transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                  >
                    {/* Número da etapa */}
                    <div className="lg:absolute lg:top-0 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 flex lg:block justify-center mb-4 lg:mb-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#00B377] to-indexa-purple rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                        {index + 1}
                      </div>
                    </div>

                    {/* Card principal */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 lg:mt-8">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-[#00B377]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <IconComponent className="w-6 h-6 text-[#00B377]" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-[#00B377] text-sm font-medium mb-3">{step.subtitle}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA final */}
          <div className="text-center mt-12 lg:mt-16">
            <div className="inline-flex items-center bg-gradient-to-r from-[#00B377] to-indexa-purple p-1 rounded-2xl">
              <div className="bg-white px-8 py-4 rounded-xl">
                <p className="text-lg font-bold text-gray-900">
                  Do conceito à entrega: <span className="text-[#00B377]">experiência completa</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessoProducaoSection;
