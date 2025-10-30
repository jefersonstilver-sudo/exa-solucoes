import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema, createFAQSchema } from '@/components/seo/schemas';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Eye, DollarSign, Users } from 'lucide-react';

const articleFAQs = [
  {
    question: 'Qual o ROI médio de anúncios em elevadores?',
    answer: 'O ROI médio de campanhas em elevadores varia entre 300% a 500%, dependendo do setor e estratégia. Estabelecimentos locais costumam ver retornos ainda maiores devido à segmentação geográfica.'
  },
  {
    question: 'Quanto custa anunciar em painéis de elevador?',
    answer: 'Os planos da EXA começam em R$297/mês, oferecendo exposição em múltiplos prédios. O custo por impressão é significativamente menor que mídia tradicional, com CPM a partir de R$2.'
  },
  {
    question: 'Como medir o sucesso de uma campanha em elevadores?',
    answer: 'Medimos através de impressões diárias, taxa de visualização, conversões rastreadas por QR codes, aumento de tráfego web/loja física e retorno sobre investimento total.'
  }
];

const PublicidadeElevadoresROI = () => {
  return (
    <Layout>
      <SEO
        title="5 Motivos Para Anunciar em Elevadores: ROI Comprovado [2025]"
        description="Descubra por que anúncios em elevadores geram até 500% de ROI. Dados reais, comparativo de custos e estratégias para maximizar resultados da sua campanha."
        keywords="ROI publicidade elevador, quanto custa anunciar elevador, retorno investimento mídia indoor, anúncio elevador funciona, CPM publicidade prédio"
        canonical="https://exa.com.br/blog/publicidade-elevadores-roi"
        ogImage="https://exa.com.br/blog/og-roi-elevadores.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Blog', url: 'https://exa.com.br/blog' },
            { name: 'ROI Publicidade Elevadores', url: 'https://exa.com.br/blog/publicidade-elevadores-roi' }
          ]),
          createFAQSchema(articleFAQs)
        ]}
      />
      <article className="min-h-screen bg-white pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {/* Header do Artigo */}
          <header className="mb-12">
            <div className="mb-4">
              <Link to="/blog" className="text-exa-purple hover:text-exa-purple-dark font-medium">
                ← Voltar ao Blog
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              5 Motivos Para Anunciar em Elevadores: O Guia Completo de ROI
            </h1>
            <div className="flex items-center text-gray-600 mb-6">
              <time dateTime="2025-01-20">20 de janeiro de 2025</time>
              <span className="mx-3">•</span>
              <span>8 min de leitura</span>
            </div>
            <p className="text-xl text-gray-700 leading-relaxed">
              A publicidade em elevadores está revolucionando o mercado de mídia indoor, oferecendo ROIs impressionantes de até 500%. Descubra por que este canal está se tornando a escolha preferida de anunciantes inteligentes.
            </p>
          </header>

          {/* Conteúdo do Artigo */}
          <div className="prose prose-lg max-w-none">
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <TrendingUp className="h-8 w-8 mr-3 text-exa-purple" />
              1. Audiência Cativa e Tempo de Exposição Garantido
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Diferente de outdoors em rodovias ou anúncios em TV que podem ser ignorados, os painéis em elevadores contam com uma <strong>audiência cativa</strong>. Durante os 30-60 segundos de viagem, os passageiros não têm para onde olhar.
            </p>
            <div className="bg-exa-mint/10 border-l-4 border-exa-purple p-6 my-6 rounded-r-lg">
              <p className="text-gray-800 font-semibold mb-2">📊 Dados de Performance:</p>
              <ul className="text-gray-700 space-y-2">
                <li>• Tempo médio de exposição: <strong>45 segundos por viagem</strong></li>
                <li>• Taxa de visualização: <strong>94%</strong> (vs. 12% de banners online)</li>
                <li>• Frequência: <strong>8-12 exposições/dia</strong> por morador</li>
              </ul>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Target className="h-8 w-8 mr-3 text-exa-purple" />
              2. Segmentação Demográfica Precisa
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Com a <Link to="/loja" className="text-exa-purple hover:underline">plataforma EXA</Link>, você escolhe exatamente em quais prédios anunciar, permitindo segmentação por:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Perfil socioeconômico</strong>: Prédios classes A, B ou populares</li>
              <li><strong>Localização</strong>: Centros comerciais, bairros residenciais, áreas turísticas</li>
              <li><strong>Tipo de público</strong>: Famílias, executivos, estudantes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Essa precisão elimina desperdício de verba, garantindo que cada centavo seja investido no público certo.
            </p>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <DollarSign className="h-8 w-8 mr-3 text-exa-purple" />
              3. Custo Por Mil Impressões (CPM) Imbatível
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Veja a comparação de CPM entre diferentes mídias:
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-exa-purple text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Tipo de Mídia</th>
                    <th className="py-3 px-4 text-left">CPM Médio</th>
                    <th className="py-3 px-4 text-left">Qualidade Atenção</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-t">
                    <td className="py-3 px-4">Painéis em Elevadores (EXA)</td>
                    <td className="py-3 px-4 font-bold text-green-600">R$ 2-5</td>
                    <td className="py-3 px-4">⭐⭐⭐⭐⭐</td>
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="py-3 px-4">Facebook/Instagram Ads</td>
                    <td className="py-3 px-4">R$ 15-30</td>
                    <td className="py-3 px-4">⭐⭐</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3 px-4">Google Display Network</td>
                    <td className="py-3 px-4">R$ 8-20</td>
                    <td className="py-3 px-4">⭐⭐</td>
                  </tr>
                  <tr className="border-t bg-gray-50">
                    <td className="py-3 px-4">Outdoor Tradicional</td>
                    <td className="py-3 px-4">R$ 10-25</td>
                    <td className="py-3 px-4">⭐⭐⭐</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Com <Link to="/comparativo-outdoor" className="text-exa-purple hover:underline">custos até 5x menores que outdoor tradicional</Link>, o ROI dispara.
            </p>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Eye className="h-8 w-8 mr-3 text-exa-purple" />
              4. Alta Taxa de Recall e Conversão
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estudos de neuromarketing mostram que anúncios em ambientes fechados e repetidos múltiplas vezes ao dia geram <strong>recall de marca até 3x superior</strong> comparado a mídias tradicionais.
            </p>
            <div className="bg-blue-50 p-6 rounded-lg my-6">
              <h3 className="font-bold text-xl mb-4 text-gray-900">Case Real: Restaurante Local</h3>
              <p className="text-gray-700 mb-3">
                Um restaurante em Foz do Iguaçu investiu <strong>R$ 890/mês</strong> (Plano Expansão) em 3 prédios próximos:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✅ <strong>+47% de clientes novos</strong> no primeiro mês</li>
                <li>✅ <strong>ROI de 420%</strong> em 90 dias</li>
                <li>✅ <strong>86% dos clientes</strong> conheceram pelo painel</li>
              </ul>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Users className="h-8 w-8 mr-3 text-exa-purple" />
              5. Rastreamento e Otimização em Tempo Real
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Diferente de mídias offline tradicionais, os painéis digitais da EXA oferecem:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Dashboard em tempo real</strong> com impressões e horários de pico</li>
              <li><strong>QR codes rastreáveis</strong> para medir conversões diretas</li>
              <li><strong>Testes A/B</strong> de criativos sem custo adicional</li>
              <li><strong>Relatórios de performance</strong> detalhados mensais</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você pode ajustar sua campanha com agilidade, maximizando continuamente o ROI.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900">
              Conclusão: O Momento de Investir É Agora
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Com CPM baixíssimo, audiência cativa, segmentação precisa e métricas transparentes, a publicidade em elevadores oferece um dos melhores ROIs do mercado de mídia.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Enquanto este canal ainda está crescendo, empresas que entrarem agora terão vantagem competitiva significativa antes que o mercado fique saturado.
            </p>
          </div>

          {/* CTA Final */}
          <div className="mt-16 p-8 bg-gradient-to-r from-exa-purple to-exa-purple-dark rounded-2xl text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para testar a publicidade em elevadores?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Comece com apenas R$ 297/mês e veja os resultados por si mesmo
            </p>
            <Link to="/loja">
              <Button className="bg-exa-mint text-exa-purple-dark hover:bg-exa-mint-dark font-semibold px-8 py-3 text-lg">
                Ver Planos Disponíveis
              </Button>
            </Link>
          </div>

          {/* FAQ */}
          <div className="mt-16 border-t pt-12">
            <h3 className="text-3xl font-bold mb-8 text-gray-900">Perguntas Frequentes</h3>
            <div className="space-y-6">
              {articleFAQs.map((faq, index) => (
                <div key={index} className="border-l-4 border-exa-purple pl-6">
                  <h4 className="text-xl font-semibold mb-3 text-gray-900">{faq.question}</h4>
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Links Relacionados */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Leia também:</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog/midia-indoor-vs-outdoor" className="text-exa-purple hover:underline">
                  → Mídia Indoor vs Outdoor: Qual É Melhor Para Seu Negócio?
                </Link>
              </li>
              <li>
                <Link to="/comparativo-outdoor" className="text-exa-purple hover:underline">
                  → Calculadora de ROI: Compare Elevadores vs Outdoor
                </Link>
              </li>
              <li>
                <Link to="/blog/como-escolher-predio-ideal" className="text-exa-purple hover:underline">
                  → Como Escolher o Prédio Ideal Para Sua Campanha
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default PublicidadeElevadoresROI;
