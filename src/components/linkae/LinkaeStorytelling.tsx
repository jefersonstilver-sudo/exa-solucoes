import React from 'react';
import { Heart, TrendingUp, Users, Lightbulb, Target, Zap } from 'lucide-react';

const LinkaeStorytelling: React.FC = () => {
  const stories = [
    {
      icon: Heart,
      type: "Loja em Foz",
      problem: "Falta de criatividade",
      solution: "Posts que engajam comunidade local",
      color: "from-pink-400 to-rose-500",
      example: "De vitrines vazias para fila na porta"
    },
    {
      icon: TrendingUp,
      type: "Restaurante",
      problem: "Não saber o que postar",
      solution: "Conteúdos que geram fome emocional",
      color: "from-orange-400 to-red-500",
      example: "De mesas vazias para reservas lotadas"
    },
    {
      icon: Users,
      type: "Clínica",
      problem: "Dúvidas dos pacientes",
      solution: "Posts que respondem e convertem",
      color: "from-blue-400 to-cyan-500",
      example: "De desconfiança para agenda cheia"
    },
    {
      icon: Lightbulb,
      type: "Academia",
      problem: "Inseguranças dos alunos",
      solution: "Narrativas que superam medos",
      color: "from-green-400 to-emerald-500",
      example: "De intimidação para motivação"
    },
    {
      icon: Target,
      type: "Evento no Paraguai",
      problem: "Falta de buzz",
      solution: "Campanhas que aumentam hype",
      color: "from-purple-400 to-indigo-500",
      example: "De evento vazio para sold out"
    },
    {
      icon: Zap,
      type: "Loja Online",
      problem: "Sem ideias criativas",
      solution: "Posts visuais que vendem",
      color: "from-yellow-400 to-orange-400",
      example: "De carrinho abandonado para compras impulsivas"
    }
  ];

  return (
    <section className="h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
            Transformamos Desafios em Oportunidades
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Nossas estratégias incluem posts que criam conexões genuínas, transformam objeções em conversões e geram o hype que sua marca precisa para crescer.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, index) => {
            const IconComponent = story.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${story.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{story.type}</h3>
                
                <div className="space-y-3">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Dor:</strong> {story.problem}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Solução:</strong> {story.solution}
                    </p>
                  </div>
                  
                  <div className={`bg-gradient-to-r ${story.color} p-3 rounded-lg`}>
                    <p className="text-sm text-white font-semibold">
                      {story.example}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LinkaeStorytelling;