import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const EssenciaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="transparent" className="py-16 md:py-24">
      <div 
        ref={ref}
        className={`max-w-4xl mx-auto text-center transition-all duration-1000 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-8 font-montserrat">
          Nossa Essência
        </h2>

        <div className="space-y-6 text-base md:text-lg text-[#555555] font-inter leading-relaxed text-left md:text-center">
          <p>
            A <strong className="text-[#C8102E]">EXA Soluções Digitais LTDA</strong>, sediada em Foz do Iguaçu – PR, nasceu com o propósito de conectar administradores, síndicos e moradores por meio de uma comunicação não invasiva, informativa e estética.
          </p>

          <p>
            Atuamos com <strong>publicidade inteligente em elevadores</strong>, levando informações úteis e relevantes ao cotidiano das pessoas — de forma natural, moderna e integrada aos espaços que elas já observam diariamente.
          </p>

          <p>
            Nosso modelo foi validado e apoiado pelo <strong className="text-[#C8102E]">Secovi Paraná</strong>, reforçando o compromisso da EXA com a ética, a inovação e a transparência na comunicação condominial.
          </p>

          <p className="text-lg md:text-xl font-semibold text-[#111111] pt-4">
            Acreditamos em tecnologia a serviço das pessoas.
            <br />
            Estamos presentes onde a atenção é genuína: no dia a dia.
          </p>
        </div>
      </div>
    </ExaSection>
  );
};

export default EssenciaSection;
