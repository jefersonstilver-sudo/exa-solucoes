import React from 'react';
import { Brain, BarChart3, Target, Lightbulb, Users, Zap } from 'lucide-react';

const LinkaeDifferentiators: React.FC = () => {
  const differentiators = [
    {
      icon: Brain,
      title: "Planejamento Personalizado",
      description: "Nunca mais fique sem saber o que postar",
      details: [
        "Análise completa do seu nicho",
        "Calendário editorial customizado",
        "Temas semanais estratégicos",
        "Adaptação ao seu público"
      ],
      color: "from-purple-500 to-indigo-600",
      highlight: "90% menos tempo pensando em conteúdo"
    },
    {
      icon: BarChart3,
      title: "Relatórios Analíticos",
      description: "Medimos cada conexão e conversão",
      details: [
        "Dashboard em tempo real",
        "Métricas de engajamento qualificado",
        "ROI por tipo de conteúdo",
        "Insights acionáveis semanais"
      ],
      color: "from-blue-500 to-cyan-600",
      highlight: "340% mais clareza sobre resultados"
    },
    {
      icon: Target,
      title: "Estratégia T.A.C.C.O.H.",
      description: "Metodologia exclusiva que funciona",
      details: [
        "6 pilares de conteúdo estratégico",
        "Combinações personalizadas",
        "Foco em conversão",
        "Comprovação científica"
      ],
      color: "from-pink-500 to-rose-600",
      highlight: "Posts que sempre têm propósito"
    },
    {
      icon: Lightbulb,
      title: "Criatividade Direcionada",
      description: "Ideias infinitas com objetivo claro",
      details: [
        "Banco de ideias inesgotável",
        "Criatividade com propósito",
        "Adaptação a trends",
        "Originalidade garantida"
      ],
      color: "from-orange-500 to-yellow-500",
      highlight: "Fim do bloqueio criativo"
    },
    {
      icon: Users,
      title: "Gestão de Comunidade",
      description: "Transformamos seguidores em clientes",
      details: [
        "Relacionamento ativo",
        "Respostas estratégicas",
        "Nutrição de leads",
        "Conversão em vendas"
      ],
      color: "from-green-500 to-emerald-600",
      highlight: "Comunidade que compra, não só curte"
    },
    {
      icon: Zap,
      title: "Agilidade Estratégica",
      description: "Rápidos nas trends, sólidos na estratégia",
      details: [
        "Aproveitamento de virais",
        "Adaptação em tempo real",
        "Planejamento flexível",
        "Execução ágil"
      ],
      color: "from-red-500 to-pink-500",
      highlight: "Sempre relevante, sempre estratégico"
    }
  ];

  return (
    <section className="h-[60vh] py-16 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Nossos <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Diferenciais</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Não somos apenas mais uma agência. Somos especialistas em resolver a dor de "não saber o que postar" com estratégia e resultados mensuráveis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {differentiators.map((diff, index) => {
            const IconComponent = diff.icon;
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/20 group hover:-translate-y-2"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${diff.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{diff.title}</h3>
                <p className="text-gray-300 mb-4">{diff.description}</p>
                
                <div className="space-y-2 mb-4">
                  {diff.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                      <span className="text-sm text-gray-300">{detail}</span>
                    </div>
                  ))}
                </div>
                
                <div className={`bg-gradient-to-r ${diff.color} p-3 rounded-lg`}>
                  <p className="text-white text-sm font-semibold text-center">
                    {diff.highlight}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom highlight */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-pink-400/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Resultado Garantido: Nunca Mais "Não Sei o Que Postar"
            </h3>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              Com nosso planejamento personalizado e metodologia T.A.C.C.O.H., você terá um ano inteiro de conteúdo estratégico que conecta, converte e cresce sua marca.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeDifferentiators;