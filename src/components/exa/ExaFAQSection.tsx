import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ExaFAQSection: React.FC = () => {
  const faqs = [
    {
      id: "item-1",
      question: "Como funciona a tecnologia EXA?",
      answer: "EXA utiliza painéis digitais 4K conectados à internet com processamento em nuvem. Nossos algoritmos otimizam automaticamente o conteúdo baseado em dados de audiência, horário e performance em tempo real."
    },
    {
      id: "item-2",
      question: "Qual é o tempo mínimo de campanha?",
      answer: "O período mínimo é de 7 dias, mas recomendamos campanhas de pelo menos 30 dias para otimização completa dos algoritmos e melhores resultados de branding e conversão."
    },
    {
      id: "item-3",
      question: "Como são medidos os resultados?",
      answer: "Utilizamos sensores de movimento, análise de imagem com IA, dados de GPS anônimos e QR codes rastreáveis para medir impressões, engajamento e conversões de forma precisa e em tempo real."
    },
    {
      id: "item-4",
      question: "Posso alterar minha campanha durante a veiculação?",
      answer: "Sim! Uma das grandes vantagens da EXA é a flexibilidade total. Você pode alterar criativos, horários, segmentação e até pausar a campanha através do nosso dashboard em tempo real."
    },
    {
      id: "item-5",
      question: "Qual é a diferença para outdoor tradicional?",
      answer: "EXA oferece qualidade 4K, mudança instantânea de conteúdo, segmentação por horário/público, métricas precisas, menor custo por impressão e sustentabilidade. Tudo isso impossível no outdoor tradicional."
    },
    {
      id: "item-6",
      question: "Como escolher a melhor localização?",
      answer: "Nossa IA analisa seu público-alvo e recomenda as melhores localizações baseado em dados demográficos, fluxo de pessoas, concorrência e histórico de performance para seu setor."
    }
  ];

  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Perguntas <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Frequentes</span>
          </h2>
          <p className="text-xl text-gray-300">
            Tudo que você precisa saber sobre a publicidade inteligente EXA
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors"
            >
              <AccordionTrigger className="px-6 py-4 text-left font-semibold text-white hover:text-yellow-400 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-gray-300 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm p-8 rounded-2xl border border-yellow-500/20">
            <h3 className="text-2xl font-bold mb-4">Ainda tem dúvidas?</h3>
            <p className="text-gray-300 mb-6">
              Nossa equipe de especialistas está pronta para esclarecer qualquer questão sobre a EXA.
            </p>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300">
              Falar com Especialista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaFAQSection;