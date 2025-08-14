import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const TermosUso = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Termos de Uso – EXA Publicidade
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Última atualização: 14/08/2025
              </p>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p><strong>Razão Social / CNPJ:</strong> Indexa Midia LTDA – 38.142.638/0001-30</p>
                <p><strong>Contato Comercial:</strong> comercial@exapublicidade.com.br</p>
                <p><strong>Contato LGPD (Encarregado/DPO):</strong> comercial@exapublicidade.com.br</p>
              </div>
            </CardHeader>
            
            <CardContent className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Objeto e Aceitação</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>1.1.</strong> Estes Termos de Uso ("Termos") regem o uso da plataforma EXA Publicidade ("Plataforma"), por meio da qual Anunciantes adquirem espaços e submetem materiais publicitários ("Peças") para veiculação em painéis digitais instalados em elevadores residenciais e áreas de circulação (coletivamente, "Painéis").
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>1.2.</strong> Ao se cadastrar, contratar, enviar Peças ou utilizar a Plataforma, o Usuário (Anunciante) declara ciência e aceitação integral destes Termos, da Política de Privacidade (LGPD) e das Políticas de Conteúdo e Veiculação aqui referenciadas.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>1.3.</strong> Se o Usuário não concordar, não deverá utilizar a Plataforma.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Elegibilidade e Cadastro</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>2.1.</strong> O uso é restrito a maiores de 18 anos com plena capacidade civil e pessoas jurídicas regularmente constituídas.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>2.2.</strong> O Usuário declara que todas as informações de cadastro são verdadeiras, completas e atualizadas, responsabilizando-se por sua exatidão.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>2.3.</strong> A EXA poderá solicitar documentos adicionais de identidade, titularidade da marca, licenças, alvarás, autorizações e comprovações legais pertinentes ao segmento anunciado.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Regras de Conteúdo e CONAR</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.1.</strong> Toda veiculação deve respeitar o Código Brasileiro de Autorregulamentação Publicitária (CONAR) e a legislação aplicável (inclusive Código de Defesa do Consumidor, Marco Civil da Internet, LGPD – Lei 13.709/2018, ECA – Estatuto da Criança e do Adolescente, legislação eleitoral, sanitária, regulatória setorial e de direitos autorais/imagem).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.2.</strong> É estritamente proibida a submissão/veiculação de conteúdos que:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>promovam discriminação, racismo, xenofobia, LGBTQIA+fobia, misoginia, capacitismo, ou discurso de ódio em qualquer forma;</li>
                    <li>contenham violência, ameaças, assédio, bullying ou incitem atividades ilegais;</li>
                    <li>possuam nudez, erotização, sexualização ou apelo sexual inadequado para ambiente familiar;</li>
                    <li>envolvam crianças ou adolescentes em situação de vulnerabilidade, exponham menores sem autorização expressa do responsável legal ou descumpram normas do ECA;</li>
                    <li>configurem propaganda política, partidária ou religiosa, proselitismo, pedido de votos, ou descumpram normas eleitorais e regras condominiais;</li>
                    <li>divulguem medicamentos, procedimentos de saúde, bebidas alcoólicas, tabaco, jogos de azar, armas, explosivos ou produtos/serviços com restrição legal, sem observar integralmente as normas;</li>
                    <li>façam afirmações enganosas, promessas irrealistas, claims de ganho financeiro ou de saúde sem base científica;</li>
                    <li>infrinjam direitos autorais, de marca, patentes, segredos de negócio, imagem e voz de terceiros, ou utilizem material sem licenças/autorizações;</li>
                    <li>contenham malware, phishing, QR codes ou links que direcionem a páginas inseguras, ilegais ou enganosas;</li>
                    <li>utilizem linguagem chula, gestos ofensivos, sons estridentes ou efeitos que possam gerar desconforto (ex.: flashes intensos).</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.3.</strong> A classificação de conteúdo é "livre/familiar".
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.4.</strong> A EXA poderá exigir comprovantes de licenças e autorizações (música, atores, locações, uso de imagem, marcas, etc.).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Formato das Peças e Diretrizes Técnicas</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>4.1.</strong> A EXA disponibilizará especificações técnicas (resolução, orientação, duração, codecs, limites de volume/áudio, brilho, taxa de quadros).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>4.2.</strong> É vedada a inserção de elementos que possam comprometer segurança ou privacidade (ex.: captação indevida de imagens de moradores, placas de veículos, números de apartamentos).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>4.3.</strong> QR Codes devem redirecionar para domínios seguros (HTTPS) e não coletar dados sensíveis de forma abusiva.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Moderação, Aprovação e Takedown</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.1.</strong> Todas as Peças passam por moderação antes da veiculação.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.2.</strong> A EXA poderá aprovar, reprovar, solicitar ajustes ou retirar do ar a qualquer momento, a seu exclusivo critério, em caso de suspeita de violação legal, condominial, destes Termos ou das Políticas.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.3.</strong> Reincidência ou má conduta resultará em suspensão imediata da conta por 10 (dez) dias. Casos graves podem levar ao cancelamento definitivo da conta sem reembolso e à comunicação às autoridades competentes e ao CONAR.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.4.</strong> Qualquer terceiro poderá notificar a EXA por suposta violação, e a Peça poderá ser suspensa preventivamente até análise.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Responsabilidade do Anunciante</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>6.1.</strong> O Anunciante é único e integralmente responsável por todo conteúdo enviado, pelos direitos de uso e pelas consequências legais de sua veiculação.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>6.2.</strong> O Anunciante isenta e indeniza a EXA e seus representantes de toda e qualquer reclamação, dano, multa, custo e despesa decorrente de: (i) violação destes Termos/leis; (ii) infração a direitos de terceiros; (iii) conteúdos enganosos/ilícitos; (iv) descumprimento de regras condominiais; (v) links/QR codes maliciosos.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Licença de Uso das Peças</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>7.1.</strong> O Anunciante concede à EXA licença não exclusiva, sublicenciável e por prazo necessário para armazenar, processar, adaptar (cortes, compressões), reproduzir e exibir publicamente as Peças nos Painéis contratados.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>7.2.</strong> A EXA poderá utilizar frames/thumbnails das Peças para provas de veiculação e portfólio institucional, salvo oposição expressa.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Compra, Pagamento e Faturamento</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>8.1.</strong> As contratações ocorrem por planos, períodos e locais disponibilizados na Plataforma.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>8.2.</strong> Os pagamentos são processados por intermediadores financeiros (PIX, cartões, gateways).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>8.3.</strong> O início da veiculação pode estar condicionado à compensação do pagamento e à aprovação da Peça.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>8.4.</strong> Reembolsos: salvo obrigação legal, não há reembolso após início da veiculação.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Veiculação, Disponibilidade e Métricas</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>9.1.</strong> A veiculação está sujeita a horários, janelas, fila de exibição, políticas do condomínio e limitações técnicas (manutenção, quedas de energia, força maior).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>9.2.</strong> Métricas são estimativas e não constituem garantia de resultado comercial.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>9.3.</strong> A EXA poderá reprogramar veiculações por motivos técnicos, com compensação proporcional.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. LGPD e Privacidade</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>10.1.</strong> A EXA trata dados pessoais de acordo com a LGPD e sua Política de Privacidade.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>10.2.</strong> A Plataforma não coleta dados de moradores/espectadores nos Painéis.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>10.3.</strong> O Anunciante não poderá inserir Peças que promovam coleta oculta ou abusiva de dados.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Propriedade Intelectual da Plataforma</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>11.1.</strong> A Plataforma, marcas e conteúdos da EXA são protegidos por direitos de propriedade intelectual.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>11.2.</strong> É proibido copiar, modificar, revender ou explorar economicamente sem autorização.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Conduta, Segurança e Compliance</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>12.1.</strong> É proibido burlar sistemas, testar vulnerabilidades, acessar áreas não públicas, realizar engenharia reversa, enviar SPAM ou interferir no funcionamento dos Painéis.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>12.2.</strong> Anticorrupção: cumprimento da Lei 12.846/2013.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Suspensão, Encerramento e Penalidades</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>13.1.</strong> Penalidades aplicáveis:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>1ª ocorrência: advertência e retirada da Peça;</li>
                    <li>2ª ocorrência: suspensão de 10 (dez) dias;</li>
                    <li>3ª ocorrência ou caso grave: cancelamento definitivo da conta e perda de créditos.</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>13.2.</strong> Penalidades não afastam responsabilidade por indenizações.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Garantias e Limitação de Responsabilidade</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>14.1.</strong> A Plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>14.2.</strong> A EXA não responde por lucros cessantes, perda de dados ou danos indiretos.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Denúncias e Contato</h2>
                <p className="text-gray-700 leading-relaxed">
                  <strong>15.1.</strong> Denúncias sobre conteúdo ou incidentes de segurança: comercial@exapublicidade.com.br.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Alterações dos Termos</h2>
                <p className="text-gray-700 leading-relaxed">
                  <strong>16.1.</strong> A EXA poderá atualizar estes Termos a qualquer tempo, com comunicação na Plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Foro e Lei Aplicável</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>17.1.</strong> Aplica-se a legislação brasileira.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>17.2.</strong> Fica eleito o Foro da Comarca de Foz do Iguaçu/PR.
                  </p>
                </div>
              </section>

              <div className="border-t pt-8 mt-8">
                <p className="text-sm text-gray-500 text-center">
                  Indexa Midia LTDA – 38.142.638/0001-30 - Todos os direitos reservados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TermosUso;