
import React from 'react';
import { Calendar, ArrowRight, Clock, Users, TrendingUp } from 'lucide-react';

interface FinalCTASectionProps {
  onScrollToForm: () => void;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onScrollToForm }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-linkae-dark-blue to-linkae-royal-blue relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-72 h-72 bg-linkae-cyan-light/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-linkae-bright-blue/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Main Content */}
        <div className="text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Agende uma
            <span className="block bg-gradient-to-r from-linkae-cyan-light to-linkae-bright-blue bg-clip-text text-transparent">
              Estratégia Gratuita
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 text-linkae-cyan-light/90 max-w-3xl mx-auto leading-relaxed">
            Vamos transformar sua presença nas redes sociais com planejamento, criatividade e resultados.
          </p>

          <p className="text-lg mb-12 text-white/80 max-w-2xl mx-auto">
            Em 30 minutos, você vai descobrir exatamente como aplicar o método T.A.C.C.O.H. no seu negócio 
            e começar a ver resultados reais.
          </p>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-linkae-cyan-light/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-linkae-cyan-light" />
              </div>
              <h3 className="text-lg font-semibold mb-2">30 Minutos</h3>
              <p className="text-sm text-white/70">Diagnóstico completo do seu perfil</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-linkae-bright-blue/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-linkae-bright-blue" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Estratégia Personalizada</h3>
              <p className="text-sm text-white/70">Plano específico para o seu nicho</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Resultado Imediato</h3>
              <p className="text-sm text-white/70">Primeiras melhorias em 7 dias</p>
            </div>
          </div>

          {/* Main CTA Button */}
          <div className="space-y-6">
            <button
              onClick={onScrollToForm}
              className="group bg-gradient-to-r from-linkae-cyan-light to-linkae-bright-blue text-linkae-dark-blue font-bold px-12 py-6 rounded-2xl text-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center gap-4"
            >
              <Calendar className="h-6 w-6" />
              <span>Agendar Reunião Gratuita</span>
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Sem compromisso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>100% gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Resultados garantidos</span>
              </div>
            </div>
          </div>

          {/* Urgency */}
          <div className="mt-12 inline-flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-orange-400/30">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-orange-200">
              Apenas 5 vagas disponíveis esta semana
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
