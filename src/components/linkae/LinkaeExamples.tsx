import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingCart, Play, ArrowRight } from 'lucide-react';

const LinkaeExamples: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const examples = [
    {
      id: 1,
      business: "Loja de Roupas",
      icon: "👗",
      before: {
        title: "ANTES",
        description: "Posts sem criatividade",
        metrics: ["50 curtidas", "3 comentários", "0 vendas online"],
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      after: {
        title: "DEPOIS",
        description: "Conexões que vendem",
        metrics: ["850+ curtidas", "127 comentários", "45 vendas/mês"],
        image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      color: "from-pink-400 to-rose-500"
    },
    {
      id: 2,
      business: "Clínica Médica",
      icon: "🏥",
      before: {
        title: "ANTES",
        description: "Dúvidas não respondidas",
        metrics: ["25 curtidas", "1 comentário", "5 consultas/mês"],
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      after: {
        title: "DEPOIS",
        description: "Educação que converte",
        metrics: ["420+ curtidas", "89 comentários", "35 consultas/mês"],
        image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      color: "from-blue-400 to-cyan-500"
    },
    {
      id: 3,
      business: "Evento/Festa",
      icon: "🎉",
      before: {
        title: "ANTES",
        description: "Sem buzz ou expectativa",
        metrics: ["30 curtidas", "2 compartilhamentos", "20% ocupação"],
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      after: {
        title: "DEPOIS",
        description: "Hype que lota eventos",
        metrics: ["1.2k+ curtidas", "340 compartilhamentos", "95% ocupação"],
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      color: "from-purple-400 to-indigo-500"
    },
    {
      id: 4,
      business: "Restaurante",
      icon: "🍽️",
      before: {
        title: "ANTES",
        description: "Sem fome emocional",
        metrics: ["40 curtidas", "5 comentários", "Mesa vazia"],
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      after: {
        title: "DEPOIS",
        description: "Conteúdo que dá água na boca",
        metrics: ["950+ curtidas", "156 comentários", "Reservas lotadas"],
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      color: "from-orange-400 to-red-500"
    },
    {
      id: 5,
      business: "Academia",
      icon: "💪",
      before: {
        title: "ANTES",
        description: "Conteúdo intimidador",
        metrics: ["60 curtidas", "8 comentários", "10 matrículas/mês"],
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      after: {
        title: "DEPOIS",
        description: "Motivação que inspira",
        metrics: ["680+ curtidas", "94 comentários", "42 matrículas/mês"],
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      color: "from-green-400 to-emerald-500"
    },
    {
      id: 6,
      business: "Loja Online",
      icon: "🛒",
      before: {
        title: "ANTES",
        description: "Sem ideias criativas",
        metrics: ["35 curtidas", "2 comentários", "3% conversão"],
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      after: {
        title: "DEPOIS",
        description: "Narrativas visuais que vendem",
        metrics: ["720+ curtidas", "118 comentários", "18% conversão"],
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
      },
      color: "from-yellow-400 to-orange-400"
    }
  ];

  return (
    <section className="h-[60vh] py-16 bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
            Transformações Reais
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Veja como diferentes tipos de negócio saíram de posts sem criatividade para conexões que realmente vendem
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {examples.map((example, index) => (
            <div
              key={example.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${example.color} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{example.icon}</span>
                  <h3 className="font-bold text-lg">{example.business}</h3>
                </div>
              </div>

              {/* Before/After Comparison */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="text-center">
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      {example.before.title}
                    </div>
                    <img 
                      src={example.before.image} 
                      alt="Antes" 
                      className="w-full h-20 object-cover rounded-lg mb-2 grayscale"
                    />
                    <p className="text-xs text-gray-600 mb-2">{example.before.description}</p>
                    <div className="space-y-1">
                      {example.before.metrics.map((metric, idx) => (
                        <div key={idx} className="text-xs text-red-600">{metric}</div>
                      ))}
                    </div>
                  </div>

                  {/* After */}
                  <div className="text-center">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                      {example.after.title}
                    </div>
                    <img 
                      src={example.after.image} 
                      alt="Depois" 
                      className="w-full h-20 object-cover rounded-lg mb-2"
                    />
                    <p className="text-xs text-gray-600 mb-2">{example.after.description}</p>
                    <div className="space-y-1">
                      {example.after.metrics.map((metric, idx) => (
                        <div key={idx} className="text-xs text-green-600 font-semibold">{metric}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transformation Arrow */}
                <div className="flex justify-center mt-4">
                  <ArrowRight className={`h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors ${hoveredCard === index ? 'animate-pulse' : ''}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LinkaeExamples;