import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Shield, Eye } from 'lucide-react';

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
                Termos de Uso
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </CardHeader>
            
            <CardContent className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  1. Aceitação dos Termos
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Ao acessar e usar a plataforma Indexa, você concorda em cumprir e estar sujeito aos seguintes termos e condições de uso. Se você não concordar com algum destes termos, não deve usar nossos serviços.
                </p>
              </section>

              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Eye className="h-5 w-5 mr-2 text-primary" />
                  2. Descrição dos Serviços
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  A Indexa oferece uma plataforma digital para:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Gestão e exibição de conteúdo publicitário em painéis digitais</li>
                  <li>Criação e gerenciamento de campanhas publicitárias</li>
                  <li>Análise de performance e métricas de campanhas</li>
                  <li>Ferramentas de comunicação entre anunciantes e proprietários</li>
                </ul>
              </section>

              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  3. Cadastro e Conta de Usuário
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.1 Registro:</strong> Para utilizar nossos serviços, você deve criar uma conta fornecendo informações precisas e atualizadas.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.2 Verificação de Email:</strong> É obrigatória a confirmação do endereço de email fornecido. O acesso às funcionalidades da plataforma será liberado apenas após essa confirmação.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.3 Responsabilidade:</strong> Você é responsável por manter a confidencialidade de sua conta e senha.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Uso Permitido</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Você concorda em usar a plataforma apenas para fins legítimos e de acordo com estes termos. É proibido:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Usar a plataforma para atividades ilegais ou não autorizadas</li>
                  <li>Tentar obter acesso não autorizado a qualquer parte da plataforma</li>
                  <li>Interferir ou interromper o funcionamento da plataforma</li>
                  <li>Usar conteúdo ofensivo, difamatório ou que viole direitos de terceiros</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Pagamentos e Reembolsos</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.1 Preços:</strong> Os preços dos serviços estão sujeitos a alterações sem aviso prévio.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.2 Pagamento:</strong> O pagamento deve ser efetuado de acordo com as opções disponibilizadas na plataforma.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.3 Reembolsos:</strong> Política de reembolso será aplicada conforme os termos específicos de cada serviço.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
                <p className="text-gray-700 leading-relaxed">
                  Todo o conteúdo da plataforma, incluindo textos, gráficos, logotipos, ícones, imagens, áudios e software, é propriedade da Indexa ou de seus licenciadores e está protegido por leis de direitos autorais.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitação de Responsabilidade</h2>
                <p className="text-gray-700 leading-relaxed">
                  A Indexa não será responsável por danos diretos, indiretos, incidentais, especiais ou consequenciais resultantes do uso ou incapacidade de usar a plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Modificações dos Termos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contato</h2>
                <p className="text-gray-700 leading-relaxed">
                  Para questões sobre estes termos, entre em contato conosco através dos canais oficiais disponibilizados na plataforma.
                </p>
              </section>

              <div className="border-t pt-8 mt-8">
                <p className="text-sm text-gray-500 text-center">
                  Indexa - Todos os direitos reservados
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