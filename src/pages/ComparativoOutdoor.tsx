import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCard from '@/components/exa/base/ExaCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Calculator, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createFAQSchema } from '@/components/seo/schemas';

const ComparativoOutdoor = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<number>(1000);

  const outdoorReach = Math.floor(budget / 8000 * 50000);
  const exaReach = Math.floor(budget / 297 * 500);
  const outdoorCPM = outdoorReach > 0 ? ((budget / outdoorReach) * 1000).toFixed(2) : '0';
  const exaCPM = exaReach > 0 ? ((budget / exaReach) * 1000).toFixed(2) : '0';

  const comparisonData = [
    { criterion: 'Custo/mês', outdoor: 'R$ 8.000', exa: 'R$ 297', winner: 'exa' },
    { criterion: 'Taxa de atenção', outdoor: '3%', exa: '95%', winner: 'exa' },
    { criterion: 'Alcance/mês', outdoor: '50.000', exa: '10.000', winner: 'outdoor' },
    { criterion: 'CPM (custo/mil)', outdoor: 'R$ 160', exa: 'R$ 29,70', winner: 'exa' },
    { criterion: 'Segmentação', outdoor: 'Nenhuma', exa: 'Por prédio/perfil', winner: 'exa' },
    { criterion: 'Tempo de exposição', outdoor: '2 segundos', exa: '30 segundos', winner: 'exa' },
    { criterion: 'Clima', outdoor: 'Dependente', exa: 'Indoor protegido', winner: 'exa' },
    { criterion: 'Flexibilidade', outdoor: 'Mensal', exa: 'Semanal', winner: 'exa' },
    { criterion: 'ROI médio', outdoor: '1.2x', exa: '4.5x', winner: 'exa' },
  ];

  const faqData = [
    {
      question: 'Publicidade em elevadores funciona melhor que outdoor?',
      answer: 'Sim. Enquanto outdoor tem 3% de taxa de atenção (pessoas no trânsito), elevadores da EXA têm 95% de atenção (público cativo durante 30 segundos). O ROI médio é 3.75x maior.'
    },
    {
      question: 'Quanto custa anunciar em outdoor vs elevador?',
      answer: 'Outdoor tradicional em Foz do Iguaçu custa entre R$ 5.000 a R$ 15.000/mês. EXA começa em R$ 297/mês, sendo 27x mais acessível com melhor segmentação.'
    },
    {
      question: 'Qual o ROI de outdoor comparado com mídia indoor?',
      answer: 'Outdoor gera ROI médio de 1.2x. EXA gera ROI médio de 4.5x, pois o público é segmentado, a taxa de atenção é alta e o CPM é 5x menor.'
    },
    {
      question: 'Posso usar outdoor e elevadores juntos?',
      answer: 'Sim! Outdoor funciona para brand awareness amplo. EXA funciona para conversão e público premium. Juntos criam uma estratégia omnichannel poderosa.'
    },
    {
      question: 'Como calcular CPM de outdoor vs elevador?',
      answer: 'CPM = (Custo / Alcance) x 1.000. Outdoor R$ 8.000 para 50.000 = R$ 160 CPM. EXA R$ 297 para 10.000 = R$ 29,70 CPM. EXA é 5.4x mais eficiente.'
    },
  ];

  const comparisonSchema = {
    "@type": "Table",
    "about": "Comparação entre Publicidade em Outdoor e Publicidade em Elevadores",
    "name": "Outdoor vs Elevadores: Comparativo Completo 2025"
  };

  return (
    <Layout>
      <SEO
        title="Publicidade em Elevadores vs Outdoor: Qual é Melhor? [Comparativo 2025]"
        description="Outdoor: R$8.000/mês, 3% de atenção. Elevador EXA: R$297/mês, 95% de atenção. Compare custos, ROI e resultados. Calculadora gratuita + tabela comparativa completa."
        keywords="outdoor vs elevador, alternativa outdoor, publicidade mais barata que outdoor, mídia indoor vs OOH, comparativo outdoor, vale a pena anunciar outdoor, outdoor ou elevador"
        structuredData={[comparisonSchema, createFAQSchema(faqData)]}
      />

      {/* Hero Comparison */}
      <ExaSection background="dark" className="py-20">
        <div className="text-center space-y-8">
          <h1 className="font-montserrat font-extrabold text-4xl lg:text-6xl text-white">
            Outdoor vs <span className="text-exa-yellow">Elevadores EXA</span>
          </h1>
          <p className="font-poppins text-xl text-gray-300 max-w-3xl mx-auto">
            Descubra por que empresas inteligentes estão migrando de outdoor tradicional para painéis digitais em elevadores
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-12">
            {/* Outdoor */}
            <ExaCard variant="gradient" className="p-8">
              <h3 className="font-montserrat font-bold text-2xl text-white mb-6">OUTDOOR TRADICIONAL</h3>
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Custo/mês</span>
                  <span className="font-bold text-white text-xl">R$ 8.000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Taxa de atenção</span>
                  <span className="font-bold text-red-400 text-xl">3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Clima</span>
                  <span className="font-bold text-red-400">Dependente</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Público</span>
                  <span className="font-bold text-white">Genérico</span>
                </div>
              </div>
            </ExaCard>

            {/* EXA */}
            <ExaCard variant="light" className="p-8 border-4 border-exa-yellow relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-exa-yellow text-[#9C1E1E] font-bold px-6 py-2 rounded-full">
                MELHOR ESCOLHA
              </div>
              <h3 className="font-montserrat font-bold text-2xl text-[#9C1E1E] mb-6">EXA ELEVADORES</h3>
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Custo/mês</span>
                  <span className="font-bold text-green-600 text-xl">R$ 297</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Taxa de atenção</span>
                  <span className="font-bold text-green-600 text-xl">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Clima</span>
                  <span className="font-bold text-green-600">Indoor protegido</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Público</span>
                  <span className="font-bold text-[#9C1E1E]">Premium A/B</span>
                </div>
              </div>
            </ExaCard>
          </div>
        </div>
      </ExaSection>

      {/* Detailed Comparison Table */}
      <ExaSection background="light">
        <div className="space-y-8">
          <h2 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-[#9C1E1E] text-center">
            Comparativo Técnico Completo
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-lg">
              <thead className="bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] text-white">
                <tr>
                  <th className="p-4 text-left font-montserrat">Critério</th>
                  <th className="p-4 text-center font-montserrat">Outdoor</th>
                  <th className="p-4 text-center font-montserrat">EXA Elevadores</th>
                  <th className="p-4 text-center font-montserrat">Vencedor</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-semibold text-gray-800">{row.criterion}</td>
                    <td className="p-4 text-center text-gray-600">{row.outdoor}</td>
                    <td className="p-4 text-center text-gray-600">{row.exa}</td>
                    <td className="p-4 text-center">
                      {row.winner === 'exa' ? (
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-6 h-6 text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ExaSection>

      {/* ROI Calculator */}
      <ExaSection background="dark">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Calculator className="w-16 h-16 text-exa-yellow mx-auto" />
            <h2 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-white">
              Calculadora de ROI Comparativa
            </h2>
            <p className="text-gray-300 font-poppins">
              Veja quantas pessoas você alcança com o mesmo orçamento
            </p>
          </div>

          <ExaCard variant="light" className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block font-montserrat font-semibold mb-2 text-gray-700">
                  Seu orçamento mensal de publicidade:
                </label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="text-2xl font-bold text-center"
                  min={100}
                  step={100}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                  <h4 className="font-montserrat font-bold text-lg mb-4 text-red-800">Outdoor</h4>
                  <div className="space-y-2">
                    <p className="text-gray-600">Pessoas alcançadas:</p>
                    <p className="font-bold text-3xl text-red-800">{outdoorReach.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">CPM: R$ {outdoorCPM}</p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-300">
                  <h4 className="font-montserrat font-bold text-lg mb-4 text-green-800">EXA Elevadores</h4>
                  <div className="space-y-2">
                    <p className="text-gray-600">Pessoas alcançadas:</p>
                    <p className="font-bold text-3xl text-green-800">{exaReach.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">CPM: R$ {exaCPM}</p>
                  </div>
                </div>
              </div>

              <div className="bg-exa-yellow/20 rounded-xl p-6 mt-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="w-8 h-8 text-[#9C1E1E] flex-shrink-0" />
                  <div>
                    <p className="font-montserrat font-bold text-[#9C1E1E] mb-2">
                      Resultado: EXA é {((Number(outdoorCPM) / Number(exaCPM)) || 1).toFixed(1)}x mais eficiente em CPM
                    </p>
                    <p className="text-sm text-gray-700">
                      Além disso, a taxa de atenção da EXA é 31x maior (95% vs 3%), 
                      resultando em conversões significativamente superiores.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ExaCard>
        </div>
      </ExaSection>

      {/* When to Choose */}
      <ExaSection background="light">
        <div className="space-y-12">
          <h2 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-[#9C1E1E] text-center">
            Quando Escolher Cada Um?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ExaCard variant="light" className="p-8">
              <h3 className="font-montserrat font-bold text-2xl text-gray-800 mb-6">
                Escolha OUTDOOR se:
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <span>Precisa de alcance massivo (100.000+ pessoas)</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <span>Quer brand awareness ampla</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <span>Tem orçamento {'>'} R$ 20.000/mês</span>
                </li>
              </ul>
            </ExaCard>

            <ExaCard variant="gradient" className="p-8">
              <h3 className="font-montserrat font-bold text-2xl text-white mb-6">
                Escolha EXA se:
              </h3>
              <ul className="space-y-4 text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-exa-yellow flex-shrink-0 mt-1" />
                  <span>Quer alta taxa de conversão</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-exa-yellow flex-shrink-0 mt-1" />
                  <span>Público-alvo é classe A/B</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-exa-yellow flex-shrink-0 mt-1" />
                  <span>Orçamento R$ 300 - R$ 5.000/mês</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-exa-yellow flex-shrink-0 mt-1" />
                  <span>Quer rastrear resultados exatos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-exa-yellow flex-shrink-0 mt-1" />
                  <span>Precisa de segmentação por bairro/perfil</span>
                </li>
              </ul>
            </ExaCard>
          </div>
        </div>
      </ExaSection>

      {/* FAQ */}
      <ExaSection background="dark">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-white text-center">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <ExaCard key={idx} variant="light" className="p-6">
              <h4 className="font-montserrat font-bold text-lg text-[#9C1E1E] mb-3">
                  {faq.question}
                </h4>
                <p className="text-gray-700 font-poppins">
                  {faq.answer}
                </p>
              </ExaCard>
            ))}
          </div>
        </div>
      </ExaSection>

      {/* CTA Final */}
      <ExaSection background="light">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h2 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-[#9C1E1E]">
            Outdoor Não Está Trazendo Resultados?
          </h2>
          <p className="font-poppins text-xl text-gray-700">
            Teste EXA por 30 dias GRÁTIS e compare você mesmo os resultados.
            Sem compromisso, sem taxa de setup. Veja também <a href="/sou-sindico" className="text-[#9C1E1E] hover:underline font-semibold">como síndicos podem instalar painéis gratuitamente</a>.
          </p>
          <Button
            onClick={() => navigate('/loja')}
            className="bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] text-white px-12 py-6 text-xl font-bold hover:scale-105 transition-transform"
          >
            Comparar Meu Anúncio Agora
          </Button>
          <p className="text-sm text-gray-500">
            ⭐ 4.9/5 baseado em 87 avaliações | 🎯 ROI médio de 4.5x
          </p>
        </div>
      </ExaSection>
    </Layout>
  );
};

export default ComparativoOutdoor;
