import React, { useState } from 'react';
import { ChevronRight, Wrench, Trophy, TrendingUp, Heart, Shield, Zap, CheckCircle } from 'lucide-react';

const TaccohExplainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('T');

  const taccohElements = [
    {
      id: 'T',
      letter: 'T',
      title: 'Técnico',
      icon: Wrench,
      color: 'from-blue-500 to-indigo-600',
      description: 'Mostra o processo, o bastidor, o conhecimento. Tira o véu da operação e faz o público pensar: "eles dominam o que fazem".',
      example: '"Entenda como construímos um site profissional em 5 etapas."',
      whoCanUse: 'Clínicas, construtoras, barbeiros, restaurantes, consultores, qualquer profissional que queira gerar confiança e mostrar o know-how.',
      benefits: ['Gera confiança', 'Mostra expertise', 'Educa o público', 'Diferencia da concorrência']
    },
    {
      id: 'A',
      letter: 'A',
      title: 'Autoridade',
      icon: Trophy,
      color: 'from-yellow-400 to-orange-500',
      description: 'É onde mostramos conquistas, clientes de peso, bastidores de eventos, prêmios, participações na mídia, cases reais.',
      example: '"Já atendemos mais de 500 empresas em 4 estados do Brasil."',
      whoCanUse: 'Empresas que desejam reforçar credibilidade ou que estejam crescendo e queiram parecer maiores do que realmente são.',
      benefits: ['Aumenta credibilidade', 'Social proof', 'Atrai grandes clientes', 'Fortalece posicionamento']
    },
    {
      id: 'C1',
      letter: 'C',
      title: 'Crescimento',
      icon: TrendingUp,
      color: 'from-green-400 to-emerald-600',
      description: 'Vídeos que inspiram, ensinam, provocam e viralizam. Aqui entram dicas rápidas, frases fortes, lições aprendidas, gatilhos de curiosidade.',
      example: '"O erro que quase faliu minha empresa... e o que eu fiz depois."',
      whoCanUse: 'Negócios que desejam atrair atenção, gerar seguidores e mostrar evolução com leveza e inteligência.',
      benefits: ['Viraliza conteúdo', 'Aumenta seguidores', 'Gera engajamento', 'Inspira audiência']
    },
    {
      id: 'C2',
      letter: 'C',
      title: 'Conexão',
      icon: Heart,
      color: 'from-pink-400 to-rose-500',
      description: 'O pilar da humanidade. Aqui entram histórias reais, emoções, bastidores, vulnerabilidades e carinho com o cliente.',
      example: '"Foi com a ajuda da minha avó que eu montei meu primeiro ateliê."',
      whoCanUse: 'Negócios familiares, marcas pessoais, microempreendedores e qualquer empresa que deseje encantar pelo afeto.',
      benefits: ['Humaniza a marca', 'Cria vínculos emocionais', 'Aumenta lealdade', 'Gera identificação']
    },
    {
      id: 'O',
      letter: 'O',
      title: 'Objeção',
      icon: Shield,
      color: 'from-red-500 to-pink-600',
      description: 'Vídeos que antecipam e quebram barreiras do cliente. Ajudam a transformar "não agora" em "por que não agora?".',
      example: '"Achava que marketing digital era caro... até ver isso."',
      whoCanUse: 'Toda empresa que enfrenta resistência comum (preço, tempo, necessidade, urgência, comparação com concorrência).',
      benefits: ['Remove objeções', 'Acelera vendas', 'Reduz ciclo de venda', 'Qualifica leads']
    },
    {
      id: 'H',
      letter: 'H',
      title: 'Hype',
      icon: Zap,
      color: 'from-orange-400 to-yellow-500',
      description: 'Trend, memes, datas comemorativas, vídeos rápidos com áudio do momento, virais com adaptação para o nicho.',
      example: '"Trend da semana aplicada para mostrar os bastidores da entrega do mês."',
      whoCanUse: 'Toda marca que deseja se manter atual, jovem, conectada ao agora, sem perder profissionalismo.',
      benefits: ['Mantém relevância', 'Atinge público jovem', 'Viraliza rapidamente', 'Mostra contemporaneidade']
    }
  ];

  const activeElement = taccohElements.find(el => el.id === activeTab);

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-slate-700 bg-clip-text text-transparent">
            Explicando o <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">T.A.C.C.O.H.</span>, passo a passo
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Cada ingrediente estratégico é cientificamente pensado para resolver um problema específico do seu conteúdo e gerar resultados consistentes.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {taccohElements.map((element) => {
            const IconComponent = element.icon;
            return (
              <button
                key={element.id}
                onClick={() => setActiveTab(element.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border-2 ${
                  activeTab === element.id
                    ? `bg-gradient-to-r ${element.color} text-white border-transparent shadow-lg scale-105`
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activeTab === element.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <span className={`font-bold ${
                    activeTab === element.id ? 'text-white' : 'text-gray-600'
                  }`}>
                    {element.letter}
                  </span>
                </div>
                <IconComponent className="h-5 w-5" />
                <span className="font-semibold">{element.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Content */}
        {activeElement && (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${activeElement.color} flex items-center justify-center`}>
                    <activeElement.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">
                      {activeElement.letter} – {activeElement.title}
                    </h3>
                  </div>
                </div>

                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  {activeElement.description}
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-6 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Exemplo prático:</h4>
                  <p className="text-blue-800 italic">
                    {activeElement.example}
                  </p>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">🎯 Quem pode usar:</h4>
                  <p className="text-gray-700">
                    {activeElement.whoCanUse}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4">✨ Benefícios estratégicos:</h4>
                <div className="space-y-4">
                  {activeElement.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <span className="font-semibold text-orange-800">Resultado esperado:</span>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Com o pilar <strong>{activeElement.title}</strong>, sua marca consegue {activeElement.benefits[0].toLowerCase()} e criar conteúdo que realmente conecta com sua audiência, gerando engajamento e resultados mensuráveis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para aplicar o T.A.C.C.O.H. na sua marca?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Nossa equipe especializada ajuda você a identificar quais pilares sua marca mais precisa e como aplicá-los estrategicamente.
          </p>
          <div className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all cursor-pointer">
            <span>Descobrir meu T.A.C.C.O.H. ideal</span>
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohExplainer;