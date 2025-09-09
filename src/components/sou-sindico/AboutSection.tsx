
import React, { memo } from 'react';
import { Building2, MessageSquare, Bot } from 'lucide-react';

interface HeroSectionProps {
  isVisible: boolean;
}

const AboutSection = memo<{ isVisible: boolean }>(({ isVisible }) => {
  return (
    <section className={`bg-white py-20 px-4 relative motion-safe:transition-all motion-safe:duration-500 will-change-transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Painéis + WhatsApp + IA
          </span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-gray-50 p-8 rounded-2xl border border-purple-200 shadow-lg">
            <Building2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4 text-gray-900">Painel Digital no Elevador</h3>
            <p className="text-gray-600">Substitui murais físicos por tela moderna e profissional.</p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-2xl border border-blue-200 shadow-lg">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4 text-gray-900">Gestão via WhatsApp</h3>
            <p className="text-gray-600">Publique avisos, imagens e programe comunicados pelo WhatsApp.</p>
          </div>
          
          <div className="bg-gray-50 p-8 rounded-2xl border border-purple-200 shadow-lg">
            <Bot className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4 text-gray-900">IA Especializada</h3>
            <p className="text-gray-600">Assistente inteligente que facilita toda gestão de comunicação.</p>
          </div>
        </div>
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';

export default AboutSection;
