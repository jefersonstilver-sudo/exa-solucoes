
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
      highlight: true
    },
    {
      id: 2,
      icon: Calendar,
      title: 'Calendário Editorial',
      description: 'Cronograma completo com todos os posts e stories planejados'
    },
    {
      id: 3,
      icon: PenTool,
      title: 'Criação de Conteúdo',
      description: 'Posts, stories e reels profissionais que convertem'
    },
    {
      id: 4,
      icon: BarChart3,
      title: 'Relatórios Mensais',
      description: 'Métricas detalhadas e insights para otimização contínua'
    },
    {
      id: 5,
      icon: ClipboardCheck,
      title: 'Diagnóstico Gratuito',
      description: 'Análise completa do seu perfil e identificação de oportunidades',
      highlight: true
    },
    {
      id: 6,
      icon: Headphones,
      title: 'Suporte WhatsApp',
      description: 'Atendimento personalizado e suporte em tempo real'
    },
    {
      id: 7,
      icon: Users,
      title: 'Gestão de Comunidade',
      description: 'Interação ativa com seguidores e construção de relacionamento'
    },
    {
      id: 8,
      icon: MessageCircle,
      title: 'Copywriting Otimizado',
      description: 'Textos persuasivos que geram engajamento e conversões'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-linkae-dark-blue">
            Por que escolher a <span className="text-linkae-bright-blue">LINKAÊ</span>?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Oferecemos uma solução completa para transformar suas redes sociais em uma máquina de vendas
          </p>
        </div>

        {/* Grid of Advantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map((advantage) => {
            const IconComponent = advantage.icon;
            
            return (
              <div
                key={advantage.id}
                className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:transform hover:scale-105 ${
                  advantage.highlight 
                    ? 'ring-2 ring-linkae-bright-blue/20 hover:ring-linkae-bright-blue/40' 
                    : 'hover:border-linkae-bright-blue/30'
                }`}
              >
                {/* Subtle gradient overlay for highlighted cards */}
                {advantage.highlight && (
                  <div className="absolute inset-0 bg-gradient-to-br from-linkae-bright-blue/5 to-transparent pointer-events-none" />
                )}

                {/* Icon Header */}
                <div className="p-8 text-center relative">
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linkae-bright-blue/10 rounded-xl flex items-center justify-center group-hover:bg-linkae-bright-blue/15 transition-colors duration-300">
                      <IconComponent className="h-8 w-8 text-linkae-bright-blue group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-bold text-linkae-dark-blue mb-3 group-hover:text-linkae-royal-blue transition-colors duration-300">
                      {advantage.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-8">
                  <p className="text-gray-600 text-center leading-relaxed text-sm">
                    {advantage.description}
                  </p>
                </div>

                {/* Hover effect indicator */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            );
          })}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto border border-gray-100">
            <h3 className="text-3xl font-bold text-linkae-dark-blue mb-6">
              Tudo isso em um só lugar
            </h3>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Não é apenas gestão de redes sociais. É uma <strong className="text-linkae-bright-blue">parceria estratégica</strong> para 
              fazer seu negócio crescer através do poder das redes sociais.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-linkae-dark-blue px-6 py-3 rounded-full border border-blue-100">
                <span className="text-linkae-bright-blue">✓</span>
                <span className="font-semibold">Sem contratos longos</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 text-linkae-dark-blue px-6 py-3 rounded-full border border-slate-200">
                <span className="text-linkae-bright-blue">✓</span>
                <span className="font-semibold">Resultados em 30 dias</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-linkae-dark-blue px-6 py-3 rounded-full border border-blue-100">
                <span className="text-linkae-bright-blue">✓</span>
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
