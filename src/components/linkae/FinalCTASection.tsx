
import React from 'react';
import { Calendar, ArrowRight, Clock, Users, TrendingUp } from 'lucide-react';
import PostCarousel from './PostCarousel';

interface FinalCTASectionProps {
  onScrollToForm: () => void;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onScrollToForm }) => {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue relative overflow-hidden">
      {/* Background Effects com cores rosa e laranja */}
      <div className="absolute inset-0 hidden md:block">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-linkae-pink/20 to-linkae-orange/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-linkae-orange/15 to-linkae-pink/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-linkae-pink/5 to-linkae-orange/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header CTA Principal */}
        <div className="text-center text-white mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-linkae-pink to-linkae-orange bg-clip-text text-transparent">
              Agende uma
            </span>
            <span className="block text-white">
              Reunião Gratuita
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Veja como transformamos posts comuns em conexões que vendem
          </p>
        </div>

        {/* Carrossel de Posts */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-6 md:mb-8">
            Exemplos Reais de Transformação
          </h3>
          <PostCarousel />
        </div>

        {/* Benefits Grid - Responsivo com stack no mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-linkae-pink/30 hover:border-linkae-orange/50 transition-all duration-300 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-linkae-pink to-linkae-orange rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2 text-white text-center">30 Minutos</h3>
            <p className="text-sm text-white/70 text-center">Diagnóstico completo do seu perfil</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-linkae-orange/30 hover:border-linkae-pink/50 transition-all duration-300 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-linkae-orange to-linkae-pink rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2 text-white text-center">Estratégia Personalizada</h3>
            <p className="text-sm text-white/70 text-center">Plano específico para o seu nicho</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-linkae-pink/30 hover:border-linkae-orange/50 transition-all duration-300 group sm:col-span-3 md:col-span-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-linkae-pink to-linkae-orange rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2 text-white text-center">Resultado Imediato</h3>
            <p className="text-sm text-white/70 text-center">Primeiras melhorias em 7 dias</p>
          </div>
        </div>

        {/* Main CTA Button com gradiente rosa-laranja */}
        <div className="text-center space-y-4 md:space-y-6">
          <button
            onClick={onScrollToForm}
            className="group bg-gradient-to-r from-linkae-pink to-linkae-orange text-white font-bold px-8 md:px-12 py-4 md:py-6 rounded-2xl text-lg md:text-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3 md:gap-4 relative overflow-hidden w-full sm:w-auto"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <Calendar className="h-5 w-5 md:h-6 md:w-6 relative z-10" />
            <span className="relative z-10">Agendar Reunião Gratuita</span>
            <ArrowRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform relative z-10" />
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-linkae-orange">✓</span>
              <span>Sem compromisso</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-linkae-orange">✓</span>
              <span>100% gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-linkae-orange">✓</span>
              <span>Resultados garantidos</span>
            </div>
          </div>
        </div>

        {/* Urgency com cores dinâmicas */}
        <div className="mt-8 md:mt-12 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-linkae-orange/20 to-linkae-pink/20 backdrop-blur-sm px-4 md:px-6 py-2 md:py-3 rounded-full border border-linkae-orange/30">
            <div className="w-2 h-2 bg-linkae-orange rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-white">
              Apenas 5 vagas disponíveis esta semana
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
