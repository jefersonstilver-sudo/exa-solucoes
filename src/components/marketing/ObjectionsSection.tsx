
import React from 'react';
import { 
  MessageCircle
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ObjectionsSectionProps {
  onScrollToForm: () => void;
}

const ObjectionsSection: React.FC<ObjectionsSectionProps> = ({ onScrollToForm }) => {
  
  const objections = [
    {
      id: "obj1",
      objection: "Eu conheço meu público melhor do que qualquer agência",
      answer: "Exatamente por isso que o nosso processo começaescutando você. Na Indexa, não criamos nada sem absorver primeiro sua visão, suas dores e sua experiência. O que fazemos é transformar esse conhecimento profundo em uma comunicação que toca o público com a linguagem atual."
    },
    {
      id: "obj2",
      objection: "Marketing é só aparência. O que importa é entregar um bom serviço",
      answer: "E é justamente por entregar algo bom que o mundo precisa saber disso. Hoje, quem não comunica, desaparece. O marketing não é maquiagem, é tradução: traduzimos sua qualidade em percepções reais, desejo e crescimento."
    },
    {
      id: "obj3",
      objection: "Já contratei agência antes e só tive dor de cabeça",
      answer: "Essa é uma dor muito comum – e é por isso que criamos um modelo totalmente diferente. Nosso método é de cocriação estratégica, com cronograma, reuniões, relatórios, entregáveis e clareza total. Somos especialistas em resgatar marcas que foram frustradas por agências anteriores."
    },
    {
      id: "obj4",
      objection: "Minha empresa ainda não está no nível de precisar de uma agência",
      answer: "O marketing certo é o que leva a empresa para o próximo nível. Você não espera crescer para se posicionar. Você se posiciona para crescer. A diferença está em fazer isso com inteligência, estratégia e respeito ao seu estágio atual."
    },
    {
      id: "obj5",
      objection: "Prefiro manter tudo interno, com alguém que esteja aqui todo dia",
      answer: "A boa notícia é que você pode manter sua equipe interna. Mas o que oferecemos é pensamento externo estratégico, com visão de mercado, criatividade fresca e ferramentas que sua equipe nem sempre domina. A soma da sua proximidade com nossa visão ampla cria um modelo imbatível."
    },
    {
      id: "obj6",
      objection: "Meus concorrentes também não fazem nada disso e estão bem",
      answer: "Estar 'bem' é suficiente pra você? Porque a maioria só sobrevive — mas não domina. Quem comunica melhor, cresce mais rápido, conquista mais espaço e atrai os melhores clientes. Quem faz diferente, colhe diferente."
    },
    {
      id: "obj7",
      objection: "Marketing virou só modinha com IA, reels e dancinha",
      answer: "A gente também odeia superficialidade. Por isso, aqui na Indexa, o conteúdo é construído com resposta sensorial, profundidade estratégica e um framework testado. Não vendemos reels, vendemos movimento, com narrativa e propósito."
    },
    {
      id: "obj8",
      objection: "Não vejo retorno no marketing digital",
      answer: "É porque você ainda não fez marketing orientado a resultado real. A Indexa entrega planejamento, execução e relatórios. Medimos o que importa, com foco em ROI — e não em vaidade digital. Cada campanha tem metas claras e impacto mensurável."
    },
    {
      id: "obj9",
      objection: "O marketing me afasta do que é essencial: vender",
      answer: "Na verdade, ele é a base da venda. Sem posicionamento, sua equipe comercial luta sozinha. Com marketing bem-feito, o cliente já chega com desejo, confiança e metade da venda feita. Isso é escala."
    },
    {
      id: "obj10",
      objection: "Não gosto da ideia de expor minha empresa demais",
      answer: "Expor é diferente de posicionar. Você escolhe o quanto mostrar. A gente só traduz seus valores em conteúdo que inspira, gera respeito e atrai os clientes certos. É exposição com controle e propósito — não com exagero."
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="mb-4 sm:mb-6 text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-center text-gray-900">
            Ainda tem <span className="text-[#00B377]">dúvidas?</span> Entendemos.
          </h2>
          <p className="mb-6 sm:mb-8 text-sm xs:text-base sm:text-base md:text-lg lg:text-xl leading-relaxed text-center text-gray-600">
            Respondemos as principais objeções de empresários sobre campanhas de marketing estratégico
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {objections.map((objection) => (
              <AccordionItem 
                key={objection.id} 
                value={objection.id}
                className="border border-gray-200 rounded-lg bg-gray-50 px-3 sm:px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 sm:py-6">
                  <h6 className="pr-4 text-left text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-normal text-gray-900">
                    "{objection.objection}"
                  </h6>
                </AccordionTrigger>
                <AccordionContent className="pb-4 sm:pb-6">
                  <div className="pt-3 sm:pt-4 border-t border-[#00B377]/20">
                    <h6 className="text-[#00B377] mb-2 sm:mb-3 text-sm font-medium leading-normal">
                      ✓ Nossa resposta:
                    </h6>
                    <p className="leading-relaxed text-xs xs:text-sm sm:text-sm md:text-base lg:text-lg leading-normal text-gray-600">
                      {objection.answer}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA da Seção */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="bg-gradient-to-r from-gray-50 to-[#00FFAB]/10 shadow-lg p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-[#00FFAB]/30">
            <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-[#00FFAB] mx-auto mb-3 sm:mb-4" />
            <h3 className="mb-3 sm:mb-4 text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold leading-tight text-center text-gray-900">
              Sua dúvida não está aqui?
            </h3>
            <p className="mb-4 sm:mb-6 text-sm xs:text-base sm:text-base md:text-lg lg:text-xl leading-relaxed text-center text-gray-600">
              Agende uma conversa e esclarecemos tudo pessoalmente
            </p>
            <button
              onClick={onScrollToForm}
              className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white hover:scale-105 h-14 px-6 text-base rounded-full font-medium transition-all duration-200 w-full sm:w-auto"
            >
              Conversar com Especialista
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectionsSection;
