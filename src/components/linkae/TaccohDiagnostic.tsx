import React, { useState } from 'react';
import { ChevronRight, CheckCircle, AlertTriangle, TrendingUp, Users, Target, Lightbulb } from 'lucide-react';

interface TaccohDiagnosticProps {
  onScrollToForm: () => void;
}

const TaccohDiagnostic: React.FC<TaccohDiagnosticProps> = ({ onScrollToForm }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const questions = [
    {
      id: 0,
      question: "Qual é o principal desafio da sua marca nas redes sociais?",
      options: [
        { value: "trust", text: "Gerar confiança e credibilidade", taccoh: "T" },
        { value: "authority", text: "Mostrar que sou referência no meu segmento", taccoh: "A" },
        { value: "engagement", text: "Aumentar engajamento e viralizar", taccoh: "C1" },
        { value: "connection", text: "Humanizar minha marca", taccoh: "C2" },
        { value: "objections", text: "Vencer objeções de preço/valor", taccoh: "O" },
        { value: "relevance", text: "Me manter atual e relevante", taccoh: "H" }
      ]
    },
    {
      id: 1,
      question: "Como seus clientes te encontram atualmente?",
      options: [
        { value: "referral", text: "Indicação boca a boca", taccoh: "C2" },
        { value: "search", text: "Pesquisa no Google", taccoh: "A" },
        { value: "social", text: "Redes sociais", taccoh: "H" },
        { value: "traditional", text: "Marketing tradicional", taccoh: "T" }
      ]
    },
    {
      id: 2,
      question: "Qual é o principal motivo dos clientes hesitarem em comprar?",
      options: [
        { value: "price", text: "Preço muito alto", taccoh: "O" },
        { value: "trust", text: "Não confiam no resultado", taccoh: "T" },
        { value: "need", text: "Não veem necessidade", taccoh: "C1" },
        { value: "timing", text: "Não é o momento certo", taccoh: "A" }
      ]
    }
  ];

  const taccohProfiles = {
    T: {
      title: "Técnico",
      description: "Sua marca precisa gerar mais confiança através da demonstração de conhecimento e processos",
      color: "from-blue-500 to-indigo-600",
      icon: Target,
      strategy: "Mostre bastidores, processos, conhecimento técnico e expertise",
      actions: [
        "Videos explicando seus processos passo a passo",
        "Demonstrações técnicas do seu trabalho",
        "Conteúdo educativo sobre sua área",
        "Cases explicando metodologias"
      ]
    },
    A: {
      title: "Autoridade", 
      description: "Sua marca precisa fortalecer credibilidade e posicionamento como referência",
      color: "from-yellow-400 to-orange-500",
      icon: TrendingUp,
      strategy: "Destaque conquistas, certificações, cases de sucesso e reconhecimento",
      actions: [
        "Compartilhe prêmios e conquistas",
        "Mostre cases de clientes importantes",
        "Destaque certificações e qualificações",
        "Participe de eventos como especialista"
      ]
    },
    C1: {
      title: "Crescimento",
      description: "Sua marca precisa inspirar, educar e criar conteúdo viral",
      color: "from-green-400 to-emerald-600", 
      icon: Lightbulb,
      strategy: "Crie conteúdo que ensina, inspira e gera curiosidade",
      actions: [
        "Dicas práticas e valiosas",
        "Histórias inspiradoras de transformação",
        "Conteúdo que gera reflexão",
        "Lições aprendidas e experiências"
      ]
    },
    C2: {
      title: "Conexão",
      description: "Sua marca precisa se humanizar e criar vínculos emocionais",
      color: "from-pink-400 to-rose-500",
      icon: Users,
      strategy: "Conte histórias reais, mostre vulnerabilidades e carinho com clientes",
      actions: [
        "Compartilhe sua história pessoal",
        "Mostre bastidores e momentos reais",
        "Destaque o cuidado com clientes",
        "Conte histórias emocionantes"
      ]
    },
    O: {
      title: "Objeção",
      description: "Sua marca precisa antecipar e quebrar barreiras dos clientes",
      color: "from-red-500 to-pink-600",
      icon: AlertTriangle,
      strategy: "Antecipe objeções comuns e transforme 'não agora' em 'por que não agora?'",
      actions: [
        "Aborde objeções de preço diretamente",
        "Explique o valor real do seu serviço",
        "Compare custos de não contratar",
        "Desmistifique conceitos errados"
      ]
    },
    H: {
      title: "Hype",
      description: "Sua marca precisa se manter atual, jovem e conectada às tendências",
      color: "from-orange-400 to-yellow-500",
      icon: TrendingUp,
      strategy: "Adapte trends, memes e datas comemorativas para seu nicho",
      actions: [
        "Use trends de forma profissional",
        "Adapte memes para seu segmento",
        "Aproveite datas comemorativas",
        "Mantenha-se atual e relevante"
      ]
    }
  };

  const handleAnswer = (answer: string, taccoh: string) => {
    const newAnswers = [...answers, taccoh];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const getRecommendation = () => {
    const taccohCount = answers.reduce((acc: any, answer) => {
      acc[answer] = (acc[answer] || 0) + 1;
      return acc;
    }, {});

    const sortedTaccoh = Object.entries(taccohCount)
      .sort(([,a]: any, [,b]: any) => b - a)
      .map(([taccoh]) => taccoh);

    return sortedTaccoh[0];
  };

  const resetDiagnostic = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
  };

  if (showResult) {
    const recommendation = getRecommendation();
    const profile = taccohProfiles[recommendation as keyof typeof taccohProfiles];
    const IconComponent = profile.icon;

    return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-linkae-dark-blue/5 to-linkae-royal-blue/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4" />
              <span>Diagnóstico concluído</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-linkae-dark-blue">
              Sua estratégia T.A.C.C.O.H. ideal
            </h2>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
            <div className={`bg-gradient-to-r ${profile.color} p-8 rounded-2xl text-white mb-8`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <IconComponent className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold">{profile.title}</h3>
                  <p className="text-lg opacity-90">{profile.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">🎯 Estratégia recomendada:</h4>
                <p className="text-lg text-gray-700 bg-gray-50 p-6 rounded-2xl">
                  {profile.strategy}
                </p>
              </div>

              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">📋 Ações práticas para implementar:</h4>
                <div className="grid gap-4">
                  {profile.actions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                <h4 className="font-bold text-orange-800 mb-2">⚡ Próximo passo:</h4>
                <p className="text-orange-700 mb-4">
                  Quer uma análise personalizada completa da sua marca com estratégia T.A.C.C.O.H. detalhada? Nossa equipe pode criar um plano específico para o seu negócio.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={onScrollToForm}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
                  >
                    <span>Solicitar análise completa</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={resetDiagnostic}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Refazer diagnóstico
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-linkae-dark-blue/5 to-linkae-royal-blue/10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-linkae-dark-blue">
            Qual <span className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent">T.A.C.C.O.H.</span> sua marca precisa?
          </h2>
          <p className="text-lg text-linkae-dark-blue/70">
            Responda 3 perguntas rápidas e descubra sua estratégia ideal
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progresso</span>
            <span className="text-sm text-gray-600">{currentQuestion + 1} de {questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <h3 className="text-xl md:text-2xl font-bold text-linkae-dark-blue mb-8 text-center">
            {question.question}
          </h3>

          <div className="space-y-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.value, option.taccoh)}
                className="w-full p-6 text-left bg-gray-50 hover:bg-gradient-to-r hover:from-linkae-bright-blue/10 hover:to-linkae-cyan-light/10 rounded-2xl border border-gray-200 hover:border-linkae-cyan-light transition-all duration-300 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-medium group-hover:text-linkae-dark-blue">
                    {option.text}
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-linkae-bright-blue group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Diagnóstico gratuito • Resultado instantâneo • Estratégia personalizada
          </p>
        </div>
      </div>
    </section>
  );
};

export default TaccohDiagnostic;