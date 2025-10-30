import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema, createFAQSchema } from '@/components/seo/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, TrendingUp, Target, Eye, Users, DollarSign } from 'lucide-react';

const articleFAQs = [
  {
    question: 'Como calcular o ROI de publicidade em elevadores?',
    answer: 'ROI = ((Receita Gerada - Custo da Campanha) / Custo da Campanha) x 100. Para elevadores, considere vendas diretas rastreadas, aumento de tráfego e valor de marca. ROI médio é de 300-500%.'
  },
  {
    question: 'Qual é o CPM de anúncios em elevadores?',
    answer: 'O CPM (Custo por Mil Impressões) em elevadores EXA é de R$2-5, enquanto outdoor tradicional custa R$150-200 CPM. Isso torna elevadores 30-100x mais eficientes.'
  },
  {
    question: 'Quanto tempo leva para ver resultados em campanhas de elevadores?',
    answer: 'Resultados começam a aparecer na primeira semana. Campanhas bem executadas mostram pico de performance entre dias 7-21, quando o público já viu o anúncio múltiplas vezes.'
  },
  {
    question: 'Como rastrear conversões de anúncios em elevadores?',
    answer: 'Use QR codes únicos, códigos promocionais exclusivos, landing pages específicas e pergunte "Como conheceu?" no atendimento. A EXA fornece analytics detalhados.'
  }
];

