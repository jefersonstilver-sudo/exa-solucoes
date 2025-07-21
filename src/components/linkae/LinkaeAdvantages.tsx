
import React from 'react';
import { Calendar, PenTool, BarChart3, MessageSquare, Search, Headphones } from 'lucide-react';

const LinkaeAdvantages: React.FC = () => {
  const advantages = [
    {
      icon: Search,
      title: "Planejamento Estratégico",
      description: "Análise completa do seu negócio e definição de objetivos claros para redes sociais",
      color: "from-linkae-pink to-linkae-pink-light"
    },
    {
      icon: Calendar,
      title: "Calendário de Conteúdo",
      description: "Planejamento mensal com datas comemorativas e conteúdos relevantes para seu nicho",
      color: "from-linkae-orange to-linkae-orange-light"
    },
    {
      icon: PenTool,
      title: "Criação de Posts",
      description: "Feeds, Reels, Stories e conteúdos criativos que engajam sua audiência",
      color: "from-linkae-pink to-linkae-pink-light"
    },
    {
      icon: BarChart3,
      title: "Relatórios Mensais",
      description: "Métricas detalhadas de performance, alcance e engajamento dos seus conteúdos",
      color: "from-linkae-orange to-linkae-orange-light"
    },
    {
      icon: MessageSquare,
      title: "Diagnóstico Gratuito",
      description: "Avaliação completa das suas redes sociais com identificação de oportunidades",
      color: "from-linkae-pink to-linkae-pink-light"
    },
    {
      icon: Headphones,
      title: "Suporte via WhatsApp",
      description: "Atendimento direto e personalizado para tirar dúvidas e acompanhar resultados",
      color: "from-linkae-orange to-linkae-orange-light"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Diferenciais <span className="text-linkae-orange">LINKAÊ</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Tudo que você precisa para ter uma presença digital de sucesso
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-linkae-pink/30"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${advantage.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {advantage.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {advantage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LinkaeAdvantages;
