import React from 'react';
import { Cpu, Wifi, Shield, Zap } from 'lucide-react';

const IntelligentSystemsSection: React.FC = () => {
  const systems = [
    {
      icon: Cpu,
      title: "Processamento em Nuvem",
      description: "Gerenciamento centralizado de todos os painéis com atualizações automáticas",
      features: ["Controle remoto", "Atualizações OTA", "Monitoramento 24/7"]
    },
    {
      icon: Wifi,
      title: "Conectividade 5G",
      description: "Internet de alta velocidade garante qualidade de reprodução sem falhas",
      features: ["Upload instantâneo", "Streaming 4K", "Backup automático"]
    },
    {
      icon: Shield,
      title: "Segurança Avançada",
      description: "Proteção completa contra ataques cibernéticos e vandalismo digital",
      features: ["Criptografia end-to-end", "Firewall dedicado", "Logs de auditoria"]
    },
    {
      icon: Zap,
      title: "Eficiência Energética",
      description: "Tecnologia LED de baixo consumo com sensores de luminosidade",
      features: ["Economia de 70%", "Ajuste automático", "Modo eco inteligente"]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Sistemas <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">Inteligentes</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Tecnologia de ponta que garante performance máxima e confiabilidade total dos nossos painéis digitais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {systems.map((system, index) => {
            const IconComponent = system.icon;
            return (
              <div
                key={index}
                className="bg-slate-700/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-600 hover:border-green-500/50 transition-all duration-300 group"
              >
                <div className="flex items-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{system.title}</h3>
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">{system.description}</p>
                
                <div className="space-y-3">
                  {system.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 backdrop-blur-sm p-8 rounded-2xl border border-green-500/20">
            <h3 className="text-2xl font-bold mb-4">Infraestrutura Robusta</h3>
            <p className="text-gray-300 text-lg">
              99.8% de uptime garantido com redundância completa e suporte técnico 24/7
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntelligentSystemsSection;