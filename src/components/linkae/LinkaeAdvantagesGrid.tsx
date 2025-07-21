
import React from 'react';
import { 
  Calendar, 
  PenTool, 
  BarChart3, 
  MessageCircle, 
  ClipboardCheck, 
  Headphones,
  Target,
  Users
} from 'lucide-react';

const LinkaeAdvantagesGrid: React.FC = () => {
  const advantages = [
    {
      id: 1,
      icon: Target,
      title: 'Planejamento Estratégico',
      description: 'Estratégia personalizada baseada no seu nicho e objetivos',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 2,
      icon: Calendar,
      title: 'Calendário Editorial',
      description: 'Cronograma completo com todos os posts e stories planejados',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 3,
      icon: PenTool,
      title: 'Criação de Conteúdo',
      description: 'Posts, stories e reels profissionais que convertem',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 4,
      icon: BarChart3,
      title: 'Relatórios Mensais',
      description: 'Métricas detalhadas e insights para otimização contínua',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 5,
      icon: ClipboardCheck,
      title: 'Diagnóstico Gratuito',
      description: 'Análise completa do seu perfil e identificação de oportunidades',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      id: 6,
      icon: Headphones,
      title: 'Suporte WhatsApp',
      description: 'Atendimento personalizado e suporte em tempo real',
      color: 'from-teal-500 to-green-600'
    },
    {
      id: 7,
      icon: Users,
      title: 'Gestão de Comunidade',
      description: 'Interação ativa com seguidores e construção de relacionamento',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 8,
      icon: MessageCircle,
      title: 'Copywriting Otimizado',
      description: 'Textos persuasivos que geram engajamento e conversões',
      color: 'from-rose-500 to-pink-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-linkae-dark-blue/5 to-linkae-royal-blue/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-linkae-dark-blue">
            Por que escolher a <span className="text-linkae-bright-blue">LINKAÊ</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Oferecemos uma solução completa para transformar suas redes sociais em uma máquina de vendas
          </p>
        </div>

        {/* Grid of Advantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {advantages.map((advantage) => {
            const IconComponent = advantage.icon;
            
            return (
              <div
                key={advantage.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden hover:transform hover:scale-105"
              >
                {/* Icon Header */}
                <div className={`bg-gradient-to-r ${advantage.color} p-8 text-white text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold">{advantage.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 text-center leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-linkae-dark-blue mb-6">
              Tudo isso em um só lugar
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Não é apenas gestão de redes sociais. É uma <strong className="text-linkae-bright-blue">parceria estratégica</strong> para 
              fazer seu negócio crescer através do poder das redes sociais.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                <span className="text-green-500">✓</span>
                <span className="font-semibold">Sem contratos longos</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                <span className="text-blue-500">✓</span>
                <span className="font-semibold">Resultados em 30 dias</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                <span className="text-purple-500">✓</span>
                <span className="font-semibold">Suporte personalizado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeAdvantagesGrid;
