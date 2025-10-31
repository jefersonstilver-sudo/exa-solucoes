import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCard from '@/components/exa/base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { LayoutDashboard, Upload, History, Users } from 'lucide-react';

const PainelInteligenteSection = () => {
  const { ref, isVisible } = useScrollReveal();

  const features = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard de comunicados'
    },
    {
      icon: Upload,
      title: 'Upload de mensagens com imagem'
    },
    {
      icon: History,
      title: 'Histórico de publicações'
    },
    {
      icon: Users,
      title: 'Acesso multiusuário'
    }
  ];

  return (
    <ExaSection background="gradient" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Título e descrição */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-[#9C1E1E] mb-4 md:mb-6">
            O cérebro da comunicação do condomínio.
          </h2>
          <p className="font-poppins text-base md:text-lg text-gray-700 leading-relaxed">
            Com o painel administrativo da EXA, o síndico gerencia tudo de forma simples: envia avisos importantes, monitora o desempenho dos comunicados e acessa relatórios atualizados a qualquer momento.
          </p>
        </div>
        
        {/* Grid de features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <ExaCard 
              key={index} 
              variant="light"
              className="hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-montserrat font-semibold text-lg text-exa-black">
                  {feature.title}
                </h3>
              </div>
            </ExaCard>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default PainelInteligenteSection;
