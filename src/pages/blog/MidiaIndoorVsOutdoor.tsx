import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema, createFAQSchema } from '@/components/seo/schemas';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, DollarSign, Target, TrendingUp, Cloud, Clock } from 'lucide-react';

const articleFAQs = [
  {
    question: 'Qual é melhor: mídia indoor ou outdoor?',
    answer: 'Depende do objetivo. Indoor (elevadores) é melhor para conversão, público segmentado e ROI alto. Outdoor é melhor para brand awareness massivo. Muitas empresas usam ambos estrategicamente.'
  },
  {
    question: 'Mídia indoor funciona para meu negócio local?',
    answer: 'Sim! Negócios locais (academias, restaurantes, salões) têm ROI 40% maior em indoor vs outdoor, pois atingem o público certo no raio de ação do estabelecimento.'
  },
  {
    question: 'Qual o custo comparativo entre indoor e outdoor?',
    answer: 'Outdoor: R$ 5.000-15.000/mês. Indoor (EXA): R$ 297-2.500/mês. Indoor oferece CPM 30x menor e taxa de atenção 30x maior que outdoor.'
  }
];

const MidiaIndoorVsOutdoor = () => {
  return (
    <Layout>
      <SEO
        title="Mídia Indoor vs Outdoor: Guia Completo Para Escolher [2025]"
        description="Comparação detalhada entre publicidade indoor e outdoor. Custos, ROI, casos de uso, vantagens e quando usar cada formato. Tabela comparativa completa + exemplos reais."
        keywords="mídia indoor vs outdoor, outdoor ou elevador, publicidade indoor vantagens, diferença indoor outdoor, melhor tipo publicidade negócio local"
        canonical="https://exa.com.br/blog/midia-indoor-vs-outdoor"
        ogImage="https://exa.com.br/blog/og-indoor-outdoor.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Blog', url: 'https://exa.com.br/blog' },
            { name: 'Indoor vs Outdoor', url: 'https://exa.com.br/blog/midia-indoor-vs-outdoor' }
          ]),
          createFAQSchema(articleFAQs)
        ]}
      />
      <article className="min-h-screen bg-white pt-4 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <header className="mb-12">
            <div className="mb-4">
              <Link to="/blog" className="text-exa-purple hover:text-exa-purple-dark font-medium">
                ← Voltar ao Blog
              </Link>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Mídia Indoor vs Outdoor: Guia Completo Para Escolher em 2025
            </h1>
            <div className="flex items-center text-gray-600 mb-6">
              <time dateTime="2025-01-21">21 de janeiro de 2025</time>
              <span className="mx-3">•</span>
              <span>15 min de leitura</span>
            </div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Indoor ou outdoor? Esta decisão pode fazer ou quebrar seu orçamento de marketing. Descubra as diferenças críticas, quando usar cada formato e como combinar ambos para resultados explosivos.
            </p>
          </header>

          <div className="prose prose-lg max-w-none">
            {/* Tabela Comparativa Visual */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 mb-12 border border-gray-200">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                Comparação Rápida: Indoor vs Outdoor
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white">
                      <th className="p-4 text-left font-bold">Critério</th>
                      <th className="p-4 text-center font-bold">Indoor (Elevadores)</th>
                      <th className="p-4 text-center font-bold">Outdoor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white border-b">
                      <td className="p-4 font-semibold">Custo/mês</td>
                      <td className="p-4 text-center text-green-600 font-bold">R$ 297 - R$ 2.500</td>
                      <td className="p-4 text-center text-red-600 font-bold">R$ 5.000 - R$ 15.000</td>
                    </tr>
                    <tr className="bg-gray-50 border-b">
                      <td className="p-4 font-semibold">Taxa de atenção</td>
                      <td className="p-4 text-center">
                        <span className="text-green-600 font-bold flex items-center justify-center">
                          <Check className="h-5 w-5 mr-2" /> 94%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-red-600 font-bold flex items-center justify-center">
                          <X className="h-5 w-5 mr-2" /> 3%
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-white border-b">
                      <td className="p-4 font-semibold">Tempo de exposição</td>
                      <td className="p-4 text-center text-green-600 font-bold">30-60 segundos</td>
                      <td className="p-4 text-center text-red-600">2-5 segundos</td>
                    </tr>
                    <tr className="bg-gray-50 border-b">
                      <td className="p-4 font-semibold">Segmentação</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <X className="h-5 w-5 text-red-600 mx-auto" />
                      </td>
                    </tr>
                    <tr className="bg-white border-b">
                      <td className="p-4 font-semibold">ROI médio</td>
                      <td className="p-4 text-center text-green-600 font-bold">300-500%</td>
                      <td className="p-4 text-center text-orange-600 font-bold">80-150%</td>
                    </tr>
                    <tr className="bg-gray-50 border-b">
                      <td className="p-4 font-semibold">Afetado pelo clima</td>
                      <td className="p-4 text-center">
                        <X className="h-5 w-5 text-green-600 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-red-600 mx-auto" />
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-4 font-semibold">CPM (custo/mil)</td>
                      <td className="p-4 text-center text-green-600 font-bold">R$ 2-5</td>
                      <td className="p-4 text-center text-red-600 font-bold">R$ 150-200</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Eye className="h-8 w-8 mr-3 text-exa-purple" />
              O Que É Mídia Indoor?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mídia indoor (ou mídia Out-of-Home indoor - OOH Indoor) refere-se a anúncios exibidos em <strong>ambientes fechados</strong>, como:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Elevadores</strong> (como a <Link to="/loja" className="text-exa-purple hover:underline">rede EXA</Link>)</li>
              <li>Shoppings centers e lojas de varejo</li>
              <li>Academias e clubes</li>
              <li>Aeroportos e rodoviárias</li>
              <li>Consultórios e clínicas</li>
              <li>Bares e restaurantes</li>
            </ul>

            <div className="bg-exa-mint/10 border-l-4 border-exa-purple p-6 my-6 rounded-r-lg">
              <p className="text-gray-800 font-semibold mb-2">✅ Vantagens da Mídia Indoor:</p>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Audiência cativa:</strong> Público preso no local (elevador, fila, espera)</li>
                <li>• <strong>Alta taxa de atenção:</strong> Poucas distrações no ambiente</li>
                <li>• <strong>Segmentação precisa:</strong> Escolha exata do perfil demográfico</li>
                <li>• <strong>Clima controlado:</strong> Não afetado por chuva, sol ou vento</li>
                <li>• <strong>Menor custo:</strong> 5-10x mais barato que outdoor tradicional</li>
              </ul>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Cloud className="h-8 w-8 mr-3 text-exa-purple" />
              O Que É Mídia Outdoor?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mídia outdoor (OOH - Out-of-Home) são anúncios exibidos em <strong>espaços públicos externos</strong>:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Outdoors tradicionais</strong> em rodovias e avenidas</li>
              <li>Painéis digitais em vias públicas</li>
              <li>Busdoors e adesivos de veículos</li>
              <li>Relógios de rua e mobiliário urbano</li>
              <li>Fachadas de prédios</li>
            </ul>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-6 my-6 rounded-r-lg">
              <p className="text-gray-800 font-semibold mb-2">⚠️ Desafios da Mídia Outdoor:</p>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Baixa taxa de atenção:</strong> Pessoas no trânsito, distraídas</li>
                <li>• <strong>Tempo de exposição curto:</strong> 2-5 segundos em média</li>
                <li>• <strong>Segmentação limitada:</strong> Atinge público massivo e genérico</li>
                <li>• <strong>Clima afeta visibilidade:</strong> Chuva, neblina reduzem impacto</li>
                <li>• <strong>Custo elevado:</strong> Requer grandes investimentos mensais</li>
              </ul>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Target className="h-8 w-8 mr-3 text-exa-purple" />
              Quando Usar Mídia Indoor (Elevadores)?
            </h2>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">✅ Ideal Para:</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">🎯 Negócios Locais</p>
                <p className="text-gray-700">
                  Academias, salões, restaurantes, clínicas, pet shops. Se seu cliente mora/trabalha no raio de 5km, indoor é perfeito.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">💰 Orçamento R$ 300 - R$ 5.000/mês</p>
                <p className="text-gray-700">
                  Pequenas e médias empresas que precisam de ROI alto com investimento controlado.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">🎨 Campanhas de Conversão</p>
                <p className="text-gray-700">
                  Ofertas com urgência, cupons, QR codes para ação imediata. Indoor gera conversão 3-5x maior.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">👨‍👩‍👧 Segmentação Demográfica</p>
                <p className="text-gray-700">
                  Público classe A/B, famílias, idosos, profissionais liberais. Escolha o prédio certo.
                </p>
              </div>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <TrendingUp className="h-8 w-8 mr-3 text-exa-purple" />
              Quando Usar Mídia Outdoor?
            </h2>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">✅ Ideal Para:</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">📢 Brand Awareness Massivo</p>
                <p className="text-gray-700">
                  Grandes marcas que querem atingir milhões. Campanhas de lançamento de produto nacional.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">💵 Orçamento acima de R$ 20.000/mês</p>
                <p className="text-gray-700">
                  Empresas com grande capital que querem presença massiva e podem sustentar CPM alto.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">🌎 Alcance Geográfico Amplo</p>
                <p className="text-gray-700">
                  Produtos/serviços com apelo universal que se beneficiam de exposição massiva.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="font-bold text-gray-900 mb-2">🎭 Mensagens Simples</p>
                <p className="text-gray-700">
                  Campanhas com mensagem única e visual impactante (máx. 7 palavras). Público vê em 2 segundos.
                </p>
              </div>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <DollarSign className="h-8 w-8 mr-3 text-exa-purple" />
              Análise de Custo-Benefício Real
            </h2>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Cenário: Restaurante Local em Foz do Iguaçu</h3>
            
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <h4 className="font-bold text-lg mb-4 text-gray-900">💚 Opção Indoor (EXA)</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Investimento:</strong> R$ 500/mês</li>
                  <li>• <strong>Prédios:</strong> 5 prédios classe A/B próximos</li>
                  <li>• <strong>Impressões:</strong> ~15.000/mês</li>
                  <li>• <strong>Conversões estimadas:</strong> 50-80 novos clientes</li>
                  <li>• <strong>Receita gerada:</strong> R$ 3.000-5.000</li>
                  <li className="font-bold text-green-700 pt-2">✅ ROI: 500-900%</li>
                </ul>
              </div>

              <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                <h4 className="font-bold text-lg mb-4 text-gray-900">💔 Opção Outdoor</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Investimento:</strong> R$ 8.000/mês</li>
                  <li>• <strong>Locais:</strong> 1 outdoor em avenida</li>
                  <li>• <strong>Impressões:</strong> ~50.000/mês</li>
                  <li>• <strong>Conversões estimadas:</strong> 15-30 novos clientes</li>
                  <li>• <strong>Receita gerada:</strong> R$ 1.000-2.000</li>
                  <li className="font-bold text-red-700 pt-2">❌ ROI: -75% a -62% (PREJUÍZO)</li>
                </ul>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <strong>🎯 Conclusão:</strong> Para o restaurante local, indoor gera ROI 1500% superior ao outdoor, com investimento 16x menor. A segmentação e taxa de atenção superam o alcance massivo do outdoor.
            </p>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Clock className="h-8 w-8 mr-3 text-exa-purple" />
              Estratégia Híbrida: O Melhor dos Dois Mundos
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Empresas avançadas não escolhem entre indoor e outdoor — <strong>combinam ambos estrategicamente</strong>:
            </p>

            <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white rounded-xl p-8 my-8">
              <h3 className="text-2xl font-bold mb-4">🎯 Framework Híbrido Recomendado</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">📅 Fase 1: Lançamento (Semanas 1-2)</p>
                  <p className="opacity-90">Use outdoor para gerar awareness massivo. Invista 70% do budget aqui.</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">💰 Fase 2: Conversão (Semanas 3-8)</p>
                  <p className="opacity-90">Migre 80% do budget para indoor (elevadores). Capitalize awareness com ofertas de conversão.</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">🔄 Fase 3: Manutenção (Mês 3+)</p>
                  <p className="opacity-90">Mantenha apenas indoor com 30% do budget original. ROI se sustenta.</p>
                </div>
              </div>
            </div>

            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Check className="h-8 w-8 mr-3 text-exa-purple" />
              Checklist: Qual Formato É Para Você?
            </h2>

            <div className="bg-gray-50 p-6 rounded-lg my-6">
              <h3 className="font-bold text-lg mb-4">Responda SIM ou NÃO:</h3>
              <ul className="space-y-3 text-gray-700">
                <li>✅ Meu público está em um raio de 10km? → <strong>INDOOR</strong></li>
                <li>✅ Meu budget é menor que R$ 5.000/mês? → <strong>INDOOR</strong></li>
                <li>✅ Preciso de ROI acima de 300%? → <strong>INDOOR</strong></li>
                <li>✅ Posso segmentar por perfil demográfico? → <strong>INDOOR</strong></li>
                <li>✅ Meu produto requer explicação (mais de 10 palavras)? → <strong>INDOOR</strong></li>
                <li className="pt-4">❌ Preciso atingir milhões de pessoas? → <strong>OUTDOOR</strong></li>
                <li>❌ Meu budget é maior que R$ 20.000/mês? → <strong>OUTDOOR</strong></li>
                <li>❌ Quero apenas brand awareness (sem conversão imediata)? → <strong>OUTDOOR</strong></li>
              </ul>
            </div>

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

            {/* CTA Final */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white mt-16">
              <h2 className="text-3xl font-bold mb-4">Teste Mídia Indoor Sem Risco</h2>
              <p className="text-lg mb-6 opacity-90">
                Comece sua primeira campanha em painéis de elevadores por apenas R$ 297/mês. Sem taxa de setup, sem contrato de longo prazo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/loja">
                  <Button className="bg-white text-green-600 hover:bg-gray-100 font-semibold">
                    Ver Prédios Disponíveis
                  </Button>
                </Link>
                <Link to="/comparativo-outdoor">
                  <Button variant="outline" className="border-white text-white hover:bg-white/20">
                    Comparar com Outdoor
                  </Button>
                </Link>
              </div>
            </div>

            {/* Internal Links */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4">📚 Continue Lendo:</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog/calcular-roi-elevadores" className="text-exa-purple hover:underline">
                    → Como Calcular ROI de Publicidade em Elevadores
                  </Link>
                </li>
                <li>
                  <Link to="/blog/publicidade-elevadores-roi" className="text-exa-purple hover:underline">
                    → 5 Motivos Para Anunciar em Elevadores (ROI Comprovado)
                  </Link>
                </li>
                <li>
                  <Link to="/sou-sindico" className="text-exa-purple hover:underline">
                    → Síndicos: Instale Painéis Gratuitamente no Seu Prédio
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

export default MidiaIndoorVsOutdoor;
