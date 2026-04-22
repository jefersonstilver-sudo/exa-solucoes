
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const faqs = [
    {
      question: "Como funciona a publicidade nos elevadores?",
      answer: "Seus vídeos de até 10 segundos são exibidos intercalados com conteúdo útil como clima, cotações e notícias. O público assiste enquanto aguarda o elevador ou durante o trajeto, garantindo total atenção à sua marca."
    },
    {
      question: "Quantas pessoas vão ver meu anúncio?",
      answer: "Cada painel exibe em média 502 vezes por dia (mais de 15.000 exibições por mês), atingindo moradores, visitantes e funcionários que utilizam os elevadores regularmente."
    },
    {
      question: "É seguro investir nessa mídia nova?",
      answer: "A Indexa já opera com sucesso em mais de 50 prédios. Temos sistema de monitoramento 24h, backup automático e garantia de funcionamento. Você acompanha tudo em tempo real pela nossa plataforma."
    },
    {
      question: "Como escolho os prédios para anunciar?",
      answer: "Você seleciona por localização, perfil dos moradores e características do prédio. Nossa equipe te ajuda a escolher os melhores pontos para seu público-alvo em Foz do Iguaçu e região."
    },
    {
      question: "Posso criar meu próprio vídeo?",
      answer: "Sim! Você pode enviar seu vídeo ou nossa equipe de design pode criar para você. Fornecemos todas as especificações técnicas e orientações para garantir o melhor resultado visual."
    },
    {
      question: "Quanto tempo demora para ativar minha campanha?",
      answer: "Após aprovação do vídeo e confirmação do pagamento, sua campanha é ativada em até 24 horas. Você recebe notificação quando tudo estiver funcionando."
    },
    {
      question: "Como acompanho os resultados da minha publicidade?",
      answer: "Através do nosso painel você vê quantas vezes seus vídeos foram exibidos, em quais horários, quais prédios têm melhor performance e pode ajustar sua estratégia em tempo real."
    },
    {
      question: "Qual o tempo mínimo de contrato?",
      answer: "Oferecemos planos flexíveis a partir de 30 dias. Você pode renovar, pausar ou modificar sua campanha a qualquer momento através da nossa plataforma online."
    },
    {
      question: "Funciona melhor que redes sociais?",
      answer: "Complementa perfeitamente! Enquanto nas redes sociais você compete com milhões de posts, nos elevadores sua marca tem atenção exclusiva de um público cativo por 30-60 segundos."
    },
    {
      question: "Como é feita a manutenção dos painéis?",
      answer: "Temos equipe técnica especializada que monitora todos os painéis 24h. Manutenções preventivas são agendadas e qualquer problema é resolvido rapidamente sem prejudicar sua campanha."
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full flex items-center justify-center">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
                Perguntas Frequentes
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-white/80 leading-relaxed max-w-3xl mx-auto">
              Tire suas dúvidas sobre publicidade em elevadores
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className={`bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-indexa-mint/20 rounded-xl overflow-hidden transform transition-all duration-500 hover:border-indexa-mint/40 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline group">
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-8 h-8 bg-indexa-mint/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-indexa-mint/30 transition-colors duration-300">
                        <span className="text-indexa-mint font-bold text-sm">{index + 1}</span>
                      </div>
                      <span className="text-white font-medium text-lg group-hover:text-indexa-mint transition-colors duration-300">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6">
                    <div className="pl-12">
                      <p className="text-white/90 leading-relaxed text-base">
                        {faq.answer}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* CTA motivacional */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 max-w-2xl mx-auto">
              <p className="text-xl font-bold text-white mb-2">
                <span className="text-indexa-mint">Ainda tem dúvidas?</span>
              </p>
              <p className="text-white/80 text-lg">
                Nossa equipe está pronta para esclarecer tudo sobre sua campanha
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
