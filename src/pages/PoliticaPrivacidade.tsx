import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Lock, Eye, UserCheck, Mail } from 'lucide-react';

const PoliticaPrivacidade = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                Política de Privacidade
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </CardHeader>
            
            <CardContent className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Eye className="h-5 w-5 mr-2 text-primary" />
                  1. Informações que Coletamos
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>1.1 Informações de Cadastro:</strong> Nome completo, endereço de email, CPF/CNPJ e informações de contato.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>1.2 Informações de Uso:</strong> Dados sobre como você utiliza nossa plataforma, incluindo páginas visitadas, tempo de navegação e interações.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>1.3 Informações Técnicas:</strong> Endereço IP, tipo de navegador, sistema operacional e dados de localização aproximada.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Database className="h-5 w-5 mr-2 text-primary" />
                  2. Como Utilizamos suas Informações
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Processar pagamentos e gerenciar sua conta</li>
                  <li>Enviar comunicações importantes sobre o serviço</li>
                  <li>Personalizar sua experiência na plataforma</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <UserCheck className="h-5 w-5 mr-2 text-primary" />
                  3. Verificação de Email
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.1 Confirmação Obrigatória:</strong> Para garantir a segurança e autenticidade das contas, é obrigatória a confirmação do endereço de email fornecido no cadastro.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.2 Acesso às Funcionalidades:</strong> O acesso completo às funcionalidades da plataforma, incluindo a aquisição de espaços publicitários, será liberado apenas após a confirmação do email.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>3.3 Reenvio de Confirmação:</strong> Caso não receba o email de confirmação, você pode solicitar o reenvio através da plataforma.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Lock className="h-5 w-5 mr-2 text-primary" />
                  4. Compartilhamento de Informações
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Quando necessário para fornecer nossos serviços</li>
                  <li>Para cumprir obrigações legais</li>
                  <li>Para proteger nossos direitos e propriedade</li>
                  <li>Com seu consentimento explícito</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Segurança dos Dados</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.1 Medidas de Proteção:</strong> Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.2 Criptografia:</strong> Utilizamos protocolos de criptografia para proteger dados sensíveis durante a transmissão.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    <strong>5.3 Acesso Restrito:</strong> O acesso às suas informações é limitado apenas aos funcionários que precisam dessas informações para desempenhar suas funções.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Seus Direitos (LGPD)</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Confirmar a existência de tratamento de seus dados</li>
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                  <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                  <li>Solicitar a portabilidade de seus dados</li>
                  <li>Revogar seu consentimento a qualquer momento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookies e Tecnologias Similares</h2>
                <p className="text-gray-700 leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Retenção de Dados</h2>
                <p className="text-gray-700 leading-relaxed">
                  Mantemos suas informações pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, exceto quando um período de retenção mais longo for exigido ou permitido por lei.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Alterações na Política</h2>
                <p className="text-gray-700 leading-relaxed">
                  Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através da plataforma ou por email.
                </p>
              </section>

              <section>
                <h2 className="flex items-center text-xl font-semibold text-gray-900 mb-4">
                  <Mail className="h-5 w-5 mr-2 text-primary" />
                  10. Contato
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Para questões sobre esta política de privacidade ou exercer seus direitos, entre em contato conosco através dos canais oficiais disponibilizados na plataforma ou pelo email: privacidade@indexa.com
                </p>
              </section>

              <div className="border-t pt-8 mt-8">
                <p className="text-sm text-gray-500 text-center">
                  Indexa - Comprometidos com a proteção de seus dados pessoais
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PoliticaPrivacidade;