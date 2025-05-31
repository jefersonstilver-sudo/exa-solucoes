
import React from 'react';
import { Building2, MessageSquare, Bot } from 'lucide-react';

interface AboutSectionProps {
  isVisible: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({ isVisible }) => {
  return (
    <section className={`py-20 px-4 relative transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Painéis + WhatsApp + IA
          </span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
            <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">Painel Digital no Elevador</h3>
            <p className="text-gray-300">Substitui murais físicos por tela moderna e profissional.</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/20">
            <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">Gestão via WhatsApp</h3>
            <p className="text-gray-300">Publique avisos, imagens e programe comunicados pelo WhatsApp.</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20">
            <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4">IA Especializada</h3>
            <p className="text-gray-300">Assistente inteligente que facilita toda gestão de comunicação.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
