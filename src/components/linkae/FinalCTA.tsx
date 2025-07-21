
import React from 'react';
import { Calendar, CheckCircle, Sparkles } from 'lucide-react';

interface FinalCTAProps {
  onScrollToForm: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onScrollToForm }) => {
  const benefits = [
    "Análise completa da sua presença digital",
    "Estratégia personalizada para seu negócio",
    "Manual exclusivo com 50+ ideias de posts",
    "Identificação de oportunidades de crescimento"
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-linkae-pink via-linkae-orange to-linkae-pink-light">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Oportunidade Limitada</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Agende sua <br />
              <span className="text-white drop-shadow-lg">Estratégia Gratuita</span>
            </h2>
            
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto leading-relaxed">
              Vamos transformar sua presença nas redes sociais com planejamento, criatividade e resultados que impactam seu faturamento.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left"
              >
                <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <button
              onClick={onScrollToForm}
              className="group bg-white text-linkae-pink font-bold text-xl px-12 py-6 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center mx-auto gap-3"
            >
              <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Agendar Estratégia Gratuita</span>
            </button>
            
            <p className="text-lg opacity-80">
              ⏰ Apenas <strong>30 minutos</strong> podem transformar seu negócio
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm opacity-70">
              <span>✅ Sem compromisso</span>
              <span>✅ 100% gratuito</span>
              <span>✅ Resultados garantidos</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
