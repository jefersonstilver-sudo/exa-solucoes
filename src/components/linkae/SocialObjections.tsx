import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SocialObjectionsProps {
  onScrollToForm: () => void;
}

const SocialObjections: React.FC<SocialObjectionsProps> = ({ onScrollToForm }) => {
  const objections = [
    {
      id: "item-1",
      objection: "Como vocês garantem que os resultados vão superar o investimento?",
      answer: "Trabalhamos com KPIs claros e metas específicas desde o primeiro dia. Nossos clientes veem ROI médio de 300% em 90 dias através de vendas diretas, leads qualificados e redução de custo de aquisição de clientes."
    },
    {
      id: "item-2", 
      objection: "Meu negócio é muito técnico/complexo para redes sociais",
      answer: "Especialidade nossa. Já atendemos desde SaaS B2B até consultorias especializadas. Traduzimos complexidade em conteúdo que engaja e educa sua audiência, criando autoridade no seu mercado."
    },
    {
      id: "item-3",
      objection: "Outras agências prometeram muito e entregaram pouco",
      answer: "Entendemos a frustração. Por isso trabalhamos com contratos mensais, relatórios semanais detalhados e reuniões quinzenais de acompanhamento. Transparência total sobre cada ação e resultado."
    },
    {
      id: "item-4",
      objection: "Preciso ver crescimento rápido, não posso esperar meses",
      answer: "Primeiros resultados aparecem em 2-3 semanas (engajamento e alcance). Leads qualificados começam entre 30-45 dias. Crescimento sólido e sustentável em 90 dias. Acompanhamento semanal para ajustes rápidos."
    },
    {
      id: "item-5",
      objection: "Já tenho uma pessoa cuidando das redes sociais",
      answer: "Perfeito! Podemos trabalhar em conjunto, oferecendo estratégia, treinamento e suporte técnico. Ou assumir completamente, liberando sua equipe para focar no core business enquanto nós geramos resultados."
    },
    {
      id: "item-6",
      objection: "Como sei que vocês entendem do meu mercado específico?",
      answer: "Fase de descoberta intensiva: 15 dias analisando seu mercado, concorrência, audiência e oportunidades. Estratégia 100% personalizada, não templates. Se não entregarmos resultados, não renovamos o contrato."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Perguntas <span className="text-linkae-orange">Inteligentes</span>
          </h2>
          <p className="text-xl text-gray-600">
            As dúvidas mais comuns de empresários sérios sobre investir em social media estratégico
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {objections.map((objection) => (
            <AccordionItem
              key={objection.id}
              value={objection.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-900 hover:text-[#00B377] transition-colors">
                {objection.objection}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-600 leading-relaxed">
                {objection.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA após as objeções */}
        <div className="mt-16 text-center bg-gradient-to-r from-[#00FFAB] to-[#00B377] text-white p-8 rounded-xl">
          <h3 className="text-2xl font-bold mb-4">
            Pronto para transformar suas redes sociais?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Agende uma conversa estratégica gratuita e descubra como a LINKAÊ pode acelerar seus resultados.
          </p>
          <button
            onClick={onScrollToForm}
            className="bg-white text-[#00B377] font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300"
          >
            Agendar Estratégia Gratuita
          </button>
        </div>
      </div>
    </section>
  );
};

export default SocialObjections;