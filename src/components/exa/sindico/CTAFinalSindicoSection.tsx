import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCTA from '@/components/exa/base/ExaCTA';
import { useScrollReveal } from '@/hooks/useScrollReveal';
const CTAFinalSindicoSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  return <ExaSection background="transparent" className="py-16 md:py-20 lg:py-24">
      <div ref={ref} className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#9C1E1E] via-[#180A0A]/90 to-exa-black p-8 md:p-12 lg:p-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-exa-blue/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-exa-yellow/20 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-6 md:space-y-8">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-white">
            Cadastre seu prédio na lista de intenção hoje mesmo!!
          </h2>
          
          <p className="font-poppins text-lg md:text-xl text-white/90 leading-relaxed">
            Modernize a comunicação, valorize o ambiente e faça parte da rede EXA.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 md:pt-4">
            <ExaCTA variant="secondary" size="lg" to="/contato">
              Quero ter a EXA no meu prédio
            </ExaCTA>
            
          </div>
        </div>
      </div>
    </ExaSection>;
};
export default CTAFinalSindicoSection;