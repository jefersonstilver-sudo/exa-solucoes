
import React from 'react';
import { MessageSquare, FileText, Image, Clock, Bot } from 'lucide-react';

interface WhatsAppSectionProps {
  isVisible: boolean;
}

const WhatsAppSection: React.FC<WhatsAppSectionProps> = ({ isVisible }) => {
  return (
    <section className={`py-20 px-4 bg-gray-50 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-16">
          <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tudo pelo WhatsApp
          </span>
        </h2>
        
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 mb-12">
          <MessageSquare className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-8 text-gray-900">Simples como uma conversa</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 mx-auto">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Publicar Avisos</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              "Publique: Reunião de condomínio dia 15/02 às 19h no salão de festas"
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 mx-auto">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Enviar Imagens</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Envie fotos de avisos, comunicados ou informações importantes
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 mx-auto">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">Programar</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              "Programe: Amanhã 8h - Limpeza da caixa d'água, água será interrompida"
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-4 mx-auto">
              <Bot className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-3">IA Ajuda</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Assistente inteligente formata e otimiza seus comunicados automaticamente
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;
