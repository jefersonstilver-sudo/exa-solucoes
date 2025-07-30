
import React from 'react';
import { MessageSquare } from 'lucide-react';

interface WhatsAppSectionProps {
  isVisible: boolean;
}

const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({ isVisible }) => {
  return (
    <section className={`py-20 px-4 bg-gray-800/30 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Tudo pelo WhatsApp
          </span>
        </h2>
        
        <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 p-12 rounded-3xl border border-green-500/30">
          <MessageSquare className="w-24 h-24 text-green-400 mx-auto mb-8" />
          
          <h3 className="text-2xl font-bold mb-6">Simples como uma conversa</h3>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h4 className="font-bold text-green-400 mb-4">📝 Publicar Avisos:</h4>
              <p className="text-gray-300 mb-4">"Publique: Reunião de condomínio dia 15/02 às 19h no salão de festas"</p>
            </div>
            
            <div>
              <h4 className="font-bold text-green-400 mb-4">📸 Enviar Imagens:</h4>
              <p className="text-gray-300 mb-4">Envie fotos de avisos, comunicados ou informações importantes</p>
            </div>
            
            <div>
              <h4 className="font-bold text-green-400 mb-4">⏰ Programar:</h4>
              <p className="text-gray-300 mb-4">"Programe: Amanhã 8h - Limpeza da caixa d'água, água será interrompida"</p>
            </div>
            
            <div>
              <h4 className="font-bold text-green-400 mb-4">🤖 IA Ajuda:</h4>
              <p className="text-gray-300 mb-4">Assistente inteligente formata e otimiza seus comunicados automaticamente</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;
