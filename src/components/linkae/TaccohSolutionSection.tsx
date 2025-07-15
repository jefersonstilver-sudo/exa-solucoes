import React from 'react';
import { Brain, Target, Lightbulb, MessageSquare, TrendingUp, Users, CheckCircle2, ArrowRight } from 'lucide-react';

const TaccohSolutionSection: React.FC = () => {
  const problems = [
    {
      icon: Brain,
      title: "Não sei o que postar",
      description: "Fica horas pensando em conteúdo e não sai do lugar"
    },
    {
      icon: Target,
      title: "Conteúdo sem estratégia",
      description: "Posta qualquer coisa sem propósito ou direcionamento"
    },
    {
      icon: MessageSquare,
      title: "Baixo engajamento",
      description: "Posts que não geram comentários, curtidas ou interesse"
    },
    {
      icon: TrendingUp,
      title: "Sem resultados",
      description: "Redes sociais que não trazem clientes ou vendas"
    }
  ];

  const solutions = [
    {
      taccoh: 'T',
      title: 'Técnico',
      problem: 'Para empresas que precisam gerar confiança',
      solution: 'Mostre seus processos, bastidores e conhecimento especializado',
      example: 'Dentista mostrando cada etapa de um clareamento',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      taccoh: 'A',
      title: 'Autoridade',
      problem: 'Para negócios que querem parecer maiores',
      solution: 'Destaque conquistas, cases de sucesso e credenciais',
      example: 'Advogado compartilhando vitórias em tribunais',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      taccoh: 'C',
      title: 'Crescimento',
      problem: 'Para marcas que querem viralizar',
      solution: 'Crie conteúdo que ensina, inspira e gera curiosidade',
      example: 'Coach compartilhando lições de fracassos e vitórias',
      color: 'from-green-400 to-emerald-600'
    },
    {
      taccoh: 'C',
      title: 'Conexão',
      problem: 'Para empresas que querem humanizar a marca',
      solution: 'Conte histórias reais, emoções e bastidores pessoais',
      example: 'Padaria mostrando receita da família há 3 gerações',
      color: 'from-pink-400 to-rose-500'
    },
    {
      taccoh: 'O',
      title: 'Objeção',
      problem: 'Para negócios com resistência de preço',
      solution: 'Antecipe e derrube as barreiras mais comuns dos clientes',
      example: 'Personal trainer explicando por que treino em casa não funciona',
      color: 'from-red-500 to-pink-600'
    },
    {
      taccoh: 'H',
      title: 'Hype',
      problem: 'Para marcas que querem se manter relevantes',
      solution: 'Adapte trends e memes para seu nicho profissionalmente',
      example: 'Contabilidade usando meme para explicar imposto de renda',
      color: 'from-orange-400 to-yellow-500'
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Brain className="h-4 w-4" />
            <span>O problema que toda empresa enfrenta</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
            "Não sei o que postar"
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12">
            Se você já passou horas em branco olhando para as redes sociais sem saber que conteúdo criar, você não está sozinho. <strong>93% das empresas</strong> enfrentam esse mesmo desafio.
          </p>

          {/* Problems Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {problems.map((problem, index) => {
              const IconComponent = problem.icon;
              return (
                <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <IconComponent className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-gray-600">{problem.description}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-3xl mb-16">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              E se cada conteúdo tivesse um propósito estratégico?
            </h3>
            <p className="text-lg opacity-90">
              O <strong>T.A.C.C.O.H.</strong> é como ter um quebra-cabeça completo. Cada peça resolve um problema específico e juntas formam uma estratégia de conteúdo imbatível.
            </p>
          </div>
        </div>

        {/* Solutions Grid */}
        <div className="mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            A solução para cada tipo de negócio
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${solution.color} rounded-xl flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{solution.taccoh}</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{solution.title}</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">🎯 Problema:</p>
                    <p className="text-gray-800 font-medium">{solution.problem}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">💡 Solução:</p>
                    <p className="text-gray-800">{solution.solution}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">📝 Exemplo:</p>
                    <p className="text-gray-800 text-sm italic">{solution.example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom insight */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 md:p-12 rounded-3xl border border-green-200">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span className="text-green-800 font-semibold">Por que o T.A.C.C.O.H. funciona até para negócios pequenos?</span>
              </div>
              <p className="text-green-700 text-lg mb-6">
                Porque <strong>não exige grandes investimentos</strong>, e sim <strong>visão estratégica</strong>, que a LINKAÊ oferece com diagnóstico gratuito e roteiro inteligente.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-800 text-sm">Não precisa de equipamento caro</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-800 text-sm">Funciona para qualquer nicho</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-800 text-sm">Resultados desde o primeiro post</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h4 className="font-bold text-gray-900 mb-4">🚀 Exemplo realista:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Loja de roupas:</strong> Crescimento + Hype com looks usando trilha sonora do momento</p>
                </div>
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Escritório:</strong> Técnico + Objeção explicando por que contratar um arquiteto é investimento</p>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p><strong>Restaurante:</strong> Autoridade + Crescimento mostrando prato que viralizou</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <p className="text-purple-800 text-sm font-medium">
                  Com o T.A.C.C.O.H., a LINKAÊ entrega mais do que vídeo. Ela entrega posicionamento, estratégia e encantamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohSolutionSection;