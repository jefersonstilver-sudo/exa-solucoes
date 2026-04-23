import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCTA from '../base/ExaCTA';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Sparkles } from 'lucide-react';

const CTAFinalSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="gradient" className="relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9C1E1E]/20 via-transparent to-[#180A0A]/20" />
      <div className="absolute top-10 left-10 w-64 h-64 bg-exa-yellow/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#9C1E1E]/10 rounded-full blur-3xl" />

      <div 
        ref={ref}
        className={`relative z-10 text-center space-y-8 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <Sparkles className="w-16 h-16 text-[#9C1E1E] mx-auto" />
        
        <h2 className="font-montserrat font-extrabold text-4xl lg:text-6xl text-[#9C1E1E]">
          Transforme visibilidade<br />em resultados
        </h2>
        
        <p className="font-poppins text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto">
          Sua marca nos momentos certos, nos lugares certos, com as pessoas certas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <ExaCTA variant="primary" size="lg" href="https://wa.me/5545991415920?text=Oi%2C%20tenho%20interesse%20em%20anunciar%20na%20EXA!">
            Quero Anunciar
          </ExaCTA>
          <ExaCTA variant="outline" size="lg" to="/interessesindico/formulario">
            Falar com Especialista
          </ExaCTA>
        </div>

        <div className="pt-8 border-t border-gray-300 mt-12">
          <p className="font-poppins text-gray-600">
            Dúvidas? Entre em contato: <a href="mailto:comercial@examidia.com.br" className="text-[#9C1E1E] font-semibold hover:underline">comercial@examidia.com.br</a>
          </p>
        </div>
      </div>
    </ExaSection>
  );
};

export default CTAFinalSection;
