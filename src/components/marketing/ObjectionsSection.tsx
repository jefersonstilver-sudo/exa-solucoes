
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
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
      answer: "Exatamente por isso que o nosso processo começa escutando você. Na Indexa, não criamos nada sem absorver primeiro sua visão, suas dores e sua experiência. O que fazemos é transformar esse conhecimento profundo em uma comunicação que toca o público com a linguagem atual."
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
    <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ainda tem <span className="text-[#00FFAB]">dúvidas?</span> Entendemos.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Respondemos as principais objeções de empresários sobre campanhas de marketing estratégico
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {objections.map((objection) => (
              <AccordionItem 
                key={objection.id} 
                value={objection.id}
                className="border border-white/10 rounded-lg bg-white/5 px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-white font-medium text-lg pr-4">
                    "{objection.objection}"
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="pt-4 border-t border-[#00FFAB]/20">
                    <p className="text-[#00FFAB] font-semibold mb-3 text-lg">
                      ✓ Nossa resposta:
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      {objection.answer}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA da Seção */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-[#3C1361]/20 to-[#00FFAB]/20 backdrop-blur-sm p-8 rounded-2xl border border-[#00FFAB]/30">
            <MessageCircle className="h-12 w-12 text-[#00FFAB] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Sua dúvida não está aqui?
            </h3>
            <p className="text-lg text-gray-300 mb-6">
              Agende uma conversa e esclarecemos tudo pessoalmente
            </p>
            <Button
              onClick={onScrollToForm}
              className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300"
            >
              Conversar com Especialista
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectionsSection;
