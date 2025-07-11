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
      objection: "Já tentei redes sociais antes e não funcionou",
      answer: "O sucesso em redes sociais depende de estratégia consistente. Analisamos seus resultados anteriores e criamos uma abordagem personalizada baseada em dados, não em achismos."
    },
    {
      id: "item-2", 
      objection: "Meu nicho é muito específico para redes sociais",
      answer: "Todo nicho tem sua audiência nas redes sociais. Desenvolvemos estratégias específicas para B2B, nichos técnicos e segmentos especializados com linguagem e canais adequados."
    },
    {
      id: "item-3",
      objection: "Preciso de resultados rápidos",
      answer: "Começamos a ver engajamento nas primeiras semanas, mas crescimento orgânico sólido leva 90 dias. Oferecemos relatórios semanais para acompanhar cada métrica importante."
    },
    {
      id: "item-4",
      objection: "Não tenho orçamento para social media profissional",
      answer: "Investimento em social media tem ROI comprovado. Oferecemos planos flexíveis e mostramos o valor gerado versus investimento em cada relatório mensal."
    },
    {
      id: "item-5",
      objection: "Minha equipe interna pode fazer isso",
      answer: "Equipes internas focam no dia a dia do negócio. Nós vivemos social media 24/7, acompanhamos tendências, algoritmos e melhores práticas constantemente."
    },
    {
      id: "item-6",
      objection: "Não quero me expor muito nas redes",
      answer: "Criamos estratégias que respeitam o perfil da marca. Podemos focar em produtos, equipe, bastidores ou cases sem exposição excessiva dos fundadores."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Dúvidas sobre <span className="text-[#00B377]">Social Media?</span>
          </h2>
          <p className="text-xl text-gray-600">
            Respondemos as principais questões sobre gestão de redes sociais
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