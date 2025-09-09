import React, { memo } from 'react';
import { Building2, MessageSquare, Bot } from 'lucide-react';

interface ProgressiveAboutSectionProps {
  isVisible: boolean;
}

const ProgressiveAboutSection: React.FC<ProgressiveAboutSectionProps> = memo(({ isVisible }) => {
  const features = [
    {
      icon: Building2,
      title: "Painel Digital no Elevador",
      description: "Substitui murais físicos por tela moderna e profissional.",
      color: "purple"
    },
    {
      icon: MessageSquare,
      title: "Gestão via WhatsApp",
      description: "Publique avisos, imagens e programe comunicados pelo WhatsApp.",
      color: "blue"
    },
    {
      icon: Bot,
      title: "IA Especializada",
      description: "Assistente inteligente que facilita toda gestão de comunicação.",
      color: "purple"
    }
  ];

  return (
    <section className={`bg-white py-16 px-4 relative transition-all duration-500 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <div className="max-w-6xl mx-auto text-center">
        {/* Title with fast animation */}
        <h2 className={`text-4xl md:text-5xl font-bold mb-8 transition-all duration-400 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}>
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Painéis + WhatsApp + IA
          </span>
        </h2>
        
        {/* Features Grid with staggered animation */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClasses = feature.color === 'purple' 
              ? 'text-purple-600 border-purple-200' 
              : 'text-blue-600 border-blue-200';
            
            return (
              <div
                key={index}
                className={`bg-gray-50 p-8 rounded-2xl border shadow-lg transition-all duration-400 hover:scale-105 hover:shadow-xl ${colorClasses} ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-12 opacity-0'
                }`}
                style={{
                  transitionDelay: isVisible ? `${index * 100}ms` : '0ms'
                }}
              >
                <IconComponent className={`w-12 h-12 mx-auto mb-4 ${feature.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`} />
                <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

ProgressiveAboutSection.displayName = 'ProgressiveAboutSection';

export default ProgressiveAboutSection;