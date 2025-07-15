import React, { useState, useEffect, useRef } from 'react';

const CTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const handleScheduleMeeting = () => {
    // Aqui você pode integrar com um sistema de agendamento ou form
    window.open('mailto:contato@indexamidia.com?subject=Agendamento - Reunião INDEXA Produtora&body=Olá! Gostaria de agendar uma reunião para discutir um projeto de vídeo com a INDEXA Produtora.', '_blank');
  };

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-[60vh] bg-gradient-to-br from-purple-900 via-purple-800 to-black py-20 px-4 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        <div className={`transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          {/* Content Container */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-3xl p-12 lg:p-16 shadow-2xl">
            {/* Header */}
            <h2 className="font-playfair text-3xl lg:text-4xl xl:text-5xl text-white mb-8 leading-tight">
              Pronto para Criar Mágica Cinematográfica Juntos?
            </h2>
            
            {/* Description */}
            <p className="font-montserrat text-lg lg:text-xl text-gray-200 leading-relaxed mb-12 max-w-4xl mx-auto">
              Se nosso portfólio acendeu esse desejo de elevar seu conteúdo, vamos conversar. 
              Agende uma reunião para explorar como podemos orçar um vídeo, projeto, campanha 
              ou até alugar nosso estúdio avançado – seremos guiados pelas suas necessidades, 
              garantindo um caminho personalizado.
            </p>
            
            {/* CTA Button */}
            <div className="space-y-6">
              <button 
                onClick={handleScheduleMeeting}
                className="inline-flex items-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-montserrat font-bold text-xl px-12 py-5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/30 group"
              >
                <span>Agende Sua Reunião Agora</span>
                <svg className="ml-3 h-6 w-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              {/* Additional Contact Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-gray-300 font-montserrat">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>(45) 99125-0093</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span>contato@indexamidia.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-500 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl"></div>
    </section>
  );
};

export default CTASection;