import React, { useState, useEffect } from 'react';
import { Play, Calendar, ArrowDown, Award, Video, Users } from 'lucide-react';

const IndexaProdutoraHero = () => {
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const scrollToPortfolio = () => {
    document.getElementById('portfolio-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNext = () => {
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indexa-purple via-indexa-purple-dark to-indexa-purple-light">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
      </div>

      {/* Video Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indexa-purple/90 via-transparent to-indexa-purple/90"></div>

      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        {/* Badge Premium */}
        <div className={`inline-flex items-center gap-2 bg-indexa-mint/20 backdrop-blur-sm border border-indexa-mint/30 rounded-full px-6 py-2 mb-8 transition-all duration-1000 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Award className="w-4 h-4 text-indexa-mint" />
          <span className="text-sm font-medium text-indexa-mint">Produtora Premium de Vídeos</span>
        </div>

        {/* Main Headline */}
        <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-all duration-1000 delay-200 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Transformamos Suas
          <br />
          <span className="text-indexa-mint">Ideias em Vídeos</span>
          <br />
          Que <span className="bg-gradient-to-r from-indexa-mint to-indexa-mint-light bg-clip-text text-transparent">Impactam</span>
        </h1>

        {/* Sub-headline */}
        <p className={`text-xl md:text-2xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Produtora especializada em vídeos corporativos, cobertura de eventos exclusivos e conteúdo estratégico que converte. Combinamos criatividade cinematográfica com o método T.A.C.C.O.H. para resultados mensuráveis.
        </p>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-1000 delay-600 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button 
            onClick={scrollToPortfolio}
            className="group bg-gradient-to-r from-indexa-mint to-indexa-mint-light text-indexa-purple px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-enhanced-hover transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
          >
            <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Ver Nosso Portfólio
          </button>
          
          <button 
            onClick={scrollToContact}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
          >
            <Calendar className="w-5 h-5" />
            Agendar Reunião Estratégica
          </button>
        </div>

        {/* Value Indicators */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 transition-all duration-1000 delay-800 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-indexa-mint mb-2">+500</div>
            <div className="text-white/80">Videos Produzidos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indexa-mint mb-2">+200</div>
            <div className="text-white/80">Clientes Satisfeitos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indexa-mint mb-2">95%</div>
            <div className="text-white/80">Taxa de Renovacao</div>
          </div>
        </div>

        {/* Premium Services Preview */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 transition-all duration-1000 delay-1000 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            { icon: Video, title: "Videos Corporativos" },
            { icon: Users, title: "Eventos Exclusivos" },
            { icon: Play, title: "Drones Cinematograficos" },
            { icon: Award, title: "Estudio Premium" }
          ].map((service, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <service.icon className="w-6 h-6 text-indexa-mint mx-auto mb-2" />
              <div className="text-sm text-white/90">{service.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <button 
        onClick={scrollToNext}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 hover:text-indexa-mint transition-colors animate-bounce"
      >
        <ArrowDown className="w-6 h-6" />
      </button>
    </section>
  );
};

export default IndexaProdutoraHero;