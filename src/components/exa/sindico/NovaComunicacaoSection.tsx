import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCard from '@/components/exa/base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Clock, Cloud, Gem } from 'lucide-react';
const NovaComunicacaoSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const benefits = [{
    icon: Clock,
    title: 'Publicação Instantânea',
    description: 'Envie comunicados em segundos pelo painel administrativo.'
  }, {
    icon: Cloud,
    title: 'Informação Útil',
    description: 'Exiba mensagens do síndico, clima, câmbio e avisos relevantes.'
  }, {
    icon: Gem,
    title: 'Ambiente Premium',
    description: 'Modernize o elevador e valorize o imóvel.'
  }];
  return <ExaSection background="light" className="py-24">
      <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Imagem */}
          <div className="order-2 lg:order-1">
            
          </div>
          
          {/* Conteúdo */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="font-montserrat font-bold text-4xl lg:text-5xl text-exa-purple mb-4">
                Mais que um painel.<br />
                Um novo canal de convivência.
              </h2>
              <p className="font-poppins text-lg text-gray-700 leading-relaxed">
                A EXA substitui os antigos murais impressos por um sistema digital moderno e intuitivo.
                Os comunicados são exibidos automaticamente nas telas dos elevadores, junto a conteúdos úteis 
                e mensagens publicitárias.
              </p>
              <p className="font-poppins text-lg text-gray-700 leading-relaxed mt-4">
                O resultado é um ambiente mais organizado, valorizado e conectado.
              </p>
            </div>
            
            {/* Mini cards */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => <ExaCard key={index} variant="light" className="p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-exa-purple to-exa-blue rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-xl text-exa-black mb-1">
                        {benefit.title}
                      </h3>
                      <p className="font-poppins text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </ExaCard>)}
            </div>
          </div>
        </div>
      </div>
    </ExaSection>;
};
export default NovaComunicacaoSection;