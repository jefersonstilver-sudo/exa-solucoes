import React from 'react';
import { BarChart3, Eye, Users, TrendingUp, Clock, MapPin } from 'lucide-react';

const ExaAnalyticsSection: React.FC = () => {
  const analyticsFeatures = [
    {
      icon: Eye,
      title: "Impressões em Tempo Real",
      description: "Monitoramento preciso de quantas pessoas visualizaram sua campanha"
    },
    {
      icon: Users,
      title: "Demografia do Público",
      description: "Análise detalhada de idade, gênero e perfil socioeconômico"
    },
    {
      icon: Clock,
      title: "Horários de Pico",
      description: "Identificação dos melhores momentos para sua mensagem"
    },
    {
      icon: MapPin,
      title: "Geolocalização",
      description: "Rastreamento de origem geográfica da audiência"
    },
    {
      icon: TrendingUp,
      title: "ROI Detalhado",
      description: "Cálculo preciso do retorno sobre investimento"
    },
    {
      icon: BarChart3,
      title: "Relatórios Customizados",
      description: "Dashboards personalizados para cada cliente"
    }
  ];

  return (
    <section className="py-20 bg-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Analytics <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Avançados</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Meça cada aspecto da sua campanha com precisão científica. Dados reais para decisões inteligentes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {analyticsFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-slate-600 hover:border-cyan-500/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Dashboard Preview */}
        <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700">
          <h3 className="text-2xl font-bold mb-6 text-center">Dashboard em Tempo Real</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Impressões Hoje</span>
                <Eye className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400">247,891</div>
              <div className="text-green-400 text-sm">+23% vs ontem</div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Engajamento</span>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">8.7%</div>
              <div className="text-green-400 text-sm">+1.2% vs média</div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">CTR</span>
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">3.4%</div>
              <div className="text-green-400 text-sm">+0.8% vs setor</div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">ROI</span>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">425%</div>
              <div className="text-green-400 text-sm">Acima da meta</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-300 mb-4">
              Acesse seu dashboard personalizado 24/7 via web ou app mobile
            </p>
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300">
              Ver Demo do Dashboard
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAnalyticsSection;