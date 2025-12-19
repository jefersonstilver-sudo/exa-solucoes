import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
const OQueESection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  return <ExaSection background="gradient" id="o-que-e" className="!pt-12 md:!pt-16 lg:!pt-20">
      <div ref={ref} className={`max-w-4xl mx-auto space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center space-y-4">
          <h2 className="font-montserrat font-extrabold text-2xl md:text-4xl lg:text-5xl text-exa-purple">
            O que é a EXA?
          </h2>
          
          <div className="space-y-4 font-poppins text-base md:text-lg text-gray-700 leading-relaxed">
            <p>
              A EXA é uma empresa de publicidade inteligente que conecta marcas e pessoas dentro dos espaços onde a vida acontece.
            </p>
            
            <p className="text-lg md:text-xl font-semibold text-exa-purple">
              Publicidade que não interrompe — convive.
            </p>
            
            <p>
              As telas EXA estão dentro dos elevadores dos prédios premium de Foz do Iguaçu, exibindo anúncios, informações e conteúdos úteis em harmonia com o ambiente. Cada exibição é uma experiência visual discreta, elegante e estrategicamente pensada para gerar atenção genuína e resultados mensuráveis.
            </p>
          </div>
        </div>

        {/* Imagem ilustrativa com alt text otimizado */}
        <div className="mt-8 flex justify-center">
          
        </div>
      </div>
    </ExaSection>;
};
export default OQueESection;