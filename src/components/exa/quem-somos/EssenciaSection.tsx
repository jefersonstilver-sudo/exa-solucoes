import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const EssenciaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="transparent" className="py-16 md:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          {/* Coluna Esquerda: Título */}
          <div className="md:col-span-4">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111] font-montserrat">
              Nossa Essência
            </h2>
          </div>

          {/* Coluna Direita: Conteúdo */}
          <div className="md:col-span-8 space-y-6 text-base md:text-lg text-[#555555] font-inter leading-[1.8]">
            <p>
              A <strong className="text-[#C8102E] font-semibold">EXA Soluções Digitais LTDA</strong>, sediada em Foz do Iguaçu – PR, nasceu com o propósito de conectar administradores, síndicos e moradores por meio de uma comunicação não invasiva, informativa e estética.
            </p>

            <p>
              Atuamos com <strong className="font-semibold text-[#111111]">publicidade inteligente em elevadores</strong>, levando informações úteis e relevantes ao cotidiano das pessoas — de forma natural, moderna e integrada aos espaços que elas já observam diariamente.
            </p>

            <p>
              Nosso modelo foi validado e apoiado pelo <strong className="text-[#C8102E] font-semibold">Secovi Paraná</strong>, reforçando o compromisso da EXA com a ética, a inovação e a transparência na comunicação condominial.
            </p>

            <p className="text-[#111111] font-semibold pt-4">
              Acreditamos em tecnologia a serviço das pessoas. Estamos presentes onde a atenção é genuína: no dia a dia.
            </p>
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default EssenciaSection;
