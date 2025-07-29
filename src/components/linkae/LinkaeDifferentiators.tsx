import React from 'react';
import { BarChart3, Calendar, Target, Users, Zap, Shield, Award } from 'lucide-react';

const LinkaeDifferentiators: React.FC = () => {
  const differentiators = [
    {
      icon: Calendar,
      title: "Planejamento Personalizado",
      description: "Criamos um calendário editorial único para seu negócio, alinhado com suas metas e público-alvo específico da região trinacional.",
      highlight: "30 dias de conteúdo estratégico"
    },
    {
      icon: BarChart3,
      title: "Relatórios Analíticos Completos", 
      description: "Acompanhe o desempenho real dos seus posts com métricas que importam: vendas, leads qualificados e ROI real.",
      highlight: "Relatórios semanais detalhados"
    },
    {
      icon: Target,
      title: "Metodologia T.A.C.C.O.H. Exclusiva",
      description: "Nosso método foi desenvolvido especificamente para empresários da tríplice fronteira, considerando cultura local e comportamento digital.",
      highlight: "Método testado e aprovado"
    },
    {
      icon: Users,
      title: "Foco em Conversão Real",
      description: "Não fazemos apenas posts bonitos. Criamos conteúdo que gera vendas, agendamentos e resultados financeiros mensuráveis.",
      highlight: "Média de 300% de aumento em vendas"
    },
    {
      icon: Zap,
      title: "Implementação em 48h",
      description: "Começamos a trabalhar imediatamente. Em menos de 48h você já terá conteúdo estratégico sendo publicado.",
      highlight: "Start rápido garantido"
    },
    {
      icon: Shield,
      title: "Garantia de Resultados",
      description: "Se você não ver resultados em 30 dias, devolvemos 100% do seu investimento. Simples assim.",
      highlight: "Garantia total de 30 dias"
    }
  ];

  return (
    <section className="h-[60vh] flex items-center justify-center bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Por Que Somos <span className="text-[#FF8A80]">Diferentes</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Não somos mais uma agência digital. Somos especialistas em transformar empresários perdidos em redes sociais em verdadeiras máquinas de vendas online na região trinacional.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {differentiators.map((diff, index) => (
            <div
              key={index}
              className="relative group p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                  index % 2 === 0 ? 'bg-[#FF8A80]/10' : 'bg-[#F57C00]/10'
                }`}>
                  <diff.icon className={`w-6 h-6 ${
                    index % 2 === 0 ? 'text-[#FF8A80]' : 'text-[#F57C00]'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{diff.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{diff.description}</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    index % 2 === 0 ? 'bg-[#FF8A80]/10 text-[#FF8A80]' : 'bg-[#F57C00]/10 text-[#F57C00]'
                  }`}>
                    {diff.highlight}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-r from-[#FF8A80]/10 to-[#FF8A80]/5 rounded-2xl p-6 border border-[#FF8A80]/20">
            <div className="flex items-center mb-4">
              <Award className="w-8 h-8 text-[#FF8A80] mr-3" />
              <h3 className="text-xl font-bold text-gray-900">
                Garantia de Resultados
              </h3>
            </div>
            <p className="text-gray-700">
              Se você não ver resultados concretos em suas vendas ou agendamentos em 30 dias, 
              <strong className="text-[#FF8A80]"> devolvemos 100% do seu investimento</strong>.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-[#F57C00]/10 to-[#F57C00]/5 rounded-2xl p-6 border border-[#F57C00]/20">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-8 h-8 text-[#F57C00] mr-3" />
              <h3 className="text-xl font-bold text-gray-900">
                Acompanhamento Semanal
              </h3>
            </div>
            <p className="text-gray-700">
              Relatórios detalhados toda semana mostrando <strong className="text-[#F57C00]">exatamente como seus posts estão gerando vendas</strong> e o ROI real do seu investimento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeDifferentiators;