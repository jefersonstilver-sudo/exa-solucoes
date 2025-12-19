import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const EssenciaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="light" className="py-10 md:py-16 lg:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 px-4 md:px-6 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 lg:gap-16">
          <div className="md:col-span-4">
            <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-[#111111] font-montserrat">
              Nossa Essência
            </h2>
          </div>
          <div className="md:col-span-8">
            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 shadow-sm border border-gray-100 space-y-4 md:space-y-6 text-sm md:text-base lg:text-lg text-[#555555] font-inter leading-relaxed md:leading-[1.8]">
              <p>
                A <strong className="text-[#C8102E] font-semibold">EXA Soluções Digitais LTDA</strong>, sediada em Foz do Iguaçu – PR, nasceu para conectar administradores, síndicos e moradores com comunicação não invasiva.
              </p>
              <p>
                Atuamos com <strong className="font-semibold text-[#111111]">publicidade inteligente em elevadores</strong>, de forma natural, moderna e integrada.
              </p>
              <p>
                Nosso modelo foi validado pelo <strong className="text-[#C8102E] font-semibold">Secovi Paraná</strong>.
              </p>
              <div className="pt-3 md:pt-4 border-t border-gray-200">
                <p className="text-[#111111] font-semibold italic text-xs md:text-sm lg:text-base">
                  "Acreditamos em tecnologia a serviço das pessoas."
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
