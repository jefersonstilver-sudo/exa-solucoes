import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema, createFAQSchema } from '@/components/seo/schemas';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Users, DollarSign, Calendar, Award } from 'lucide-react';

const articleFAQs = [
  {
    question: 'Como uma academia pequena consegue 300% de crescimento?',
    answer: 'Com mídia hipersegmentada em prédios próximos, ofertas irresistíveis e rastreamento preciso. A chave é atingir moradores no raio de 1km com mensagens personalizadas.'
  },
  {
    question: 'Quanto tempo levou para ver os primeiros resultados?',
    answer: 'Na primeira semana, 8 novos alunos. O crescimento acelerou nas semanas 3-6, quando moradores já tinham visto o anúncio múltiplas vezes e tomaram ação.'
  },
  {
    question: 'Publicidade em elevadores funciona para academias?',
    answer: 'Sim! Academias são o setor #1 em ROI de elevadores, com média de 450%. O público mora perto, precisa do serviço e o anúncio reforça diariamente.'
  }
];

const CaseSucessoAcademia = () => {
  return (
    <Layout>
      <SEO
        title="Case: Como Academia Local Cresceu 300% com Painéis em Elevadores [2025]"
        description="História real de uma academia em Foz do Iguaçu que investiu R$ 800 em painéis de elevadores e conquistou 64 novos alunos em 60 dias. Estratégias replicáveis e números detalhados."
        keywords="case sucesso academia, publicidade academia elevador, como divulgar academia, crescer academia local, marketing academia condomínio"
        canonical="https://exa.com.br/blog/case-sucesso-academia"
        ogImage="https://exa.com.br/blog/og-case-academia.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Blog', url: 'https://exa.com.br/blog' },
            { name: 'Case Academia', url: 'https://exa.com.br/blog/case-sucesso-academia' }
          ]),
          createFAQSchema(articleFAQs)
        ]}
      />
      <article className="min-h-screen bg-white pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <header className="mb-12">
            <div className="mb-4">
              <Link to="/blog" className="text-exa-purple hover:text-exa-purple-dark font-medium">
                ← Voltar ao Blog
              </Link>
            </div>
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ✅ CASE DE SUCESSO REAL
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Como Academia Local Cresceu 300% com Painéis em Elevadores
            </h1>
            <div className="flex items-center text-gray-600 mb-6">
              <time dateTime="2025-01-24">24 de janeiro de 2025</time>
              <span className="mx-3">•</span>
              <span>14 min de leitura</span>
            </div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Esta é a história real de como a FitLife Academia, uma pequena academia em Foz do Iguaçu, transformou R$ 800 em publicidade em elevadores em 64 novos alunos e R$ 38.400 de receita anual recorrente. Cada estratégia é replicável para seu negócio.
            </p>
          </header>

          <div className="prose prose-lg max-w-none">
            {/* Resultados de Impacto */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white mb-12">
              <h2 className="text-3xl font-bold mb-6 flex items-center">
                <Award className="h-8 w-8 mr-3" />
                Resultados em 60 Dias
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-sm opacity-90 mb-2">Investimento Total</p>
                  <p className="text-4xl font-bold">R$ 800</p>
                  <p className="text-sm opacity-90 mt-2">2 meses de campanha</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-sm opacity-90 mb-2">Novos Alunos</p>
                  <p className="text-4xl font-bold">64</p>
                  <p className="text-sm opacity-90 mt-2">Taxa de conversão: 4.8%</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-sm opacity-90 mb-2">Receita Gerada (12 meses)</p>
                  <p className="text-4xl font-bold">R$ 38.400</p>
                  <p className="text-sm opacity-90 mt-2">LTV médio: R$ 600/aluno</p>
                </div>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-sm opacity-90 mb-2">ROI</p>
                  <p className="text-4xl font-bold">4.700%</p>
                  <p className="text-sm opacity-90 mt-2">CAC: R$ 12,50/aluno</p>
                </div>
              </div>
            </div>

            {/* Contexto: O Antes */}
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Users className="h-8 w-8 mr-3 text-exa-purple" />
              O Cenário: Academia Lutando Para Crescer
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              A <strong>FitLife Academia</strong> abriu em março de 2024 em Foz do Iguaçu. Apesar de excelente localização (próxima a 8 prédios residenciais), estrutura moderna e professores qualificados, enfrentava um problema crônico:
            </p>

            <div className="bg-red-50 border-l-4 border-red-500 p-6 my-6 rounded-r-lg">
              <p className="font-semibold text-red-800 mb-3">❌ Problemas Antes da Campanha EXA:</p>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Baixo tráfego espontâneo:</strong> 2-5 consultas/semana</li>
                <li>• <strong>Dependência de indicações:</strong> 80% dos alunos vinham de boca a boca</li>
                <li>• <strong>Investimento desperdiçado:</strong> R$ 3.500 em Google Ads geraram apenas 8 matrículas</li>
                <li>• <strong>Crescimento lento:</strong> 45 alunos após 6 meses de operação</li>
                <li>• <strong>Concorrência forte:</strong> 3 redes grandes no raio de 3km</li>
              </ul>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              O dono, <strong>Rafael</strong>, estava a ponto de desistir quando descobriu a <Link to="/loja" className="text-exa-purple hover:underline">rede EXA de painéis digitais em elevadores</Link>.
            </p>

            {/* A Decisão */}
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Target className="h-8 w-8 mr-3 text-exa-purple" />
              A Estratégia: Hipersegmentação Local
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Após análise com a equipe EXA, Rafael montou uma estratégia cirúrgica:
            </p>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">1. Seleção de Prédios (Fator Crítico)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Escolheu <strong>6 prédios específicos</strong> em um raio de 800m da academia:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>3 prédios classe A:</strong> Foco em planos premium (R$ 150/mês)</li>
              <li><strong>2 prédios classe B:</strong> Planos intermediários (R$ 100/mês)</li>
              <li><strong>1 prédio corporativo:</strong> Planos empresariais (R$ 120/mês)</li>
            </ul>

            <div className="bg-blue-50 p-6 rounded-lg my-6">
              <p className="font-semibold text-blue-800 mb-2">💡 Insight Estratégico:</p>
              <p className="text-gray-700">
                Rafael rejeitou anunciar em 10+ prédios populares distantes. Preferiu <strong>concentrar fogo</strong> em poucos prédios próximos e alinhados ao perfil ideal. Resultado: custo menor, conversão maior.
              </p>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">2. Criativo Personalizado Por Prédio</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Em vez de usar 1 anúncio genérico, criou 3 versões personalizadas:
            </p>

            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-bold text-gray-900">📱 Versão A (Prédios Classe A):</p>
                <p className="text-gray-700 italic mt-2">
                  "Moradores do Edifício [Nome]: Sua academia premium a 5 minutos a pé. 
                  <br/>1ª aula GRÁTIS + Avaliação física. 
                  <br/>Escaneie e reserve hoje!"
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-bold text-gray-900">📱 Versão B (Prédios Classe B):</p>
                <p className="text-gray-700 italic mt-2">
                  "Vizinhos do [Nome Prédio]: Academia completa a R$ 100/mês. 
                  <br/>Sem taxa de matrícula em Janeiro. 
                  <br/>QR para tour virtual 360°!"
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="font-bold text-gray-900">📱 Versão C (Prédio Corporativo):</p>
                <p className="text-gray-700 italic mt-2">
                  "Profissionais do [Nome Prédio]: Treine antes/depois do trabalho. 
                  <br/>Desconto 20% para grupos de 5+ colegas. 
                  <br/>Vestiários premium + Estacionamento grátis."
                </p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">3. Oferta Irresistível com Urgência</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cada anúncio incluía:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li><strong>Benefício claro:</strong> "1ª aula grátis" ou "Sem taxa de matrícula"</li>
              <li><strong>Escassez real:</strong> "Válido apenas em Janeiro" e "Primeiras 20 vagas"</li>
              <li><strong>QR code gigante:</strong> Levava direto para agendamento no WhatsApp</li>
              <li><strong>Prova social:</strong> "4.9⭐ no Google (87 avaliações)"</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-4 text-gray-900">4. Rastreamento Preciso</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para medir resultados exatos, implementou:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
              <li>QR code exclusivo por prédio (UTM tags diferentes)</li>
              <li>Cupom único: "PREDIO[NOME]" para rastrear origem</li>
              <li>Treinamento da recepção: perguntar "Como nos conheceu?" em TODA matrícula</li>
            </ul>

            {/* Timeline de Resultados */}
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Calendar className="h-8 w-8 mr-3 text-exa-purple" />
              Timeline: O Que Aconteceu Semana a Semana
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">📅 Semana 1: Awareness + Primeiros Resultados</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 47 scans no QR code</li>
                  <li>• 12 mensagens no WhatsApp</li>
                  <li>• <strong>8 matrículas confirmadas</strong></li>
                  <li>• Receita: R$ 800 (break-even!)</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">📅 Semana 2-3: Reconhecimento + Crescimento</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 89 scans no QR code (↑ 89%)</li>
                  <li>• 31 consultas via WhatsApp</li>
                  <li>• <strong>19 matrículas</strong></li>
                  <li>• Receita acumulada: R$ 2.700</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">📅 Semana 4-6: Explosão de Conversões</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 156 scans no QR code (frequência múltipla funcionando)</li>
                  <li>• 67 consultas WhatsApp</li>
                  <li>• <strong>28 matrículas</strong> (pico semanal: 14 na semana 5)</li>
                  <li>• Receita acumulada: R$ 6.400</li>
                </ul>
              </div>

              <div className="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50 rounded-r-lg">
                <h4 className="font-bold text-gray-900 mb-2">📅 Semana 7-8: Manutenção + Word-of-Mouth</h4>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 94 scans (queda natural após pico)</li>
                  <li>• <strong>9 matrículas diretas + 6 indicações</strong> (boca a boca começou!)</li>
                  <li>• Receita total 60 dias: R$ 9.600 (LTV 12 meses: R$ 38.400)</li>
                </ul>
              </div>
            </div>

            {/* Análise de Sucesso */}
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <TrendingUp className="h-8 w-8 mr-3 text-exa-purple" />
              Por Que Funcionou? 5 Fatores de Sucesso
            </h2>

            <div className="space-y-6">
              <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white rounded-lg p-6">
                <h3 className="font-bold text-xl mb-3">1️⃣ Hipersegmentação Geográfica</h3>
                <p className="opacity-90">
                  Anunciar apenas em 6 prédios a menos de 1km garantiu que CADA pessoa impactada tinha alta probabilidade de virar cliente. Não desperdiçou verba com quem mora longe.
                </p>
              </div>

              <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white rounded-lg p-6">
                <h3 className="font-bold text-xl mb-3">2️⃣ Personalização por Prédio</h3>
                <p className="opacity-90">
                  Moradores viram o <strong>nome do próprio prédio</strong> no anúncio. Isso cria sensação de "isso é para MIM", aumentando relevância e conversão em 300% vs. anúncios genéricos.
                </p>
              </div>

              <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white rounded-lg p-6">
                <h3 className="font-bold text-xl mb-3">3️⃣ Frequência de Exposição</h3>
                <p className="opacity-90">
                  Moradores viam o anúncio 2x/dia (manhã + noite) durante 60 dias = 120 exposições por pessoa. A academia "vivia na cabeça" deles até tomarem ação.
                </p>
              </div>

              <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white rounded-lg p-6">
                <h3 className="font-bold text-xl mb-3">4️⃣ Fricção Zero Para Converter</h3>
                <p className="opacity-90">
                  QR code → WhatsApp direto. Sem formulários, sem site lento. Do "interessei" para "agendar" em 2 cliques. Menos fricção = mais conversão.
                </p>
              </div>

              <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white rounded-lg p-6">
                <h3 className="font-bold text-xl mb-3">5️⃣ Oferta com Urgência Real</h3>
                <p className="opacity-90">
                  "Apenas em Janeiro" + "Primeiras 20 vagas" criou FOMO (Fear of Missing Out). Moradores agiram AGORA em vez de procrastinar.
                </p>
              </div>
            </div>

            {/* Comparação com Outras Mídias */}
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <DollarSign className="h-8 w-8 mr-3 text-exa-purple" />
              Comparação: R$ 800 em Elevadores vs. Outras Mídias
            </h2>

            <div className="overflow-x-auto my-8">
              <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-lg">
                <thead className="bg-gradient-to-r from-exa-purple to-exa-purple-dark text-white">
                  <tr>
                    <th className="p-4 text-left">Mídia</th>
                    <th className="p-4 text-center">Investimento</th>
                    <th className="p-4 text-center">Matrículas</th>
                    <th className="p-4 text-center">CAC</th>
                    <th className="p-4 text-center">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50 border-b-2 border-green-300">
                    <td className="p-4 font-semibold">EXA Elevadores</td>
                    <td className="p-4 text-center">R$ 800</td>
                    <td className="p-4 text-center font-bold text-green-600">64</td>
                    <td className="p-4 text-center font-bold text-green-600">R$ 12,50</td>
                    <td className="p-4 text-center font-bold text-green-600">4.700%</td>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <td className="p-4">Google Ads (período anterior)</td>
                    <td className="p-4 text-center">R$ 3.500</td>
                    <td className="p-4 text-center text-orange-600">8</td>
                    <td className="p-4 text-center text-orange-600">R$ 437,50</td>
                    <td className="p-4 text-center text-orange-600">137%</td>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <td className="p-4">Facebook/Instagram Ads</td>
                    <td className="p-4 text-center">R$ 800</td>
                    <td className="p-4 text-center text-red-600">4-6 (est.)</td>
                    <td className="p-4 text-center text-red-600">R$ 133-200</td>
                    <td className="p-4 text-center text-red-600">300-450%</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4">Panfletagem (10.000 uni.)</td>
                    <td className="p-4 text-center">R$ 800</td>
                    <td className="p-4 text-center text-red-600">2-3 (est.)</td>
                    <td className="p-4 text-center text-red-600">R$ 267-400</td>
                    <td className="p-4 text-center text-red-600">150-225%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <strong>💡 Conclusão:</strong> Elevadores geraram <strong>8-16x mais matrículas</strong> que outras mídias com mesmo budget. CAC 10-35x menor. ROI 10-30x superior.
            </p>

            {/* Lições Aprendidas */}
            <h2 className="flex items-center text-3xl font-bold mt-12 mb-6 text-gray-900">
              <Award className="h-8 w-8 mr-3 text-exa-purple" />
              7 Lições Replicáveis Para Seu Negócio
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">📍 1. Geografia {'>'} Quantidade</p>
                <p className="text-gray-700 text-sm">
                  Melhor anunciar em 5 prédios próximos que em 50 prédios espalhados pela cidade.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">🎯 2. Personalize SEMPRE</p>
                <p className="text-gray-700 text-sm">
                  Mencionar nome do prédio/bairro aumenta conversão em 300%. Vale o esforço extra.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">⏰ 3. Paciência Estratégica</p>
                <p className="text-gray-700 text-sm">
                  Semana 1 = testes. Semanas 2-4 = crescimento. Semanas 5-8 = explosão. Não desista cedo.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">📱 4. Remova Fricção</p>
                <p className="text-gray-700 text-sm">
                  QR → WhatsApp funciona 10x melhor que QR → Site → Formulário → Email.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">🎁 5. Oferta Irresistível</p>
                <p className="text-gray-700 text-sm">
                  "1ª aula grátis" funciona melhor que "Venha conhecer". Dê algo de valor real.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">⏳ 6. Urgência Real</p>
                <p className="text-gray-700 text-sm">
                  Prazo claro + escassez verdadeira (não fake). Cria ação imediata.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-500">
                <p className="font-bold text-gray-900 mb-2">📊 7. Rastreie TUDO</p>
                <p className="text-gray-700 text-sm">
                  QR único + cupom + pergunta origem = otimização contínua. Dados são essenciais.
                </p>
              </div>
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
              <h2 className="text-3xl font-bold mb-4">Replique Esse Sucesso No Seu Negócio</h2>
              <p className="text-lg mb-6 opacity-90">
                Quer resultados como a FitLife? Escolha prédios próximos ao seu negócio, personalize seu anúncio e comece hoje. Nossa equipe te ajuda em cada passo.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/loja">
                  <Button className="bg-white text-green-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3">
                    Ver Prédios Disponíveis
                  </Button>
                </Link>
                <Link to="/contato">
                  <Button variant="outline" className="border-white text-white hover:bg-white/20 text-lg px-8 py-3">
                    Consultoria Gratuita
                  </Button>
                </Link>
              </div>
            </div>

            {/* Internal Links */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4">📚 Continue Aprendendo:</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog/calcular-roi-elevadores" className="text-exa-purple hover:underline">
                    → Calcule Seu ROI em Campanhas de Elevadores
                  </Link>
                </li>
                <li>
                  <Link to="/blog/erros-anunciar-condominios" className="text-exa-purple hover:underline">
                    → 10 Erros Fatais ao Anunciar em Condomínios (Evite-os!)
                  </Link>
                </li>
                <li>
                  <Link to="/loja" className="text-exa-purple hover:underline">
                    → Comece Sua Campanha Agora
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

export default CaseSucessoAcademia;