const CalcularROIElevadores = () => {
  const [budget, setBudget] = useState(500);
  const [revenue, setRevenue] = useState(2500);
  
  const roi = ((revenue - budget) / budget) * 100;
  const impressions = Math.floor(budget / 0.003); // CPM de R$3
  const cpm = (budget / impressions) * 1000;

  return (
    <Layout>
      <SEO
        title="Como Calcular ROI de Publicidade em Elevadores: Guia Completo 2025"
        description="Aprenda a calcular o ROI real de campanhas em painéis de elevadores. Fórmulas práticas, calculadora gratuita, benchmarks do mercado e estratégias para maximizar retorno."
        keywords="calcular ROI elevador, ROI mídia indoor, quanto vale pena anunciar elevador, retorno publicidade prédio, métricas publicidade elevador, CPM elevador"
        canonical="https://exa.com.br/blog/calcular-roi-elevadores"
        ogImage="https://exa.com.br/blog/og-calcular-roi.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Blog', url: 'https://exa.com.br/blog' },
            { name: 'Calcular ROI Elevadores', url: 'https://exa.com.br/blog/calcular-roi-elevadores' }
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
              Como Calcular ROI de Publicidade em Elevadores: Guia Completo 2025
            </h1>
            <div className="flex items-center text-gray-600 mb-6">
              <time dateTime="2025-01-22">22 de janeiro de 2025</time>
              <span className="mx-3">•</span>
              <span>12 min de leitura</span>
            </div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Calcular o ROI de publicidade em elevadores é essencial para justificar investimentos e otimizar campanhas. Neste guia, você aprenderá fórmulas práticas, benchmarks reais e estratégias comprovadas para maximizar retorno.
            </p>
          </header>

          {/* Calculadora Interativa */}
          <div className="bg-gradient-to-br from-exa-purple to-exa-purple-dark rounded-2xl p-8 text-white mb-12">
            <div className="flex items-center mb-6">
              <Calculator className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-bold">Calculadora de ROI Interativa</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Investimento Mensal (R$)</label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="bg-white text-gray-900"
                  min={100}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Receita Gerada (R$)</label>
                <Input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                  className="bg-white text-gray-900"
                  min={0}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">ROI</p>
                <p className="text-3xl font-bold text-exa-mint">{roi.toFixed(0)}%</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">Impressões</p>
                <p className="text-3xl font-bold">{impressions.toLocaleString()}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm opacity-90 mb-1">CPM</p>
                <p className="text-3xl font-bold">R$ {cpm.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Conteúdo do Artigo */}
          <div className="prose prose-lg max-w-none">
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <DollarSign className="h-8 w-8 mr-3 text-exa-purple" />
              A Fórmula Básica de ROI
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              O cálculo de ROI (Return on Investment) é simples, mas sua aplicação correta em publicidade indoor requer atenção aos detalhes:
            </p>
            <div className="bg-gray-100 p-6 rounded-lg my-6">
              <p className="text-center text-2xl font-bold text-exa-purple mb-4">
                ROI = ((Receita - Investimento) / Investimento) × 100
              </p>
              <p className="text-gray-600 text-center">
                Exemplo: Investiu R$ 500, gerou R$ 2.500 → ROI = 400%
              </p>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Componentes do Investimento</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para calcular corretamente, considere TODOS os custos:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Espaço publicitário:</strong> Planos EXA começam em R$ 297/mês</li>
              <li><strong>Criação de conteúdo:</strong> Design e vídeo (R$ 200-800 ou gratuito via EXA)</li>
              <li><strong>Gestão de campanha:</strong> Seu tempo ou agência (considere custo/hora)</li>
              <li><strong>Impressão QR codes:</strong> Se usar materiais físicos complementares</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Componentes da Receita</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Receita não é apenas vendas diretas. Inclua:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Vendas rastreadas:</strong> Via QR code, cupom exclusivo ou "Como nos conheceu?"</li>
              <li><strong>Lifetime Value (LTV):</strong> Valor do cliente ao longo do tempo, não apenas primeira compra</li>
              <li><strong>Tráfego qualificado:</strong> Visitas ao site/loja vindas da campanha</li>
              <li><strong>Brand awareness:</strong> Valor da exposição da marca (calcular como CPM)</li>
            </ul>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Target className="h-8 w-8 mr-3 text-exa-purple" />
              Métricas Complementares Essenciais
            </h2>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">1. CPM (Custo por Mil Impressões)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              CPM mede quanto você paga para atingir 1.000 pessoas:
            </p>
            <div className="bg-exa-mint/10 border-l-4 border-exa-purple p-6 my-6 rounded-r-lg">
              <p className="text-gray-800 font-semibold mb-2">💡 Fórmula CPM:</p>
              <p className="text-gray-700 mb-4">CPM = (Custo Total / Impressões Totais) × 1.000</p>
              <p className="text-gray-700">
                <strong>Benchmark EXA:</strong> R$ 2-5 CPM<br/>
                <strong>Outdoor tradicional:</strong> R$ 150-200 CPM<br/>
                <strong>Facebook Ads:</strong> R$ 8-15 CPM
              </p>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">2. Taxa de Conversão</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Percentual de pessoas que viram o anúncio e realizaram a ação desejada:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Excelente:</strong> 5-10% (ofertas locais relevantes)</li>
              <li><strong>Boa:</strong> 2-5% (produtos/serviços gerais)</li>
              <li><strong>Média:</strong> 0.5-2% (produtos de nicho)</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">3. CAC (Custo de Aquisição de Cliente)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Quanto você paga para conquistar cada novo cliente:
            </p>
            <div className="bg-gray-100 p-6 rounded-lg my-6">
              <p className="text-center text-xl font-bold text-exa-purple mb-2">
                CAC = Custo Total da Campanha / Número de Clientes Conquistados
              </p>
              <p className="text-gray-600 text-center text-sm mt-2">
                Regra de ouro: CAC deve ser ≤ 30% do LTV do cliente
              </p>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <TrendingUp className="h-8 w-8 mr-3 text-exa-purple" />
              Cases Reais: Benchmarks por Setor
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">🏋️ Academias e Fitness</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Investimento médio: R$ 500/mês</li>
                  <li>• Novos alunos: 8-12/mês</li>
                  <li>• <strong>ROI médio: 420%</strong></li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">🍕 Restaurantes e Delivery</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Investimento médio: R$ 350/mês</li>
                  <li>• Pedidos novos: 45-70/mês</li>
                  <li>• <strong>ROI médio: 380%</strong></li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">💇 Salões e Estética</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Investimento médio: R$ 400/mês</li>
                  <li>• Novos clientes: 15-25/mês</li>
                  <li>• <strong>ROI médio: 510%</strong></li>
                </ul>
              </div>

              <div className="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">🏠 Imobiliárias</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• Investimento médio: R$ 800/mês</li>
                  <li>• Leads qualificados: 20-30/mês</li>
                  <li>• <strong>ROI médio: 650%</strong> (considerando fechamentos)</li>
                </ul>
              </div>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Eye className="h-8 w-8 mr-3 text-exa-purple" />
              7 Estratégias para Aumentar Seu ROI
            </h2>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">1. Use Ofertas com Urgência</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              "10% OFF até domingo" converte 3x mais que "Venha conhecer". Crie escassez real.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">2. QR Codes Estratégicos</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Direcione para landing page específica com oferta exclusiva. Taxa de scan em elevadores: 8-15%.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">3. Segmente Por Prédio</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Anuncie academia em prédios fitness, delivery em prédios familiares. <Link to="/loja" className="text-exa-purple hover:underline">Escolha prédios estratégicos na EXA</Link>.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">4. Teste A/B Criativo</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Alterne mensagens semanalmente. Monitore qual gera mais QR scans ou cupons resgatados.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">5. Integre com Outras Mídias</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Combine elevadores + Instagram Stories. O offline valida o online, aumentando confiança.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">6. Rastreie Tudo</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Use cupom "ELEVADOR10" ou pergunte "Como nos conheceu?" em TODA venda. Dados = otimização.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900">7. Mantenha Consistência</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              ROI explode após 3ª exposição. Campanhas de 30-60 dias superam campanhas de 7-14 dias em 250%.
            </p>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Users className="h-8 w-8 mr-3 text-exa-purple" />
              Ferramenta de Rastreamento Recomendada
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para rastrear com precisão militar, recomendamos:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Google Analytics 4:</strong> Rastreie tráfego de QR codes (UTM parameters)</li>
              <li><strong>Planilha de vendas:</strong> Registre fonte de cada cliente</li>
              <li><strong>Dashboard EXA:</strong> Impressões em tempo real por prédio</li>
              <li><strong>CRM simples:</strong> Notion, Trello ou até Excel para atribuição</li>
            </ul>

            {/* FAQs */}
            <h2 className="text-3xl font-bold mt-16 mb-8 text-gray-900">
              Perguntas Frequentes
            </h2>
            <div className="space-y-6">
              {articleFAQs.map((faq, index) => (
                <div key={index} className="border-l-4 border-exa-purple pl-6 py-2">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>

            {/* Conclusão e CTA */}
            <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark rounded-2xl p-8 text-white mt-16">
              <h2 className="text-3xl font-bold mb-4">Pronto Para Calcular Seu ROI Real?</h2>
              <p className="text-lg mb-6 opacity-90">
                Comece sua primeira campanha em painéis de elevadores e use nossa calculadora para acompanhar resultados em tempo real.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/loja">
                  <Button className="bg-exa-mint text-exa-purple-dark hover:bg-exa-mint-dark font-semibold">
                    Ver Prédios Disponíveis
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-exa-purple">
                    Falar com Especialista
                  </Button>
                </Link>
              </div>
            </div>

            {/* Internal Links */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4">📚 Leia Também:</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog/publicidade-elevadores-roi" className="text-exa-purple hover:underline">
                    → 5 Motivos Para Anunciar em Elevadores: O Guia Completo de ROI
                  </Link>
                </li>
                <li>
                  <Link to="/comparativo-outdoor" className="text-exa-purple hover:underline">
                    → Comparativo: Elevadores vs Outdoor - Qual é Melhor?
                  </Link>
                </li>
                <li>
                  <Link to="/sou-sindico" className="text-exa-purple hover:underline">
                    → Síndicos: Como Instalar Painéis Gratuitamente no Seu Prédio
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default CalcularROIElevadores;
