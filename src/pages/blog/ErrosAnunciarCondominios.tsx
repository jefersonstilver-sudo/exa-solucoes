import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, createBreadcrumbSchema, createFAQSchema } from '@/components/seo/schemas';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Check, Target, Eye, TrendingDown } from 'lucide-react';

const articleFAQs = [
  {
    question: 'Qual o erro mais comum ao anunciar em condomínios?',
    answer: 'O erro #1 é usar conteúdo genérico sem relevância local. Moradores querem ofertas específicas para eles, não campanhas nacionais. Personalize sempre.'
  },
  {
    question: 'Preciso pedir autorização do síndico para anunciar?',
    answer: 'Não. A EXA já tem autorização dos condomínios parceiros. Você só escolhe os prédios e cria o anúncio. O síndico recebe comissão automaticamente.'
  },
  {
    question: 'Quanto tempo devo manter um anúncio no ar?',
    answer: 'Mínimo 4 semanas. O impacto se acumula: semana 1 gera awareness, semana 2-3 reconhecimento, semana 4+ conversão máxima. Não desista cedo!'
  }
];

const ErrosAnunciarCondominios = () => {
  const erros = [
    {
      numero: 1,
      titulo: 'Usar Conteúdo Genérico (Erro Fatal)',
      problema: 'Anúncios que parecem campanha nacional sem relevância local são ignorados. Moradores querem saber "O que isso tem a ver COMIGO?"',
      solucao: 'Personalize por bairro/prédio. Ex: "Moradores do Edifício XYZ: 20% OFF na academia a 200m daqui" vs. "Venha treinar conosco".',
      impacto: '↓ 80% na taxa de conversão'
    },
    {
      numero: 2,
      titulo: 'Texto Longo Demais',
      problema: 'Colocar 15 linhas de texto em um anúncio de elevador. Pessoas leem em média 7 palavras antes de decidir se ignoram.',
      solucao: 'Regra 5-7-9: Máximo 5 palavras no título, 7 no subtítulo, 9 no corpo. Use imagens fortes e QR code para detalhes.',
      impacto: '↓ 65% na taxa de visualização completa'
    },
    {
      numero: 3,
      titulo: 'Sem Call-to-Action (CTA) Claro',
      problema: 'Anúncios que só "apresentam" a empresa sem dizer o que o morador deve fazer. "Conheça nossa academia" vs. "Escaneie e ganhe 1ª aula grátis".',
      solucao: 'Todo anúncio PRECISA de CTA acionável: "Escaneie o QR", "Use cupom PREDIO10", "Ligue agora: 99999-9999".',
      impacto: '↓ 90% na conversão'
    },
    {
      numero: 4,
      titulo: 'Ignorar o Perfil do Prédio',
      problema: 'Anunciar produtos premium em prédios populares ou ofertas econômicas em prédios classe A. Total desconexão.',
      solucao: 'Use os filtros da <Link href="/loja" className="text-exa-purple underline">plataforma EXA</Link> para escolher prédios alinhados ao seu público-alvo.',
      impacto: '↓ 75% na relevância e ROI'
    },
    {
      numero: 5,
      titulo: 'Design Amador ou Poluído',
      problema: 'Usar templates gratuitos ruins, cores que não contrastam, logos gigantes. Parece spam e é ignorado.',
      solucao: 'Invista em design profissional OU use os templates gratuitos da EXA. Regra: fundo claro + texto escuro + 1 cor de destaque.',
      impacto: '↓ 70% na credibilidade'
    },
    {
      numero: 6,
      titulo: 'Desistir Cedo Demais',
      problema: 'Rodar campanha por 1-2 semanas, não ver resultado explosivo e cancelar. Resultados vêm com frequência de exposição.',
      solucao: 'Mínimo 4 semanas. Semana 1 = awareness, Semana 2-3 = reconhecimento, Semana 4+ = conversão máxima. Tenha paciência estratégica.',
      impacto: '↓ 85% no potencial de ROI'
    },
    {
      numero: 7,
      titulo: 'Não Rastrear Resultados',
      problema: 'Não usar QR codes únicos, cupons rastreáveis ou perguntar "Como conheceu?". Impossível otimizar sem dados.',
      solucao: 'Use QR code exclusivo com UTM parameters, cupom PREDIO20 ou treine equipe para perguntar origem. Dashboard EXA mostra impressões.',
      impacto: '↓ 100% na capacidade de otimização'
    },
    {
      numero: 8,
      titulo: 'Ofertas Sem Urgência',
      problema: 'Anúncios sem prazo tipo "Venha conhecer". Sem urgência = procrastinação infinita.',
      solucao: 'Sempre inclua deadline: "Válido até domingo", "Primeiros 50 clientes", "Oferta exclusiva Janeiro". Urgência multiplica conversão.',
      impacto: '↓ 60% na ação imediata'
    },
    {
      numero: 9,
      titulo: 'Não Testar Variações',
      problema: 'Rodar mesmo anúncio por meses sem testar mensagens, ofertas ou designs alternativos. Perde oportunidade de 2-3x o resultado.',
      solucao: 'Teste A/B semanal: Semana 1 = "20% OFF", Semana 2 = "Leve 2 Pague 1". Compare QR scans e ajuste.',
      impacto: '↓ 50% no ROI potencial'
    },
    {
      numero: 10,
      titulo: 'Esquecer do Fator "Vizinho"',
      problema: 'Tratar moradores como desconhecidos. Eles confiam mais em negócios "do bairro" que em marcas distantes.',
      solucao: 'Reforce proximidade: "Sua academia no térreo", "Delivery em 15 minutos", "Estamos há 3 quadras". Vizinhança = trust.',
      impacto: '↓ 55% na conversão de novos clientes'
    }
  ];

  return (
    <Layout>
      <SEO
        title="10 Erros Fatais ao Anunciar em Condomínios (E Como Evitá-los) [2025]"
        description="Descubra os 10 erros que matam campanhas em painéis de elevadores e condomínios. Aprenda como evitá-los e multiplique seu ROI. Guia completo com exemplos reais."
        keywords="erros publicidade condomínio, como anunciar elevador, erros mídia indoor, publicidade prédio não funciona, melhorar anúncio elevador"
        canonical="https://exa.com.br/blog/erros-anunciar-condominios"
        ogImage="https://exa.com.br/blog/og-erros-condominios.jpg"
        structuredData={[
          organizationSchema,
          createBreadcrumbSchema([
            { name: 'Início', url: 'https://exa.com.br/' },
            { name: 'Blog', url: 'https://exa.com.br/blog' },
            { name: 'Erros ao Anunciar em Condomínios', url: 'https://exa.com.br/blog/erros-anunciar-condominios' }
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
              10 Erros Fatais ao Anunciar em Condomínios (E Como Evitá-los)
            </h1>
            <div className="flex items-center text-gray-600 mb-6">
              <time dateTime="2025-01-23">23 de janeiro de 2025</time>
              <span className="mx-3">•</span>
              <span>18 min de leitura</span>
            </div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Milhares de reais desperdiçados todos os meses porque anunciantes repetem os mesmos erros. Neste guia definitivo, você aprenderá os 10 erros que destroem campanhas em elevadores e condomínios — e mais importante: como evitá-los.
            </p>
          </header>

          <div className="prose prose-lg max-w-none">
            {/* Intro com Estatística Impactante */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white mb-12">
              <div className="flex items-start">
                <AlertTriangle className="h-12 w-12 mr-4 flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold mb-3">⚠️ Realidade Brutal</h2>
                  <p className="text-lg opacity-90">
                    <strong>73% das campanhas</strong> em painéis de condomínios falham não por falta de budget, mas por erros evitáveis de estratégia e execução. 
                    Evite esses 10 erros e multiplique seu ROI em 300-500%.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Erros */}
            <div className="space-y-12">
              {erros.map((erro) => (
                <div key={erro.numero} className="border-l-4 border-red-500 pl-6 py-4">
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                      {erro.numero}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
                        <X className="h-6 w-6 text-red-500 mr-2" />
                        {erro.titulo}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-4 ml-16">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="font-semibold text-red-800 mb-2">❌ O Problema:</p>
                      <p className="text-gray-700">{erro.problema}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="font-semibold text-green-800 mb-2">✅ A Solução:</p>
                      <p className="text-gray-700">{erro.solucao}</p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                      <p className="font-semibold text-orange-800 flex items-center">
                        <TrendingDown className="h-5 w-5 mr-2" />
                        Impacto: <span className="ml-2 text-red-600 font-bold">{erro.impacto}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Case de Sucesso */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 my-16 border-2 border-green-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Check className="h-8 w-8 text-green-600 mr-3" />
                Case Real: De R$ 500 Prejuízo para R$ 3.500 Lucro
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">📉 Antes (Campanha Errada)</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Restaurante de sushi anunciou em 8 prédios populares (erro #4)</li>
                    <li>• Anúncio genérico "Melhor sushi da cidade" sem oferta (erro #3)</li>
                    <li>• Design poluído com 20 pratos diferentes (erro #5)</li>
                    <li>• Rodou 2 semanas e desistiu (erro #6)</li>
                    <li><strong className="text-red-600">Resultado: 3 clientes, R$ 500 investidos = PREJUÍZO</strong></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">📈 Depois (Campanha Corrigida)</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Mudou para 5 prédios classe A/B em raio de 3km</li>
                    <li>• Novo anúncio: "Moradores do [Nome do Prédio]: 30% OFF hoje + Delivery GRÁTIS"</li>
                    <li>• Design limpo: fundo branco, 1 prato hero, QR code gigante</li>
                    <li>• Manteve 6 semanas com testes A/B semanais</li>
                    <li><strong className="text-green-600">Resultado: 82 novos clientes, R$ 5.000 receita = R$ 3.500 LUCRO (ROI 600%)</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Checklist de Prevenção */}
            <div className="bg-exa-purple text-white rounded-2xl p-8 my-16">
              <h2 className="text-3xl font-bold mb-6">✅ Checklist Anti-Erro: Use Antes de Publicar</h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Meu anúncio menciona o nome do prédio/bairro? (Personalização local)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Tem no máximo 20 palavras no total? (Regra do texto curto)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>O CTA é claro e acionável? ("Escaneie", "Use cupom X", "Ligue")</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Escolhi prédios alinhados ao meu público-alvo? (Perfil correto)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Design é profissional ou usei template EXA? (Visual credível)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Planejo rodar por pelo menos 4 semanas? (Consistência)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Tenho QR code ou cupom para rastrear resultados? (Mensuração)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Incluí urgência? ("Até domingo", "Primeiros 50")</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Vou testar pelo menos 2 versões diferentes? (Otimização)</p>
                </div>
                <div className="flex items-start">
                  <Check className="h-6 w-6 mr-3 flex-shrink-0 mt-1" />
                  <p>Reforço proximidade/vizinhança? ("Sua [tipo negócio] no bairro")</p>
                </div>
              </div>

              <p className="mt-6 text-lg opacity-90">
                <strong>10/10 checks?</strong> Sua campanha tem 85% de chance de sucesso. <br/>
                <strong>Menos de 7?</strong> Revise antes de investir!
              </p>
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
            <div className="bg-gradient-to-r from-exa-purple to-exa-purple-dark rounded-2xl p-8 text-white mt-16">
              <h2 className="text-3xl font-bold mb-4">Evite Esses Erros Desde o Início</h2>
              <p className="text-lg mb-6 opacity-90">
                Comece sua campanha com consultoria grátis da equipe EXA. Analisamos seu anúncio, sugerimos melhorias e garantimos que você não caia nesses erros fatais.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/loja">
                  <Button className="bg-exa-mint text-exa-purple-dark hover:bg-exa-mint-dark font-semibold">
                    Criar Campanha Profissional
                  </Button>
                </Link>
                <Link to="/interessesindico/formulario">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-exa-purple">
                    Consultoria Gratuita
                  </Button>
                </Link>
              </div>
            </div>

            {/* Internal Links */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-900 mb-4">📚 Próximos Passos:</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog/calcular-roi-elevadores" className="text-exa-purple hover:underline">
                    → Aprenda a Calcular Seu ROI em Campanhas de Elevadores
                  </Link>
                </li>
                <li>
                  <Link to="/blog/midia-indoor-vs-outdoor" className="text-exa-purple hover:underline">
                    → Indoor vs Outdoor: Qual é Melhor Para Seu Negócio?
                  </Link>
                </li>
                <li>
                  <Link to="/loja" className="text-exa-purple hover:underline">
                    → Veja Prédios Disponíveis e Comece Sua Campanha
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

export default ErrosAnunciarCondominios;
