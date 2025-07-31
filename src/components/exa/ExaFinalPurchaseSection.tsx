import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const ExaFinalPurchaseSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

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

  const handlePurchaseClick = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <section 
      ref={sectionRef}
      className="bg-gradient-to-br from-purple-900 via-black to-indigo-900 py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-400 bg-clip-text mb-12 sm:mb-16 lg:mb-20 leading-tight tracking-wide">
            A cidade está assistindo. Sua marca vai continuar invisível?
          </h2>
          
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button
              onClick={handlePurchaseClick}
              className="group bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-exo-2 font-bold px-16 sm:px-20 lg:px-24 py-8 sm:py-10 lg:py-12 rounded-xl text-xl sm:text-2xl md:text-3xl lg:text-4xl transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-purple-500/30 relative overflow-hidden touch-manipulation tracking-wide min-h-[80px] sm:min-h-[96px] lg:min-h-[112px]"
              style={{
                boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3)'
              }}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
              
              <span className="relative z-10 flex items-center justify-center space-x-3 sm:space-x-4">
                <span>Comprar Agora</span>
                <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
              
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse opacity-75"></div>
            </button>
          </div>
          
          <div className={`mt-12 sm:mt-16 lg:mt-20 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="font-exo-2 font-light text-white/60 text-sm sm:text-base md:text-lg lg:text-xl tracking-wide">
              Comece agora e veja sua marca se destacar na cidade
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalPurchaseSection;