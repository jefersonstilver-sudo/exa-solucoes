import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePageOptimization } from '@/hooks/usePageOptimization';

const EssenciaSection = () => {
  const { shouldReduceMotion, animationDuration } = usePageOptimization();
  const { ref, isVisible } = useScrollReveal({ 
    threshold: 0.2, 
    reducedMotion: shouldReduceMotion 
  });

  return (
    <ExaSection background="light" paddingSize="md" lazyLoad>
      <div 
        ref={ref}
        className="max-w-[1200px] mx-auto"
        style={{
          transition: `all ${animationDuration}ms ease-out`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(1rem)'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Coluna Esquerda: Título */}
          <div className="lg:col-span-4">
            <h2 className="text-responsive-h2 text-[#111111] font-montserrat text-tracking-tight">
              Nossa Essência
            </h2>
          </div>

          {/* Coluna Direita: Conteúdo em Card */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-5 md:space-y-6">
              <p className="text-responsive-body text-[#555555] font-inter leading-relaxed">
                A <strong className="text-[#C8102E] font-semibold">EXA Soluções Digitais LTDA</strong>, sediada em Foz do Iguaçu – PR, nasceu com o propósito de conectar administradores, síndicos e moradores por meio de uma comunicação não invasiva, informativa e estética.
              </p>

              <p className="text-responsive-body text-[#555555] font-inter leading-relaxed">
                Atuamos com <strong className="font-semibold text-[#111111]">publicidade inteligente em elevadores</strong>, levando informações úteis e relevantes ao cotidiano das pessoas — de forma natural, moderna e integrada aos espaços que elas já observam diariamente.
              </p>

              <p className="text-responsive-body text-[#555555] font-inter leading-relaxed">
                Nosso modelo foi validado e apoiado pelo <strong className="text-[#C8102E] font-semibold">Secovi Paraná</strong>, reforçando o compromisso da EXA com a ética, a inovação e a transparência na comunicação condominial.
              </p>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-responsive-body text-[#111111] font-semibold italic font-inter">
                  "Acreditamos em tecnologia a serviço das pessoas. Estamos presentes onde a atenção é genuína: no dia a dia."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default EssenciaSection;
