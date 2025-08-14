import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Eye, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
interface TermsScrollViewerProps {
  onScrollToBottom: (reached: boolean) => void;
  hasScrolledToBottom: boolean;
}
export const TermsScrollViewer: React.FC<TermsScrollViewerProps> = ({
  onScrollToBottom,
  hasScrolledToBottom
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    if (!viewportRef.current) return;
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = viewportRef.current;
    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable <= 0) {
      setScrollProgress(100);
      onScrollToBottom(true);
      return;
    }
    const progress = scrollTop / totalScrollable * 100;
    setScrollProgress(Math.min(progress, 100));

    // Considera como "lido completamente" quando chegou a 95% do scroll
    const hasReachedBottom = progress >= 95;
    onScrollToBottom(hasReachedBottom);
  };
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll);
      // Verifica scroll inicial
      handleScroll();
      return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, []);
  return <div className="h-full flex flex-col">
      {/* Header com indicador de progresso */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-primary" />
            Termos de Uso - EXA Publicidade
          </h3>
          <AnimatePresence>
            {hasScrolledToBottom ? <motion.div initial={{
            scale: 0
          }} animate={{
            scale: 1
          }} className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Leitura completa</span>
              </motion.div> : <motion.div initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} className="flex items-center text-orange-600">
                <ArrowDown className="h-4 w-4 mr-1 animate-bounce" />
                <span className="text-sm">Continue lendo...</span>
              </motion.div>}
          </AnimatePresence>
        </div>
        
        
      </div>

      {/* Área de scroll compacta com termos */}
      <div className="flex-1">
        <ScrollArea className="h-80 border rounded-lg bg-white shadow-sm" ref={scrollAreaRef}>
          <div ref={viewportRef} className="p-4 space-y-4 text-xs leading-relaxed">
            <div className="text-center border-b pb-3">
              <h2 className="text-sm font-bold text-gray-900 mb-1">
                Termos de Uso – EXA Publicidade
              </h2>
              <p className="text-gray-600 text-xs">Última atualização: 14/08/2025</p>
              <div className="text-xs text-gray-600 mt-1">
                <p><strong>Indexa Midia LTDA</strong> – 38.142.638/0001-30</p>
                <p>comercial@exapublicidade.com.br</p>
              </div>
            </div>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2 text-xs">1. Objeto e Aceitação</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>1.1.</strong> Estes Termos de Uso regem o uso da plataforma EXA Publicidade, por meio da qual Anunciantes adquirem espaços e submetem materiais publicitários para veiculação em painéis digitais instalados em elevadores residenciais e áreas de circulação.</p>
                <p><strong>1.2.</strong> Ao se cadastrar, contratar, enviar Peças ou utilizar a Plataforma, o Usuário declara ciência e aceitação integral destes Termos, da Política de Privacidade (LGPD) e das Políticas de Conteúdo e Veiculação.</p>
                <p><strong>1.3.</strong> Se o Usuário não concordar, não deverá utilizar a Plataforma.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2 text-xs">2. Elegibilidade e Cadastro</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>2.1.</strong> O uso é restrito a maiores de 18 anos com plena capacidade civil e pessoas jurídicas regularmente constituídas.</p>
                <p><strong>2.2.</strong> O Usuário declara que todas as informações de cadastro são verdadeiras, completas e atualizadas, responsabilizando-se por sua exatidão.</p>
                <p><strong>2.3.</strong> A EXA poderá solicitar documentos adicionais de identidade, titularidade da marca, licenças, alvarás, autorizações e comprovações legais pertinentes ao segmento anunciado.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-2 text-xs">3. Regras de Conteúdo e CONAR</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>3.1.</strong> Toda veiculação deve respeitar o Código Brasileiro de Autorregulamentação Publicitária (CONAR) e a legislação aplicável (inclusive Código de Defesa do Consumidor, Marco Civil da Internet, LGPD – Lei 13.709/2018, ECA – Estatuto da Criança e do Adolescente, legislação eleitoral, sanitária, regulatória setorial e de direitos autorais/imagem).</p>
                <p><strong>3.2.</strong> É estritamente proibida a submissão/veiculação de conteúdos que:</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>promovam discriminação, racismo, xenofobia, LGBTQIA+fobia, misoginia, capacitismo;</li>
                  <li>contenham violência, ameaças, assédio, bullying ou incitem atividades ilegais;</li>
                  <li>possuam nudez, erotização, sexualização inadequada para ambiente familiar;</li>
                  <li>envolvam crianças em situação de vulnerabilidade sem autorização;</li>
                  <li>configurem propaganda política, partidária ou religiosa, proselitismo;</li>
                  <li>divulguem medicamentos, bebidas alcoólicas, tabaco, jogos de azar, armas;</li>
                  <li>façam afirmações enganosas, promessas irrealistas sem base científica;</li>
                  <li>infrinjam direitos autorais, de marca, patentes, imagem e voz de terceiros;</li>
                  <li>contenham malware, phishing, QR codes maliciosos;</li>
                  <li>utilizem linguagem chula, gestos ofensivos, sons estridentes.</li>
                </ul>
                <p><strong>3.3.</strong> A classificação de conteúdo é "livre/familiar".</p>
                <p><strong>3.4.</strong> A EXA poderá exigir comprovantes de licenças e autorizações (música, atores, locações, uso de imagem, marcas, etc.).</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">4. Formato das Peças e Diretrizes Técnicas</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>4.1.</strong> A EXA disponibilizará especificações técnicas (resolução, orientação, duração, codecs, limites de volume/áudio, brilho, taxa de quadros).</p>
                <p><strong>4.2.</strong> É vedada a inserção de elementos que possam comprometer segurança ou privacidade (ex.: captação indevida de imagens de moradores, placas de veículos, números de apartamentos).</p>
                <p><strong>4.3.</strong> QR Codes devem redirecionar para domínios seguros (HTTPS) e não coletar dados sensíveis de forma abusiva.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">5. Moderação, Aprovação e Takedown</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>5.1.</strong> Todas as Peças passam por moderação antes da veiculação.</p>
                <p><strong>5.2.</strong> A EXA poderá aprovar, reprovar, solicitar ajustes ou retirar do ar a qualquer momento, a seu exclusivo critério, em caso de suspeita de violação legal, condominial, destes Termos ou das Políticas.</p>
                <p><strong>5.3.</strong> Reincidência ou má conduta resultará em suspensão imediata da conta por 10 (dez) dias. Casos graves podem levar ao cancelamento definitivo da conta sem reembolso.</p>
                <p><strong>5.4.</strong> Qualquer terceiro poderá notificar a EXA por suposta violação, e a Peça poderá ser suspensa preventivamente até análise.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">6. Responsabilidade do Anunciante</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>6.1.</strong> O Anunciante é único e integralmente responsável por todo conteúdo enviado, pelos direitos de uso e pelas consequências legais de sua veiculação.</p>
                <p><strong>6.2.</strong> O Anunciante isenta e indeniza a EXA e seus representantes de toda e qualquer reclamação, dano, multa, custo e despesa decorrente de violação destes Termos/leis.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">7. Licença de Uso das Peças</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>7.1.</strong> O Anunciante concede à EXA licença não exclusiva, sublicenciável e por prazo necessário para armazenar, processar, adaptar, reproduzir e exibir publicamente as Peças nos Painéis contratados.</p>
                <p><strong>7.2.</strong> A EXA poderá utilizar frames/thumbnails das Peças para provas de veiculação e portfólio institucional, salvo oposição expressa.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">8. Compra, Pagamento e Faturamento</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>8.1.</strong> As contratações ocorrem por planos, períodos e locais disponibilizados na Plataforma.</p>
                <p><strong>8.2.</strong> Os pagamentos são processados por intermediadores financeiros (PIX, cartões, gateways).</p>
                <p><strong>8.3.</strong> O início da veiculação pode estar condicionado à compensação do pagamento e à aprovação da Peça.</p>
                <p><strong>8.4.</strong> Reembolsos: salvo obrigação legal, não há reembolso após início da veiculação.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">9. Veiculação, Disponibilidade e Métricas</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>9.1.</strong> A veiculação está sujeita a horários, janelas, fila de exibição, políticas do condomínio e limitações técnicas.</p>
                <p><strong>9.2.</strong> Métricas são estimativas e não constituem garantia de resultado comercial.</p>
                <p><strong>9.3.</strong> A EXA poderá reprogramar veiculações por motivos técnicos, com compensação proporcional.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">10. LGPD e Privacidade</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>10.1.</strong> A EXA trata dados pessoais de acordo com a LGPD e sua Política de Privacidade.</p>
                <p><strong>10.2.</strong> A Plataforma não coleta dados de moradores/espectadores nos Painéis.</p>
                <p><strong>10.3.</strong> O Anunciante não poderá inserir Peças que promovam coleta oculta ou abusiva de dados.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">11. Propriedade Intelectual da Plataforma</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>11.1.</strong> A Plataforma, marcas e conteúdos da EXA são protegidos por direitos de propriedade intelectual.</p>
                <p><strong>11.2.</strong> É proibido copiar, modificar, revender ou explorar economicamente sem autorização.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">12. Conduta, Segurança e Compliance</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>12.1.</strong> É proibido burlar sistemas, testar vulnerabilidades, acessar áreas não públicas, realizar engenharia reversa, enviar SPAM ou interferir no funcionamento dos Painéis.</p>
                <p><strong>12.2.</strong> Anticorrupção: cumprimento da Lei 12.846/2013.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">13. Suspensão, Encerramento e Penalidades</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>13.1.</strong> Penalidades aplicáveis:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>1ª ocorrência: advertência e retirada da Peça;</li>
                  <li>2ª ocorrência: suspensão de 10 (dez) dias;</li>
                  <li>3ª ocorrência ou caso grave: cancelamento definitivo da conta e perda de créditos.</li>
                </ul>
                <p><strong>13.2.</strong> Penalidades não afastam responsabilidade por indenizações.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">14. Garantias e Limitação de Responsabilidade</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>14.1.</strong> A Plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta.</p>
                <p><strong>14.2.</strong> A EXA não responde por lucros cessantes, perda de dados ou danos indiretos.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">15. Denúncias e Contato</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>15.1.</strong> Denúncias sobre conteúdo ou incidentes de segurança: comercial@exapublicidade.com.br.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">16. Alterações dos Termos</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>16.1.</strong> A EXA poderá atualizar estes Termos a qualquer tempo, com comunicação na Plataforma.</p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900 mb-3">17. Foro e Lei Aplicável</h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>17.1.</strong> Aplica-se a legislação brasileira.</p>
                <p><strong>17.2.</strong> Fica eleito o Foro da Comarca de Foz do Iguaçu/PR.</p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8 text-center text-xs text-gray-500">
              <p>Indexa Midia LTDA – 38.142.638/0001-30</p>
              <p>Todos os direitos reservados</p>
              
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>;
};